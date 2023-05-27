import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Triangle} from "../../../../libs/three/math/Triangle.js";

let  p1  = new Vector3();
let  p2  = new Vector3();
let  p3  = new Vector3();

let  p0  = {x:0, y:0, z:0};
let  triangle = new Triangle();

let points = [];

let calcVec1 = new Vector3();
let calcVec2 = new Vector3();
let physicsApi;
let iWeightCurve;
let jWeightCurve;

let  defaultoptions = {
    "type":"array",
    "state":true,
    "three_terrain":"plain_ground",
    "vegetation_system":"basic_grassland",
    "terrain_size":400,
    "terrain_segments":255,
    "invert_hill":false,
    "terrain_edge_size":100,
    "edge_easing":"clampSin",
    "max_height":15,
    "min_height":-4,
    "frequency":3,
    "steps":6
};




let getPieceTerrainModule = function(piece) {
    return piece.getModuleByIndex(0);
};

let getTerrainSegmentse = function(module) {
    return module.data.applies.terrain_segments;
};

let getTerrainModuleSize = function(module) {
    return module.data.applies.terrain_size;
};

let clampSin = function() {
    return function(value) {
        return Math.sin(value*Math.PI*0.5)
    }
};


let setTri = function(tri, x, y, z) {
    tri.x = x;
    tri.y = y;
    tri.z = z;
}

let getEdgeEasing = function(applies) {
    let  easing = THREE.Terrain.EaseInOut;

    if (applies.edge_easing) {
        if (this[applies.edge_easing]) {
            easing = this[applies.edge_easing]()
        } else {
            easing = THREE.Terrain[applies.edge_easing];
        }
    };
    return easing;
};

let getTerrainModuleEdges = function(applies) {
    let  easing = getEdgeEasing(applies);

    return {
        invert: applies.invert_hill,
        edgeSize: applies.terrain_edge_size,
        easingFunc:easing
    }
};

let getTerrainModuleOpts = function(applies) {

    let  easing = getEdgeEasing(applies);

    return {
        after: null,
        easing: easing,
        heightmap: THREE.Terrain.DiamondSquare,
        material: null,
        maxHeight: applies.max_height,
        minHeight: applies.min_height,
        optimization: THREE.Terrain.NONE,
        frequency: applies.frequency,
        steps: applies.steps,
        stretch: true,
        turbulent: false,
        //    useBufferGeometry: true,
        xSegments: applies.terrain_segments,
        xSize: applies.terrain_size,
        ySegments: applies.terrain_segments,
        ySize: applies.terrain_size
    }
};

let setEdgeVerticeHeight = function(array1d, height) {

    let  sideVerts = Math.sqrt(array1d.length);
    let  totalVerts = array1d.length;

    let  bottomVert = 0;
    let  topVert = 0;
    let  leftVert = 0;
    let  rightVert = 0;

    for (let  i = 0; i < sideVerts; i++) {

        bottomVert = i;
        topVert = totalVerts - sideVerts + i;

        leftVert = sideVerts * i;
        rightVert = sideVerts * i + sideVerts - 1;

        array1d[bottomVert].z = height;
        array1d[topVert].z = height;
        array1d[leftVert].z = height;
        array1d[rightVert].z = height;
    }

};

let  makeMatrix2D = function(array1d) {

    let  tgt = new Array(Math.sqrt(array1d.length)),
        xl = Math.sqrt(array1d.length),
        yl = Math.sqrt(array1d.length),
        i, j;
    for (i = 0; i < xl; i++) {
        tgt[i] = new Float64Array(xl);
        for (j = 0; j < yl; j++) {
            tgt[i][j] = array1d[j * xl + i];
        }
    }

    return tgt;

};

let  elevateTerrain = function(array1d, elevation) {

    for (let  i = 0; i < array1d.length; i++) {
        array1d[i] += elevation;
    }

};

