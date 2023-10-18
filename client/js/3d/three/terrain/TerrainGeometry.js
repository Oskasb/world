
import {Box3} from "../../../../libs/three/math/Box3.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {TerrainElementModel} from "./TerrainElementModel.js";
import {TerrainSectionInfo} from "./TerrainSectionInfo.js";


let tempVec = new Vector3()
let groundUpdate = false;
let terrainMaterial = null;
let oceanMaterial = null
let heightmap = null;
let terrainmap = null;
let heightGrid = [];
let width = null;
let height = null;
let terrainWidth = null;
let terrainHeight = null;
let maxLodLevel = 6;
let terrainContext = null;
let heightmapContext = null;
let terrainUpdate = false;

let globalUpdateFrame = 0;

let oceanPlane = null;

let debugWorld = null;
let ctx;
let setupHeightmapData = function(originalModelMat) {
    terrainMaterial = originalModelMat;
    let terrainmapTx = terrainMaterial.terrainmap;
    let terrainData = terrainmapTx.source.data;
    terrainWidth = terrainData.width;
    terrainHeight = terrainData.height;

    let terrainCanvas = document.createElement('canvas');
    terrainContext = terrainCanvas.getContext('2d',  { willReadFrequently: true })
    terrainContext.getContextAttributes().willReadFrequently = true;
//    console.log(terrainContext, terrainContext.getContextAttributes())
    terrainCanvas.width = terrainWidth;
    terrainCanvas.height = terrainHeight;
    terrainContext.drawImage(terrainData, 0, 0, terrainWidth, terrainHeight);
//    terrainContext.fillStyle = "rgb(255, 0, 0)";
    terrainContext.globalCompositeOperation = "lighter";
//    terrainContext.fillRect(0, 0, terrainWidth, terrainHeight);

    terrainmap = terrainContext.getImageData(0, 0, terrainWidth, terrainHeight).data;

    let terrainMapCanvasTx = new THREE.CanvasTexture(terrainCanvas)
    terrainMapCanvasTx.generateMipmaps = false;
    terrainMapCanvasTx.flipY = false;
    terrainMaterial.terrainmap = terrainMapCanvasTx;
    terrainMaterial.uniforms.terrainmap.value = terrainMapCanvasTx;

    let heightmapTx = terrainMaterial.heightmap;
    let imgData = heightmapTx.source.data
    width = imgData.width;
    height = imgData.height;
//    console.log(terrainMaterial, heightmapTx, heightmapTx.source.data, imgData , this);

    let heightCanvas = document.createElement('canvas');
    heightmapContext = heightCanvas.getContext('2d', { willReadFrequently: true } )

    heightCanvas.width = width;
    heightCanvas.height = height;

    heightmapContext.drawImage(imgData, 0, 0, width, height);
    debugWorld.material.map = terrainmapTx.clone() // new THREE.CanvasTexture(canvas);
    debugWorld.material.map.flipY = false;
 //   debugWorld.material.map.repeat.y = -1;
    debugWorld.material.needsUpdate = true;
 //   terrainMaterial.needsUpdate = true;
 //   context.drawImage(heightmapTx.source.data, 0, 0, width, height);
    heightmap = heightmapContext.getImageData(0, 0, width, height).data;


    let heightMapCanvasTx = new THREE.CanvasTexture(heightCanvas)
    heightMapCanvasTx.generateMipmaps = false;
    heightMapCanvasTx.flipY = false;
    terrainMaterial.heightmap = heightMapCanvasTx;
    terrainMaterial.uniforms.heightmap.value = heightMapCanvasTx;
    terrainMaterial.heightmap.needsUpdate = true;
    terrainMaterial.uniforms.needsUpdate = true;
    terrainMaterial.uniformsNeedUpdate = true;
    terrainMaterial.needsUpdate = true;
  //  heightMapCanvasTx.fillStyle = createGradient(canvasContext, size, tx+0, tz+0);
    heightmapContext.fillStyle = "rgba(255, 255, 0, 1)";
    heightmapContext.globalCompositeOperation = "darken";
    heightmapContext.fillRect(0, 0, 2048, 2048);

//    heightmapContext.fillStyle = "rgba(9, 0, 0, 1)";
    heightmapContext.globalCompositeOperation = "lighter";
//    heightmapContext.fillRect(0, 0, 2048, 2048);

/*
    setTimeout(function() {
        terrainmap = terrainContext.getImageData(0, 0, terrainWidth, terrainHeight).data;
        console.log(terrainmap)
    }, 3000)
*/
  //  console.log(terrainMaterial, [heightmap], [terrainmap])
}

let containsPoint = function(geo, posVec) {

}

