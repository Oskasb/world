import {Sphere} from "../../../../libs/three/math/Sphere.js";
import {TerrainTrees} from "./TerrainTrees.js";

let terrainMaterial = null;
let oceanMaterial = null
let heightmap = null;
let terrainmap = null;
let heightGrid = [];
let width = null;
let height = null;
let terrainWidth = null;
let terrainHeight = null;

let debugWorld = null;
let ctx;
let setupHeightmapData = function() {

    let terrainmapTx = terrainMaterial.terrainmap;
    let terrainData = terrainmapTx.source.data;
    terrainWidth = terrainData.width;
    terrainHeight = terrainData.height;

    let terrainCanvas = document.createElement('canvas');
    let terrainContext = terrainCanvas.getContext('2d')
    terrainContext.width = terrainWidth;
    terrainContext.height = terrainHeight;
    terrainContext.drawImage(terrainData, 0, 0, terrainWidth, terrainHeight);
    terrainmap = terrainContext.getImageData(0, 0, terrainWidth, terrainHeight).data;

    let heightmapTx = terrainMaterial.heightmap;
    let imgData = heightmapTx.source.data
    width = imgData.width;
    height = imgData.height;
    console.log(terrainMaterial, heightmapTx, heightmapTx.source.data, imgData , this);

    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d')
    canvas.width = width;
    canvas.height = height;

    context.drawImage(imgData, 0, 0, width, height);
    debugWorld.material.map = terrainmapTx.clone() // new THREE.CanvasTexture(canvas);
    debugWorld.material.map.flipY = false;
 //   debugWorld.material.map.repeat.y = -1;
    debugWorld.material.needsUpdate = true;
 //   terrainMaterial.needsUpdate = true;
 //   context.drawImage(heightmapTx.source.data, 0, 0, width, height);
    heightmap = context.getImageData(0, 0, width, height).data;
/*
    setTimeout(function() {
        context.drawImage(imgData, 0, 0, width, height);
        heightmap = context.getImageData(0, 0, width, height).data;
        console.log(canvas.width, canvas.height, heightmap)
    }, 3000)
*/
    console.log([heightmap], [terrainmap])
}

let getPixelRedAtBufferIndex = function(i, j, terrainGeo) {
    let tiles = terrainGeo.tiles;
    let gridX = terrainGeo.gridX;
    let gridY = terrainGeo.gridY;
    let txWidth = terrainGeo.tx_width;
    let vertsPerSegAxis = terrainGeo.vertsPerSegAxis;
 //   let texelX = index%vertsPerSegAxis;
    let texelY = MATH.remainder()

    let pxX =  (0 + i + vertsPerSegAxis * gridX);
    let pxY =  (0 + j + vertsPerSegAxis * gridY);
    return 100 * heightGrid[pxX][pxY] / 255 // *100;
}


let applyHeightmapToMesh = function(mesh, terrainGeo) {
    let posBuffer = mesh.geometry.attributes.position.array;
    let index = mesh.geometry.index.array;
    console.log(posBuffer);
    let vertsPerSegAxis = terrainGeo.vertsPerSegAxis;

    for (let i = 0; i < vertsPerSegAxis; i++) {
        for (let j = 0; j < vertsPerSegAxis; j++) {
            let idx = i * vertsPerSegAxis + j;
            posBuffer[idx*3+1] = getPixelRedAtBufferIndex(i, j, terrainGeo);
        }
    }

    posBuffer[index[6]] = 100;
    posBuffer[index[20]] = 100;
    posBuffer[index[2]] = 100;

    posBuffer[index[4]] = 50;

 //   for (let i = 0; i < posBuffer.length / 3; i++) {

 //   }
    mesh.needsUpdate = true;
}