let  elevateTerrainVerts = function(vertices, elevation) {

    for (let  i = 0; i < vertices.length; i++) {
        vertices[i].z += elevation;

    }

};

let  sliceGeometryAtSeaLevel = function(vertices, maxDepth) {

    let  depth;

    for (let  i = 0; i < vertices.length; i++) {
        depth = vertices[i].z  // - maxDepth;
        if (depth < -3) {
            vertices[i].z = maxDepth;
        } else if (depth < 0.5) {
            vertices[i].z -= 5;
        } else if (depth <   5) {
            vertices[i].z += 14;
        }
    }
};




let getTriangleAt = function(array1d, segments, x, y, terrainScale) {

    let zScale = terrainScale.y;

    let  xc = Math.ceil(x);
    let  xf = Math.floor(x);
    let  yc = Math.ceil(y);
    let  yf = Math.floor(y);

    let  fracX = x - xf;
    let  fracY = y - yf;

    p1.x = xf;
    p1.y = yc;

    p1.z = getAt(array1d, segments, xf, yc)*zScale;


    setTri(p1, xf, yc, getAt(array1d, segments,xf, yc)*zScale);
    setTri(p2, xc, yf, getAt(array1d, segments,xc, yf)*zScale);


    if (fracX < 1-fracY) {
        setTri(p3,xf,yf,getAt(array1d, segments,xf, yf)*zScale);
    } else {
        setTri(p3, xc, yc, getAt(array1d, segments,xc, yc)*zScale);
    }



    points[0] = p1;
    points[1] = p2;
    points[2] = p3;
    return points;
};

let getDisplacedHeight = function(array1d, segments, x, z, htP, htN, normalStore, terrainScale) {
    let  tx = displaceAxisDimensions(x, htN, htP, segments);
    let  tz = displaceAxisDimensions(z, htN, htP, segments);

    return getPreciseHeight(array1d, segments, tx, tz, normalStore, htN, htP, terrainScale);

};

let getHeightAt = function(pos, array1d, terrainSize, segments, normalStore, terrainScale) {

    let  htP = terrainSize*0.5;
    let  htN = - htP;

    if (pos.x < htN || pos.z < htN) {
        console.log("Terrain!", pos.x, pos.z, htP, htN ,"Is Outside WORKER");
        GuiAPI.printDebugText("Is Outside Terrain at "+pos.x < htN+" "+pos.z < htN)
        return false;
        pos.x = MATH.clamp(pos.x, htN, htP);
        pos.z = MATH.clamp(pos.z, htN, htP);
    }

    if (pos.x > htP  || pos.z > htP) {
        console.log("Terrain!", pos.x, pos.z, htP, htN ,"Is Outside WORKER");
        GuiAPI.printDebugText("Is Outside Terrain at "+pos.x > htP+" "+ pos.z > htP)
        return false;
        pos.x = MATH.clamp(pos.x, htN, htP);
        pos.z = MATH.clamp(pos.z, htN, htP);
    }

    return getDisplacedHeight(array1d, segments, pos.x, pos.z, htP, htN, normalStore, terrainScale);
};



// get a height at point from matrix
let getPointInMatrix = function(matrixData, y, x) {
    return matrixData[x][y];
};

let displaceAxisDimensions = function(axPos, axMin, axMax, quadCount) {
    let  matrixPos = axPos-axMin;
    return quadCount*matrixPos/(axMax - axMin);
};


let returnToWorldDimensions = function(axPos, axMin, axMax, quadCount) {
    let  quadSize = (axMax-axMin) / quadCount;
    let  insidePos = axPos * quadSize;
    return axMin+insidePos;
};



