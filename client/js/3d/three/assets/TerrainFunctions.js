import {Vector3} from "../../../../libs/three/math/Vector3.js";

let calcVec1 = new Vector3();
let calcVec2 = new Vector3();

let p0  = {x:0, y:0, z:0};
let p1  = {x:0, y:0, z:0};
let p2  = {x:0, y:0, z:0};
let p3  = {x:0, y:0, z:0};

let points = [];

// get a height at point from matrix
function getPointInMatrix (matrixData, y, x) {
    return matrixData[x][y];
}

function displaceAxisDimensions (axPos, axMin, axMax, quadCount) {
    let matrixPos = axPos-axMin;
    return quadCount*matrixPos/(axMax - axMin);
}

function returnToWorldDimensions(axPos, axMin, axMax, quadCount) {
    let quadSize = (axMax-axMin) / quadCount;
    let insidePos = axPos * quadSize;
    return axMin+insidePos;
}

// get the value at the precise integer (x, y) coordinates
function  getAt(array1d, segments, x, y) {
    let yFactor = (y) * (segments+1);
    let idx = (yFactor + x);
    return array1d[idx];
}

function  setTri(tri, x, y, z) {
    tri.x = x;
    tri.y = y;
    tri.z = z;
}

function  getTriangleAt(array1d, segments, x, y) {

    let xc = Math.ceil(x);
    let xf = Math.floor(x);
    let yc = Math.ceil(y);
    let yf = Math.floor(y);

    let fracX = x - xf;
    let fracY = y - yf;

    p1.x = xf;
    p1.y = yc;

    p1.z = getAt(array1d, segments, xf, yc);

    setTri(p1, xf, yc, getAt(array1d, segments,xf, yc));
    setTri(p2, xc, yf, getAt(array1d, segments,xc, yf));

    if (fracX < 1-fracY) {
        setTri(p3,xf,yf,getAt(array1d, segments,xf, yf));
    } else {
        setTri(p3, xc, yc, getAt(array1d, segments,xc, yc));
    }

    points[0] = p1;
    points[1] = p2;
    points[2] = p3;
    return points;
}

function getPreciseHeight(array1d, segments, x, z, normalStore, htN, htP) {
    let tri = getTriangleAt(array1d, segments, x, z);

    setTri(p0, x, z, 0);

    let find = MATH.barycentricInterpolation(tri[0], tri[1], tri[2], p0);

    if (normalStore) {

        tri[0].x = returnToWorldDimensions(tri[0].x, htN, htP, segments);
        tri[0].y = returnToWorldDimensions(tri[0].y, htN, htP, segments);
        tri[1].x = returnToWorldDimensions(tri[1].x, htN, htP, segments);
        tri[1].y = returnToWorldDimensions(tri[1].y, htN, htP, segments);
        tri[2].x = returnToWorldDimensions(tri[2].x, htN, htP, segments);
        tri[2].y = returnToWorldDimensions(tri[2].y, htN, htP, segments);

        calcVec1.set((tri[1].x-tri[0].x), (tri[1].z-tri[0].z), (tri[1].y-tri[0].y));
        calcVec2.set((tri[2].x-tri[0].x), (tri[2].z-tri[0].z), (tri[2].y-tri[0].y));

        calcVec1.cross(calcVec2);
        if (calcVec1.y < 0) {
            calcVec1.negate();
        }

        calcVec1.normalize();
        normalStore.copy(calcVec1);

    }
    return find.z;
}

function  getDisplacedHeight(array1d, segments, x, z, htP, htN, normalStore) {
    let tx = displaceAxisDimensions(x, htN, htP, segments);
    let tz = displaceAxisDimensions(z, htN, htP, segments);
    return getPreciseHeight(array1d, segments, tx, tz, normalStore, htN, htP);
}

function  getHeightAt(pos, array1d, terrainSize, segments, normalStore) {

    let htP = 0 //terrainSize / 2;  // 2;
    let htN = - terrainSize // - htP; // 0;

    if (pos.x < htN || pos.x > htP || pos.z < htN || pos.z > htP) {
        console.log("Terrain!", pos.x, pos.z, "Is Outside MAIN")
        //    return -1000;
        pos.x = MATH.clamp(pos.x, htN, htP);
        pos.z = MATH.clamp(pos.z, htN, htP);
    }

    return getDisplacedHeight(array1d, segments, pos.x, pos.z, htP, htN, normalStore);
}

export {
    getPointInMatrix,
    displaceAxisDimensions,
    returnToWorldDimensions,
    getAt,
    setTri,
    getTriangleAt,
    getPreciseHeight,
    getDisplacedHeight,
    getHeightAt
}