let probeForHeightMinMax = function(geo) {
    let pos = geo.obj3d.position
    let bounds = geo.boundingBox;
    tempVec.copy(bounds.min)
    geo.registerContainsHeight(ThreeAPI.terrainAt(tempVec))
    tempVec.x = pos.x;
    geo.registerContainsHeight(ThreeAPI.terrainAt(tempVec))
    tempVec.copy(bounds.max)
    geo.registerContainsHeight(ThreeAPI.terrainAt(tempVec))
    tempVec.x = pos.x;
    geo.registerContainsHeight(ThreeAPI.terrainAt(tempVec))

    geo.registerContainsHeight(ThreeAPI.terrainAt(pos))

    tempVec.set(bounds.min.x, 0, bounds.max.z)
    geo.registerContainsHeight(ThreeAPI.terrainAt(tempVec))
    tempVec.z = pos.z;
    geo.registerContainsHeight(ThreeAPI.terrainAt(tempVec))
    tempVec.set(bounds.max.x, 0, bounds.min.z)
    geo.registerContainsHeight(ThreeAPI.terrainAt(tempVec))
    tempVec.z = pos.z;
    geo.registerContainsHeight(ThreeAPI.terrainAt(tempVec))
}

class TerrainGeometry{
    constructor(obj3d, segmentScale, x, y, gridMeshAssetIds, vertsPerSegAxis, tiles, tx_width,groundTxWidth, groundConfig, sectionInfoCponfig) {
        this.gridMeshAssetIds = gridMeshAssetIds;
        this.gridX = x;
        this.gridY = y;
        this.minY = MATH.bigSafeValue();
        this.maxY = -MATH.bigSafeValue();
        this.obj3d = obj3d;
        this.groundConfig = groundConfig;
        this.instance = null; // this gets rendered by the shader
        this.oceanInstance = null;
        this.terrainSectionInfo = new TerrainSectionInfo(this, sectionInfoCponfig);
        this.terrainElementModels = new TerrainElementModel(this);
        this.terrainElementModels.loadData(this.groundConfig['terrain_elements'])
        this.posX = obj3d.position.x;
        this.posZ = obj3d.position.z;
        this.size = segmentScale;
        this.vertsPerSegAxis = vertsPerSegAxis;
        this.tiles = tiles;
        this.tx_width = tx_width;
        this.groundTxWidth = groundTxWidth;
        this.isActive = false;
        this.wasVisible = false;
        this.isVisible = false;
        this.updateMinMax = true;
     /*
        let boundCenter = new Vector3();
        boundCenter.copy(this.obj3d.position)
        this.boundingSphere = new Sphere(boundCenter, this.size*1.25)
        this.boundingSphere.center.y = ThreeAPI.terrainAt(this.obj3d.position)+5;
*/
        let box3min = new Vector3();
        box3min.x = this.posX - this.size*0.5;
        box3min.y = 0;
        box3min.z = this.posZ - this.size*0.5;
        let box3Max = new Vector3();

        box3Max.x = this.posX + this.size*0.5;
        box3Max.y = 60;
        box3Max.z = this.posZ + this.size*0.5;

        this.boundingBox = new Box3(box3min, box3Max);

        this.updateFrame = 0;
        this.neighborsUpdatedFrame = 0;

        this.levelOfDetail = -1;

        this.lodUpdateCallbaks = [];

        let initTerrainMaterials = function() {
            let geoReady = function() {
                oceanMaterial = this.oceanInstance.originalModel.material.mat;

                setupHeightmapData(this.instance.originalModel.material.mat)
                terrainMaterial.uniforms.heightmaptiles.value.x = this.tiles;
                terrainMaterial.uniforms.heightmaptiles.value.y = this.tiles;
                terrainMaterial.uniforms.heightmaptiles.value.z = this.tx_width;
                terrainMaterial.needsUpdate = true;

                oceanMaterial.uniforms.heightmaptiles.value.x = this.tiles;
                oceanMaterial.uniforms.heightmaptiles.value.y = this.tiles;
                oceanMaterial.uniforms.heightmaptiles.value.z = this.tx_width;
                oceanMaterial.needsUpdate = true;
                this.detachGeometryInstance()
            }.bind(this);

            if (!terrainMaterial) {
                this.attachGeometryInstance(geoReady, 0)
            }

        }.bind(this)

        let activateGeo = function(lodLevel) {
            if (this.isActive) {
                console.log("Geo Already Active")
                return;
            }
        //    console.log("Activate Geo", this.gridX, this.gridY);
            this.isActive = true;
            this.attachGeometryInstance(null, lodLevel)
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
            initTerrainMaterials:initTerrainMaterials,
            activateGeo:activateGeo,
            deactivateGeo:deactivateGeo
        }
    }

    registerContainsHeight(posY) {
        if (posY < this.minY) {
            this.minY = posY;
            this.boundingBox.min.y = posY;
        }

        if (posY > this.maxY) {
            this.maxY = posY;
            this.boundingBox.max.y = posY;
        }
    }