// get the value at the precise integer (x, y) coordinates
let getAt = function(array1d, segments, x, y) {

    let  yFactor = (y) * (segments+1);
    let  xFactor = x;

    let  idx = (yFactor + xFactor);

    ThreeAPI.tempVec3.x = x -segments*0.5;
    ThreeAPI.tempVec3.z = y -segments*0.5;

    ThreeAPI.tempVec3.y = array1d[idx * 4]/255 +0.2;
  //  console.log(array1d[idx * 4])

    let rgba = {
        x:array1d[idx * 4] / 255,
        y:array1d[idx * 4+1] / 255,
        z:array1d[idx * 4+2] / 255
    }

    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: ThreeAPI.tempVec3, color:rgba, size:0.4});

    return array1d[idx * 4] / 255;
};

// get the value at the precise integer (x, y) coordinates
let setAt = function(height, array1d, segments, x, y, weight) {

    let  factor = weight || 1;

    if (x <= 2 || x >= segments-2 || y <= 2 || y >= segments-2) {
        console.log("FLATTEN OUTSIDE TERRING WONT WORK!");
        return;
    }

    let  yFactor = (y) * (segments+1);
    let  xFactor = x;

    let  idx = (yFactor + xFactor);
//    console.log(y, yFactor, xFactor, idx);
    array1d[idx] = height * factor + array1d[idx]* (1 - factor);
};

let getTerrainArray1d = function(terrain) {
    let  array1d = THREE.Terrain.toArray1D(terrain.children[0].geometry.vertices, terrain.edges.invert);
    return array1d;
};

let applyEdgeElevation = function(piece, isMinX, isMaxX, isMinY, isMaxY, elevation) {

    let  module = this.getPieceTerrainModule(piece);
    let  array1d = module.state.value;

    let  sideVerts = Math.sqrt(array1d.length);
    let  totalVerts = array1d.length;

    let  bottomVert = 0;
    let  topVert = 0;
    let  leftVert = 0;
    let  rightVert = 0;

    let  shoreBumb = 1;

    let  half = Math.ceil(sideVerts/2);

    let  idx = Math.floor(array1d.length / 2);

    let  setHeight = MATH.expand(array1d[idx]+4, -2, 2);


    for (let  i = 0; i < sideVerts; i++) {

        bottomVert = i;
        topVert = totalVerts - sideVerts + i;

        leftVert = sideVerts * i;
        rightVert = sideVerts * i + sideVerts - 1;


        if (isMinX) {

            for (let  j = 0; j < half; j++) {
                array1d[bottomVert + j*sideVerts] = MATH.expand(array1d[bottomVert + j*sideVerts]*(j/half) + elevation*(1-(j/half)),-0.5, 0.2);
            }
        }

        if (isMaxX) {

            for (let  j = 0; j < half; j++) {
                array1d[topVert - j*sideVerts] = MATH.expand(array1d[topVert - j*sideVerts]*(j/half) + elevation*(1-(j/half)),-0.5, 0.2);
            }
        }

        if (isMinY) {

            for (let  j = 0; j < half; j++) {
                array1d[leftVert + j] = MATH.expand(array1d[leftVert + j]*(j/half) + elevation*(1-(j/half)),-0.5, 0.2);
            }
        }

        if (isMaxY) {

            for (let  j = 0; j < half; j++) {
                array1d[rightVert - j] =  MATH.expand(array1d[rightVert - j]*(j/half) + elevation*(1-(j/half)),-0.5, 0.2);
            }
        }
    }

    if (isMinX || isMaxX || isMinY || isMaxY) {

        this.setHeightByIndexAndReach(array1d, idx, idx, Math.round(i*shoreBumb), setHeight)
        return true;
    }
    return false;

};

let getTerrainBuffers = function(terrain) {

    terrain.children[0].geometry.computeFaceNormals();
    terrain.children[0].geometry.computeVertexNormals();

    let  bufferGeo = new THREE.BufferGeometry().fromGeometry( terrain.children[0].geometry );
    let  position = bufferGeo.attributes.position.array;
    let  normal = bufferGeo.attributes.normal.array;
    let  color = bufferGeo.attributes.color.array;
    let  uv = bufferGeo.attributes.uv.array;
    return [position, normal, color, uv, getTerrainArray1d(terrain)];

};


