

class TerrainGeometry{
    constructor(obj3d, x, y) {
        this.gridX = x;
        this.gridY = y;
        this.obj3d = obj3d;
        this.instance = null;
    }

    attachGeometryInstance(assetId) {


            let addSceneInstance = function(instance) {

            this.instance = instance;
            instance.setActive(ENUMS.InstanceState.ACTIVE_VISIBLE);
            instance.spatial.stickToObj3D(this.obj3d);
      /*
            instance.spatial.setPosXYZ(
                2*boxSize*i - offset + wallOffsetX,
                -boxSize + floorOffset,
                2*boxSize*j - offset + wallOffsetY
            );
            instance.spatial.setScaleXYZ(boxSize*0.02, boxSize*0.02, boxSize*0.02)
        */
        //    instance.setSprite(iconSprite);
            ThreeAPI.getScene().remove(instance.spatial.obj3d)
        }.bind(this);

        client.dynamicMain.requestAssetInstance(assetId, addSceneInstance)

    }

}

export {TerrainGeometry}