    addLodUpdateCallback = function(cb) {
        this.lodUpdateCallbaks.push(cb)
        cb(this.levelOfDetail);
    }

    removeLodUpdateCallback = function(cb) {
        MATH.quickSplice(this.lodUpdateCallbaks, cb)
    }

    getExtentsMinMax(storeMin, storeMax) {
        storeMin.copy(this.obj3d.position);
        storeMin.x -= this.size*0.5;
        storeMin.z -= this.size*0.5;
        storeMax.copy(storeMin);
        storeMax.x += this.size;
        storeMax.z += this.size;
    }

    applyLodLevelChange(lodLevel) {
        if (typeof (lodLevel) === 'number') {
            if (this.levelOfDetail !== lodLevel)  {
                this.levelOfDetail = lodLevel;
                this.terrainSectionInfo.applyLodLevel(this.levelOfDetail, maxLodLevel);
                this.terrainElementModels.applyLevelOfDetail(this.levelOfDetail, this.terrainSectionInfo);
                MATH.callAll(this.lodUpdateCallbaks, this.levelOfDetail);
            }
        } else {
            this.terrainSectionInfo.applyLodLevel(this.levelOfDetail, maxLodLevel);
            this.terrainElementModels.applyLevelOfDetail(this.levelOfDetail, this.terrainSectionInfo);
            MATH.callAll(this.lodUpdateCallbaks, this.levelOfDetail);
        }


    }

    removeGroundInstance() {
        if (this.instance) {
            //         evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:this.obj3d.position, color:'RED'});
            this.instance.decommissionInstancedModel();
            this.instance = null;
        }
    }

    removeOceanInstance() {
        if (this.oceanInstance) {
            this.oceanInstance.decommissionInstancedModel();
            this.oceanInstance = null;
        }
    }

    detachGeometryInstance() {
        this.applyLodLevelChange(-1)
        this.removeGroundInstance()
        this.removeOceanInstance()
    }