let getPreciseHeight = function(array1d, segments, x, z, normalStore, htN, htP, terrainScale) {
    let  tri = getTriangleAt(array1d, segments, x, z, terrainScale);

    setTri(p0, x, z, 0);

    let  find = MATH.barycentricInterpolation(tri[0], tri[1], tri[2], p0);


    if (normalStore) {

        triangle.a.x =  returnToWorldDimensions(tri[0].x, htN, htP, segments);
        triangle.a.z =  returnToWorldDimensions(tri[0].y, htN, htP, segments);
        triangle.a.y =  tri[0].z;

        triangle.b.x =  returnToWorldDimensions(tri[1].x, htN, htP, segments);
        triangle.b.z =  returnToWorldDimensions(tri[1].y, htN, htP, segments);
        triangle.b.y =  tri[1].z;

        triangle.c.x =  returnToWorldDimensions(tri[2].x, htN, htP, segments);
        triangle.c.z =  returnToWorldDimensions(tri[2].y, htN, htP, segments);
        triangle.c.y =  tri[2].z;

        if (triangle.a.equals(triangle.b)) {
            //    console.log("TrianglePoint is the same..., A & B");
            if (triangle.b.equals(triangle.c)) {
                //     console.log("TrianglePoint is the same..., B & C");

                //    if (triangle.a.equals(triangle.c)) {
                console.log("TrianglePoint is the same..., A, B & C", x, z);
                //    }
            }

        }

        triangle.getNormal(normalStore);

        if (normalStore.y < 0) {
            normalStore.negate();
        }

        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:triangle.a, color:'GREEN', size:0.2});
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:triangle.b, color:'GREEN', size:0.2});
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:triangle.c, color:'GREEN', size:0.2});

        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:triangle.a, to:triangle.b, color:'AQUA'});
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:triangle.b, to:triangle.c, color:'AQUA'});
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:triangle.c, to:triangle.a, color:'AQUA'});

    }

    return find.z;
};


let setTerrainHeightAt = function(groundPiece, pos, reach) {

    let  module = this.getPieceTerrainModule(groundPiece);

    calcVec1.setVec(groundPiece.spatial.pos);

    calcVec2.setVec(pos);
    calcVec2.subVec(calcVec1);

    let  terrainSize = this.getTerrainModuleSize(module);
    let  segments = this.getTerrainSegmentse(module);

    let  array1d = module.state.value;

    this.setHeightAt(module, calcVec2, array1d, terrainSize, segments, pos.getY(), reach);
};


let setHeightAt = function(module, posVec, array1d, terrainSize, segments, height, reach) {
    let  pos = posVec.data;

    let  htP = terrainSize;
    let  htN = -htP;

    if (pos[0] < htN || pos[0] > htP || pos[2] < htN || pos[2] > htP) {

        console.log("Terrain!", pos[0], pos[2], "Is Outside")
        //    return -1000;
        pos[0] = MATH.clamp(pos[0], htN, htP);
        pos[2] = MATH.clamp(pos[2], htN, htP);
    }


    let  x = this.displaceAxisDimensions(2*pos[0]-terrainSize, htN, htP, segments);
    let  y = this.displaceAxisDimensions(2*pos[2]-terrainSize, htN, htP, segments);


    let  xf = Math.floor(x);
    let  yf = Math.floor(y);


    let  vertexReach = Math.ceil(reach / (terrainSize/segments))+1;

    // height = -1
    this.setHeightByIndexAndReach(array1d, xf, yf, vertexReach, height)

};

