
let terrainMaterial = null;
let heightmap = null;
let heightGrid = [];
let width = null;
let height = null;
let debugWorld = null;
let ctx;
let setupHeightmapData = function() {

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
    debugWorld.material.map = heightmapTx.clone() // new THREE.CanvasTexture(canvas);
    debugWorld.material.map.flipY = false;
 //   debugWorld.material.map.repeat.y = -1;
    debugWorld.material.needsUpdate = true;
 //   context.drawImage(heightmapTx.source.data, 0, 0, width, height);
    heightmap = context.getImageData(0, 0, width, height).data;
/*
    setTimeout(function() {
        context.drawImage(imgData, 0, 0, width, height);
        heightmap = context.getImageData(0, 0, width, height).data;
        console.log(canvas.width, canvas.height, heightmap)
    }, 3000)
*/
    console.log(heightmap)
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
    constructor(obj3d, segmentScale, x, y, gridMeshAssetId, vertsPerSegAxis, tiles, tx_width) {
        this.gridMeshAssetId = gridMeshAssetId;
        this.gridX = x;
        this.gridY = y;
        this.obj3d = obj3d;
        this.instance = null; // this gets rendered by the shader
        this.model = null; // use this for physics and debug
        this.posX = obj3d.position.x;
        this.posZ = obj3d.position.z;
        this.size = segmentScale;
        this.vertsPerSegAxis = vertsPerSegAxis;
        this.tiles = tiles;
        this.tx_width = tx_width;
        this.isActive = false;

        let geoReady = function() {

            if (!terrainMaterial) {
                terrainMaterial = this.instance.originalModel.material.mat;
                setupHeightmapData()

                terrainMaterial.uniforms.heightmaptiles.value.x = this.tiles;
                terrainMaterial.uniforms.heightmaptiles.value.y = this.tiles;
                terrainMaterial.uniforms.heightmaptiles.value.z = this.tx_width;
                terrainMaterial.needsUpdate = true;
            }
        //    applyHeightmapToMesh(this.model, this);
        }.bind(this);

        let activateGeo = function() {
            if (this.isActive) {
                console.log("Geo Already Active")
                return;
            }

            console.log("Activate Geo", this.gridX, this.gridY);
            this.isActive = true;
            this.attachGeometryInstance(geoReady)

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
        this.instance.decommissionInstancedModel();
        ThreeAPI.removeFromScene(this.model);
        this.instance = null;
    }

    attachGeometryInstance(geoReady) {
        let addSceneInstance = function(instance) {
            this.instance = instance;


            if (!debugWorld) {
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
                ThreeAPI.addToScene(debugWorld);
            }

            if (!this.model) {
                this.model = instance.originalModel.model.scene.children[0].clone();
                this.model.material = new THREE.MeshBasicMaterial();
                this.model.material.wireframe = true;
                this.model.material.color.r = 0.1;
                this.model.material.color.g = 0.5;
                this.model.material.color.b = 0.1;
                this.model.material.color.a = 0.4;
                this.model.material.renderOrder = 10;
                this.model.material.needsUpdate = true;
                this.model.material.depthTest = false;
                this.model.material.depthWrite = false;
                this.model.name = 'Grid_'+this.gridX+'_'+this.gridY;
                this.model.position.copy(this.obj3d.position);
            //    this.model.position.y = 0.1;
                this.model.scale.copy(this.obj3d.scale);
                this.model.scale.multiplyScalar(100)

                console.log(this.model, instance.originalModel);
            }


            ThreeAPI.addToScene(this.model);

            instance.setActive(ENUMS.InstanceState.ACTIVE_VISIBLE);
            instance.spatial.stickToObj3D(this.obj3d);
            ThreeAPI.tempVec4.x = this.gridX;
            ThreeAPI.tempVec4.y = this.gridY;
            ThreeAPI.tempVec4.z = 1;
            ThreeAPI.tempVec4.w = 1;
            instance.setAttributev4('sprite', ThreeAPI.tempVec4)
            ThreeAPI.getScene().remove(instance.spatial.obj3d)
            geoReady();
        }.bind(this);
        client.dynamicMain.requestAssetInstance(this.gridMeshAssetId, addSceneInstance)
    }

    getHeightmapData() {
        //      return ctx.getImageData(0, 0, width, height).data;
       return heightmap;
    }

}

export {TerrainGeometry}