    attachGeometryInstance(geoReady, lodLevel, hideGround, hideOcean) {

/*
        if (hideOcean) {
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:this.boundingBox.min, max:this.boundingBox.max, color:'GREEN'})
        } else if (hideGround) {
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:this.boundingBox.min, max:this.boundingBox.max, color:'BLUE'})
        } else {
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:this.boundingBox.min, max:this.boundingBox.max, color:'YELLOW'})
        }
             /*
*/
        if (lodLevel === this.levelOfDetail) {

            return;
            if (lodLevel === 0) {
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:this.boundingBox.min, max:this.boundingBox.max, color:'CYAN'})
            }
            if (lodLevel === 3) {
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:this.boundingBox.min, max:this.boundingBox.max, color:'GREEN'})
            }
            if (lodLevel === 6) {
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:this.boundingBox.min, max:this.boundingBox.max, color:'RED'})
            }
        } else if (this.instance || this.oceanInstance) {
        //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:this.boundingBox.min, max:this.boundingBox.max, color:'CYAN'})
            this.detachGeometryInstance();
        }
    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:this.obj3d.position, color:'YELLOW'});

        let addSceneInstance = function(instance) {
            this.levelOfDetail = lodLevel;
            this.instance = instance;
            instance.stationary = true;
            if (debugWorld === null) {
                const geometry = new THREE.PlaneGeometry( 1, 1 );
                debugWorld = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
                debugWorld.rotateX(MATH.HALF_PI);
                debugWorld.scale.multiplyScalar(this.tx_width);
                debugWorld.material.opacity = 0.4;
                debugWorld.material.side = THREE.DoubleSide;
                debugWorld.material.transparent = true;
                debugWorld.material.depthTest = false;
                debugWorld.material.depthWrite = false;
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

        let addOceanInstance = function(instance) {
            this.oceanInstance = instance;
            instance.stationary = true;
            instance.setActive(ENUMS.InstanceState.ACTIVE_VISIBLE);
            instance.spatial.stickToObj3D(this.obj3d);
            ThreeAPI.tempVec4.x = this.gridX;
            ThreeAPI.tempVec4.y = this.gridY;
            ThreeAPI.tempVec4.z = 1;
            ThreeAPI.tempVec4.w = 1;
            instance.setAttributev4('sprite', ThreeAPI.tempVec4)
            ThreeAPI.getScene().remove(instance.spatial.obj3d)

        }.bind(this);

        if (this.levelOfDetail === -1) {
            if (!hideOcean) {
                client.dynamicMain.requestAssetInstance('asset_ocean_16', addOceanInstance)
            }

            if (!hideGround) {
                client.dynamicMain.requestAssetInstance(this.gridMeshAssetIds[lodLevel], addSceneInstance)
            }
        }


    }

    getHeightmapData() {
       return heightmap;
    }

    getHeightmapCanvas() {
        return heightmapContext;
    }

    getGroundData() {
        if (groundUpdate) {
        //    terrainmap = terrainContext.getImageData(0, 0, terrainWidth, terrainHeight).data;
            groundUpdate = false;
        }
        return terrainmap;
    }

    getGroundDataCanvas() {
        return terrainContext;
    }

    updateGroundCanvasTexture() {
    //    console.log(terrainMaterial)
        terrainMaterial.uniforms.terrainmap.value = terrainMaterial.terrainmap;
        terrainMaterial.terrainmap.needsUpdate = true;
        terrainMaterial.uniforms.terrainmap.needsUpdate = true;
        terrainMaterial.uniformsNeedUpdate = true;
        terrainMaterial.needsUpdate = true;
        groundUpdate = true;
    }

    updateHeightmapCanvasTexture() {
    //    if (MATH.isEvenNumber(GameAPI.getFrame().frame * 0.25)) {
            terrainUpdate = true;
    //    }
    }

    getOrigin() {
        return this.obj3d.position;
    }

    getSizeX() {
        return this.size * 2;
    }

    getSizeZ() {
        return this.size * 2;
    }


    updateVisibility(lodLevel, frame) {
        this.wasVisible = this.isVisible;

        if (this.updateMinMax === true) {
            probeForHeightMinMax(this);
            this.updateMinMax = false
        };

        if (globalUpdateFrame !== frame) {
            if (terrainUpdate) {
                terrainMaterial.heightmap.needsUpdate = true;
                heightmap = heightmapContext.getImageData(0, 0, width, height).data;
                terrainUpdate = false;
            }
            globalUpdateFrame = frame;
        }

        let hideGround = false;
        let hideOcean = false;

        if (this.minY > 0) {
            hideOcean = true;
        } else if (this.maxY < 0) {
            hideGround = true;
        }

        if (lodLevel !== this.levelOfDetail) {


            if (lodLevel === -1) {
                this.detachGeometryInstance();
                this.isVisible = false;
            } else {
                this.attachGeometryInstance(null, lodLevel, hideGround, hideOcean)
                this.isVisible = true;
            }
            this.applyLodLevelChange()
        }

        this.updateFrame = frame;
    }

    updateTerrainGeometry(visibleGeoTiles, geoBeneathPlayer, tileUpdateCB, frame) {

        if (this.updateFrame === frame) {
        //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:GameAPI.getMainCharPiece().getPos(), to:this.obj3d.position, color:'GREY'});

            return;
        }

        if (globalUpdateFrame !== frame) {
            if (terrainUpdate) {
                terrainMaterial.heightmap.needsUpdate = true;
                heightmap = heightmapContext.getImageData(0, 0, width, height).data;
                terrainUpdate = false;
            }
            globalUpdateFrame = frame;
        }

        let changed = false;

        let centerGridX = geoBeneathPlayer.gridX;
        let centerGridY = geoBeneathPlayer.gridY;


        this.wasVisible = this.isVisible;
        // this.isVisible = ThreeAPI.testSphereIsVisible(this.boundingSphere);

        this.isVisible = ThreeAPI.testBoxIsVisible(this.boundingBox);

    //    if (this.instance === null) {
            if (this.isVisible) {

                let gridDistX = Math.abs(centerGridX - this.gridX);
                let gridDistY  = Math.abs(centerGridY - this.gridY);
                let gridDist = Math.max(gridDistX, gridDistY);
                let lodDist = (gridDist + Math.sqrt(gridDistX * gridDistY ) * 0.55) / 3;
                let lodLevel = Math.min(Math.floor( lodDist * 0.85 + MATH.curveQuad(lodDist) * 0.075), maxLodLevel)

                if (this.updateMinMax === true) {
                    probeForHeightMinMax(this);
                    this.updateMinMax = false
                };

                let hideGround = false;
                let hideOcean = false;

                if (this.minY > 0) {
                    hideOcean = true;
                } else if (this.maxY < 0) {
                    hideGround = true;
                }

                this.attachGeometryInstance(null, lodLevel, hideGround, hideOcean)


            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:this.boundingBox.min, max:this.boundingBox.max, color:'GREEN'})

            //    let color = {x:Math.cos(lodLevel/2)*0.5+0.5, y:Math.cos(lodLevel)*0.5 + 0.5, z: Math.sin(lodLevel)*0.5+0.5, w:1}
            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:GameAPI.getMainCharPiece().getPos(), to:this.obj3d.position, color:color});

            } else {
                this.detachGeometryInstance();
            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:this.boundingBox.min, max:this.boundingBox.max, color:'RED'})
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

        this.updateFrame = frame;
        tileUpdateCB(this);
    }
}

export {TerrainGeometry}