let setHeightByIndexAndReach = function(array1d, xf, yf, vertexReach, height) {

    let  segments = Math.sqrt(array1d.length)-1;

    for (let  i = -vertexReach; i < vertexReach+1; i++) {

        let  iw =  Math.cos((i) / (vertexReach+1));

        for (let  j = -vertexReach; j < vertexReach+1; j++) {

            let  jw = Math.cos((j) / (vertexReach+1));

            let  cw = MATH.clamp(iw*jw * 1.40, 0, 1);

            let  ijW = cw * cw * ((cw)+MATH.sillyRandom(i*2.1231+j*31.5123)*(1-cw)) * ((cw)+MATH.sillyRandom((i+j)*4.31+j*31.513)*(1-cw)); // jWeight*iWeight;

            this.setAt(height, array1d, segments,xf+i, yf+j, ijW);
        }
    }
};

class TerrainFunctions {
            constructor() {
                iWeightCurve = new MATH.CurveState(MATH.curves['zeroOneZero'], 1);
                jWeightCurve = new MATH.CurveState(MATH.curves['zeroOneZero'], 1);

            }

        createTerrain = function(moduleOptions) {

            moduleOptions = moduleOptions || defaultoptions;


            let  edges = getTerrainModuleEdges(moduleOptions);
            let  opts = getTerrainModuleOpts(moduleOptions);

            let  terrain = new THREE.Terrain(opts);
            terrain.opts = opts;
            terrain.edges = edges;
            terrain.options = moduleOptions

            elevateTerrainVerts(terrain.children[0].geometry.vertices, 1);
             THREE.Terrain.Edges(terrain.children[0].geometry.vertices, opts, false, edges.edgeSize, null) // edges.easingFunc);

        //    sliceGeometryAtSeaLevel(terrain.children[0].geometry.vertices, opts.minHeight);

        //    function(g, options, direction, distance, easing) {
            //     THREE.Terrain.RadialEdges(terrain.children[0].geometry.vertices, opts, false, 2) // edges.easingFunc);
        //    this.setEdgeVerticeHeight(terrain.children[0].geometry.vertices, -0.5);

            return terrain;
        };

        enableTerrainPhysics = function(piece) {
            let  module = this.getPieceTerrainModule(piece);
            physicsApi.includeBody(module.body);
        };

        disableTerrainPhysics = function(piece) {
            let  module = this.getPieceTerrainModule(piece);
            physicsApi.excludeBody(module.body);
        };

        addTerrainToPhysics = function(terrainOpts, buffer, posX, posZ) {

                let  opts = terrainOpts;
        //    let  matrix = makeMatrix2D(array1d);
                let  body = physicsApi.buildPhysicalTerrain(
                buffer,
                opts.terrain_size,
                posX-opts.terrain_size/2,
                posZ-opts.terrain_size/2,
                opts.min_height,
                opts.max_height);

            return body;
        };

        getHeightForPlayer = function(serverPlayer, normalStore) {

            let  gridSector = serverPlayer.currentGridSector;
            if (!gridSector) return 0;
            let  groundPiece = gridSector.groundPiece;

            return this.getTerrainHeightAt(groundPiece, serverPlayer.piece.spatial.pos, normalStore);
        };

        getTerrainHeightAt = function(terrain, pos, terrainOrigin, normalStore) {

            calcVec2.subVectors(pos, terrainOrigin);

                let  terrainSize = terrain.opts.xSize;
                let  segments = terrain.opts.xSegments;

            calcVec2.x -= terrain.opts.xSize / 2;
            calcVec2.z -= terrain.opts.xSize / 2;

            return getHeightAt(calcVec2, terrain.array1d, terrainSize, segments, normalStore);
        };

    getTerrainHeightAndNormalAt = function(pos, terrainData, terrainSize, segments, normalStore) {
/*
        calcVec2.subVectors(pos, terrainOrigin);

        let  terrainSize = terrain.opts.xSize;
        let  segments = terrain.opts.xSegments;

        calcVec2.x -= terrain.opts.xSize / 2;
        calcVec2.z -= terrain.opts.xSize / 2;
*/
        return getHeightAt(pos, terrainData, terrainSize, segments, normalStore);
    };

    getTerrainBuffers(terrain) {
        return getTerrainBuffers(terrain)
    }

    }

export {
    getHeightAt
}