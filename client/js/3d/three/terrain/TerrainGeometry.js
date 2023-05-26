
let terrainMaterial = null;
let heightmap = null;

let setupHeightmapData = function() {

    let heightmapTx = terrainMaterial.heightmap;
    let imgData = heightmapTx.source.data
    console.log(terrainMaterial, heightmapTx, heightmapTx.source.data, imgData , this);

    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d')

    context.drawImage(heightmapTx.source.data, 0, 0, imgData.width, imgData.height);
    heightmap = context.getImageData(0, 0, imgData.width, imgData.height).data;
    console.log(heightmap)
    for (let row = 0; row < imgData.height; row++) {
        for (let col = 0; col < imgData.width; col++) {
            let i = row * imgData.width + col;
                let idx = i * 4;
        //    g[i].z = (data[idx] + data[idx+1] + data[idx+2]) / 765 * spread + options.minHeight;
        }
    }
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

        let activateGeo = function() {
            if (this.isActive) {
                console.log("Geo Already Active")
                return;
            }


            console.log("Activate Geo", this.gridX, this.gridY);
            this.isActive = true;
            this.attachGeometryInstance()
            if (!terrainMaterial) {
                terrainMaterial = this.instance.originalModel.material.mat;
                setupHeightmapData()

                terrainMaterial.uniforms.heightmaptiles.value.x = this.tiles;
                terrainMaterial.uniforms.heightmaptiles.value.y = this.tiles;
                terrainMaterial.uniforms.heightmaptiles.value.z = this.tx_width;
                terrainMaterial.needsUpdate = true;
            }
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
        this.instance = null;
    }

    attachGeometryInstance() {
        let addSceneInstance = function(instance) {
            this.instance = instance;

            if (!this.model) {
                this.model = instance.originalModel.model.scene.children[0].clone();
                this.model.name = 'Grid_'+this.gridX+'_'+this.gridY;
                this.model.position.copy(this.obj3d.position);
                this.model.position.y = 1;
                ThreeAPI.addToScene(this.model);
                console.log(this.model);
            }

            instance.setActive(ENUMS.InstanceState.ACTIVE_VISIBLE);
            instance.spatial.stickToObj3D(this.obj3d);
            ThreeAPI.tempVec4.x = this.gridX;
            ThreeAPI.tempVec4.y = this.gridY;
            ThreeAPI.tempVec4.z = 1;
            ThreeAPI.tempVec4.w = 1;
            instance.setAttributev4('sprite', ThreeAPI.tempVec4)
            ThreeAPI.getScene().remove(instance.spatial.obj3d)
        }.bind(this);
        client.dynamicMain.requestAssetInstance(this.gridMeshAssetId, addSceneInstance)
    }

    getHeightmapData() {
        return heightmap;
    }

}

export {TerrainGeometry}