class TerrainGeometry{
    constructor(obj3d, segmentScale, x, y, gridMeshAssetIds, vertsPerSegAxis, tiles, tx_width, vegetationConfig) {
        this.gridMeshAssetIds = gridMeshAssetIds;
        this.gridX = x;
        this.gridY = y;
        this.obj3d = obj3d;
        this.vegetationConfig = vegetationConfig;
        this.instance = null; // this gets rendered by the shader
        this.oceanInstance = null;
        this.terrainTrees = new TerrainTrees(this);
        this.terrainTrees.loadData(this.vegetationConfig['terrain_trees'])
        this.model = null; // use this for physics and debug
        this.posX = obj3d.position.x;
        this.posZ = obj3d.position.z;
        this.size = segmentScale;
        this.vertsPerSegAxis = vertsPerSegAxis;
        this.tiles = tiles;
        this.tx_width = tx_width;
        this.isActive = false;
        this.wasVisible = false;
        this.isVisible = false;
        this.boundingSphere = new Sphere(this.obj3d.position, this.size*1.15)
        this.updateFrame = 0;
        this.neighborsUpdatedFrame = 0;

        this.levelOfDetail = -1;

        let geoReady = function() {

            if (!terrainMaterial) {
                oceanMaterial = this.oceanInstance.originalModel.material.mat;
                terrainMaterial = this.instance.originalModel.material.mat;
                setupHeightmapData()
                terrainMaterial.uniforms.heightmaptiles.value.x = this.tiles;
                terrainMaterial.uniforms.heightmaptiles.value.y = this.tiles;
                terrainMaterial.uniforms.heightmaptiles.value.z = this.tx_width;
                terrainMaterial.needsUpdate = true;

                oceanMaterial.uniforms.heightmaptiles.value.x = this.tiles;
                oceanMaterial.uniforms.heightmaptiles.value.y = this.tiles;
                oceanMaterial.uniforms.heightmaptiles.value.z = this.tx_width;
                oceanMaterial.needsUpdate = true;

            }

        }.bind(this);

        let activateGeo = function(lodLevel) {
            if (this.isActive) {
                console.log("Geo Already Active")
                return;
            }

            console.log("Activate Geo", this.gridX, this.gridY);
            this.isActive = true;
            this.attachGeometryInstance(geoReady, lodLevel)

        }.bind(this);

        let deactivateGeo = function() {
            if (this.isActive) {
                this.isActive = false;
                this.detachGeometryInstance()
            } else {
                console.log("Geo not Active")
                return;
            }

        }.bind(this);

        this.call = {
            activateGeo:activateGeo,
            deactivateGeo:deactivateGeo
        }

    }

    detachGeometryInstance() {
        this.levelOfDetail = -1;
        if (this.instance) {
            this.instance.decommissionInstancedModel();
            this.oceanInstance.decommissionInstancedModel();
            ThreeAPI.removeFromScene(this.model);
            this.instance = null;
            this.oceanInstance = null;
        }

    }

