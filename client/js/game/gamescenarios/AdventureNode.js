import {Vector3} from "../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../libs/three/core/Object3D.js";


class AdventureNode {
    constructor() {

        this.adventure = null;
        this.obj3d = new Object3D();
        let pos = this.obj3d.position;

        let getConfig = function() {
            return this.adventure.call.getNodeConfig(this);
        }.bind(this);

        function update() {
            MATH.vec3FromArray(pos, getConfig().pos);
        }

        function getPos() {
            return pos;
        }

        this.call = {
            getConfig:getConfig,
            getPos:getPos,
            update:update
        }

    }

    getPos() {
        return this.call.getPos();
    }

    activateAdventureNode(adventure) {
        this.adventure = adventure;
        GameAPI.registerGameUpdateCallback(this.call.update);
    }

    deactivateAdventureNode() {
        this.call.setConfig(null);
        GameAPI.unregisterGameUpdateCallback(this.call.update);
    }

}

export {AdventureNode}