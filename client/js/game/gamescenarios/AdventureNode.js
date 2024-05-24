import {Object3D} from "../../../libs/three/core/Object3D.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";

class AdventureNode {
    constructor() {

        this.adventure = null;
        this.obj3d = new Object3D();
        let pos = this.obj3d.position;

        let nodeType = null;

        let getConfig = function() {
            return this.adventure.call.getNodeConfig(this);
        }.bind(this);

        let nodeHost = null;
        let spawnNodeHost = function() {
            console.log("spawnNodeHost", getConfig())
            nodeHost = poolFetch('NodeHost')
            nodeHost.activateNodeHost(this)
        }.bind(this)

        function despawnNodeHost() {
            nodeHost.deactivateNodeHost()
            poolReturn(nodeHost)
        }


        function update() {

            let cfg = getConfig();
            let cfgType = cfg['node_type'] || "";

            if (cfgType !== nodeType) {
                nodeType = cfgType;
            }

            MATH.vec3FromArray(pos, cfg.pos);
        }

        function getPos() {
            return pos;
        }

        this.call = {

            spawnNodeHost:spawnNodeHost,
            despawnNodeHost:despawnNodeHost,
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
        this.call.spawnNodeHost();
    }

    deactivateAdventureNode() {
        this.adventure = null;
        GameAPI.unregisterGameUpdateCallback(this.call.update);
        this.call.despawnNodeHost();
    }

}

export {AdventureNode}