    attachGeometryInstance(geoReady, lodLevel) {
        if (lodLevel === this.levelOfDetail) {
            return;
        } else if (this.instance) {
            this.detachGeometryInstance();
        }

        let addSceneInstance = function(instance) {
            this.levelOfDetail = lodLevel;
            this.instance = instance;

            if (debugWorld === null) {
                const geometry = new THREE.PlaneGeometry( 1, 1 );
                debugWorld = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
                debugWorld.rotateX(MATH.HALF_PI);
            //    debugWorld.rotateY(Math.PI);
            //    debugWorld.rotateZ(Math.PI);
            //    debugWorld.scale.copy(this.obj3d.scale);
            //    debugWorld.scale.multiplyScalar(100)
                debugWorld.scale.multiplyScalar(this.tx_width);
            //    debugWorld.material.wireframe = true;
                debugWorld.material.opacity = 0.4;
                debugWorld.material.side = THREE.DoubleSide;
                debugWorld.material.transparent = true;
                debugWorld.material.depthTest = false;
                debugWorld.material.depthWrite = false;
            //    ThreeAPI.addToScene(debugWorld);
            }

            if (!this.model) {
                this.model = instance.originalModel.model.scene.children[0].clone();
                this.model.material = new THREE.MeshBasicMaterial();
            }

            instance.setActive(ENUMS.InstanceState.ACTIVE_VISIBLE);
            instance.spatial.stickToObj3D(this.obj3d);
            ThreeAPI.tempVec4.x = this.gridX;
            ThreeAPI.tempVec4.y = this.gridY;
            ThreeAPI.tempVec4.z = 1;
            ThreeAPI.tempVec4.w = 1;
            instance.setAttributev4('sprite', ThreeAPI.tempVec4)
            ThreeAPI.getScene().remove(instance.spatial.obj3d)
            if (typeof (geoReady) === 'function') {
                geoReady();
            }
        }.bind(this);
    //    if (this.levelOfDetail === 0) {

    //    }

        let addOceanInstance = function(instance) {
            this.oceanInstance = instance;
            instance.setActive(ENUMS.InstanceState.ACTIVE_VISIBLE);
            instance.spatial.stickToObj3D(this.obj3d);
            ThreeAPI.tempVec4.x = this.gridX;
            ThreeAPI.tempVec4.y = this.gridY;
            ThreeAPI.tempVec4.z = 1;
            ThreeAPI.tempVec4.w = 1;
            instance.setAttributev4('sprite', ThreeAPI.tempVec4)
            ThreeAPI.getScene().remove(instance.spatial.obj3d)
            client.dynamicMain.requestAssetInstance(this.gridMeshAssetIds[lodLevel], addSceneInstance)
        }.bind(this);
        if (this.levelOfDetail === -1) {
            client.dynamicMain.requestAssetInstance('asset_ocean_16', addOceanInstance)
        } else {
            client.dynamicMain.requestAssetInstance(this.gridMeshAssetIds[lodLevel], addSceneInstance)
        }


    }

    getHeightmapData() {
        //      return ctx.getImageData(0, 0, width, height).data;
       return heightmap;
    }


    updateTerrainGeometry(visibleGeoTiles, geoBeneathPlayer, tileUpdateCB, frame) {

        if (this.updateFrame === frame) {
        //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:GameAPI.getMainCharPiece().getPos(), to:this.obj3d.position, color:'GREY'});

            return;
        }
        let changed = false;

        let centerGridX = geoBeneathPlayer.gridX;
        let centerGridY = geoBeneathPlayer.gridY;
        this.wasVisible = this.isVisible;
        this.isVisible = ThreeAPI.testSphereIsVisible(this.boundingSphere);

    //    if (this.instance === null) {
            if (this.isVisible) {

                let gridDistX = Math.abs(centerGridX - this.gridX);
                let gridDistY  = Math.abs(centerGridY - this.gridY);
                let gridDist = Math.max(gridDistX, gridDistY);
                let lodLevel = Math.min(Math.floor( gridDist/3), 5)
                this.attachGeometryInstance(null, lodLevel)
            //    let color = {x:Math.cos(lodLevel/2)*0.5+0.5, y:Math.cos(lodLevel)*0.5 + 0.5, z: Math.sin(lodLevel)*0.5+0.5, w:1}
            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:GameAPI.getMainCharPiece().getPos(), to:this.obj3d.position, color:color});

            } else {
             //   evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:GameAPI.getMainCharPiece().getPos(), to:this.obj3d.position, color:'RED'});
                this.detachGeometryInstance();
            }

            if (this.isVisible) {
                if (visibleGeoTiles.indexOf(this) === -1) {
                //    let color = {x:Math.cos(this.levelOfDetail/3)*0.5+0.5, y:Math.cos(this.levelOfDetail)*0.5 + 0.5, z: Math.sin(this.levelOfDetail)*0.5+0.5, w:1}
                //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:GameAPI.getMainCharPiece().getPos(), to:this.obj3d.position, color:color});

                    visibleGeoTiles.push(this);
                }
            } else {
                if (visibleGeoTiles.indexOf(this) !== -1) {
                //    MATH.quickSplice(visibleGeoTiles, this)
                }
            }

        this.terrainTrees.applyLevelOfDetail(this.levelOfDetail);
        this.updateFrame = frame;
        tileUpdateCB(this);
    }
}

export {TerrainGeometry}