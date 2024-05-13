import {Object3D} from "../../../libs/three/core/Object3D.js";

class WorldAdventure {
    constructor() {
        this.obj3d = new Object3D();
        this.id = null;
        this.config = {}

        let applyLoadedConfig = function(cfg) {
            console.log("applyLoadedConfig", cfg, this)
            MATH.vec3FromArray(this.getPos(), cfg.pos)
            this.config = cfg;
        }.bind(this);

        this.call = {
            applyLoadedConfig:applyLoadedConfig,

        }

    }

    getPos() {
        return this.obj3d.position;
    }

}


export { WorldAdventure }