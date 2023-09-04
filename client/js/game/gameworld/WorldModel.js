import {Object3D} from "../../../libs/three/core/Object3D.js";

class WorldModel {
    constructor(config) {
        this.config = config;
        this.obj3d = new Object3D();
        MATH.vec3FromArray(this.obj3d.position, this.config.pos)

        if (config['on_ground']) {
            this.obj3d.position.y = ThreeAPI.terrainAt(this.obj3d.position);
        //    console.log("Stick to ground", this.obj3d.position.y)
        }

        MATH.vec3FromArray(this.obj3d.scale, this.config.scale)

        this.obj3d.rotateX(this.config.rot[0]);
        this.obj3d.rotateY(this.config.rot[1]);
        this.obj3d.rotateZ(this.config.rot[2]);

        this.isVisible = false;

        let lodUpdated = function(lodLevel) {
            if (lodLevel !== -1 && lodLevel < config['visibility']) {
                this.showWorldModel()
                this.isVisible = true;
            } else {
                this.removeWorldModel()
                this.isVisible = false;
            }

        }.bind(this)

        this.call = {
            lodUpdated:lodUpdated
        }


        this.instance = null;
    }

    getPos() {
        return this.obj3d.position;
    }

    showWorldModel() {
    //    console.log("Show Model ", this.isVisible, this)
        if (this.isVisible) {
            return;
        }

        let config = this.config;

        let addModelInstance = function(instance) {

            ThreeAPI.getScene().remove(instance.spatial.obj3d)
            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:this.obj3d.position, color:'YELLOW'});
        //    this.callbacks.setInstance(instance)
            //    console.log(instance.getGeometryInstance().instancingBuffers);
            //    this.applyPlantConfig(this.config);
        //    this.applyInstanceAttributes(instance);
            instance.spatial.stickToObj3D(this.obj3d);
            this.instance = instance;
        }.bind(this)

        //    this.poolKey = "asset_box";

        client.dynamicMain.requestAssetInstance(this.config.asset, addModelInstance)

    }

    removeWorldModel() {
    //    console.log("Remove Model ", this.isVisible, this)
        if (!this.isVisible) {
            return;
        }
        this.instance.decommissionInstancedModel();
    }

}

export { WorldModel }