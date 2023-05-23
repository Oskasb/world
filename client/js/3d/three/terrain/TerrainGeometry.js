

class TerrainGeometry{
    constructor(obj3d, segmentScale, x, y, gridMeshAssetId) {
        this.gridMeshAssetId = gridMeshAssetId;
        this.gridX = x;
        this.gridY = y;
        this.obj3d = obj3d;
        this.instance = null;
        this.posX = obj3d.position.x;
        this.posZ = obj3d.position.z;
        this.size = segmentScale;
        this.isActive = false;

        let activateGeo = function() {
            if (this.isActive) {
                console.log("Geo Already Active")
                return;
            }
            console.log("Activate Geo", this.gridX, this.gridY);
            this.isActive = true;
            this.attachGeometryInstance()
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
            instance.setActive(ENUMS.InstanceState.ACTIVE_VISIBLE);
            instance.spatial.stickToObj3D(this.obj3d);
            ThreeAPI.tempVec4.x = this.gridX;
            ThreeAPI.tempVec4.y = this.gridY+1;
            ThreeAPI.tempVec4.z = 1;
            ThreeAPI.tempVec4.w = 1;
            instance.setAttributev4('sprite', ThreeAPI.tempVec4)
            ThreeAPI.getScene().remove(instance.spatial.obj3d)
        }.bind(this);
        client.dynamicMain.requestAssetInstance(this.gridMeshAssetId, addSceneInstance)
    }

}

export {TerrainGeometry}