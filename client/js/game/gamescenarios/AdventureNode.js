import {Vector3} from "../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../libs/three/core/Object3D.js";
import {EncounterIndicator} from "../visuals/EncounterIndicator.js";
import {parseConfigDataKey} from "../../application/utils/ConfigUtils.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";


class AdventureNode {
    constructor() {

        this.adventure = null;
        this.obj3d = new Object3D();
        this.encounterIndicator = new EncounterIndicator(this.obj3d)
        let pos = this.obj3d.position;

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
            MATH.vec3FromArray(pos, getConfig().pos);
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

                    let onIndicatorData = function(config) {
                        this.encounterIndicator.applyIndicatorConfig(config);
                    }.bind(this)
                    parseConfigDataKey("ENCOUNTER_INDICATORS", "INDICATORS",  'indicator_data', 'adventure_indicator', onIndicatorData)

        this.encounterIndicator.showIndicator()
    }

    deactivateAdventureNode() {
        this.adventure = null;
        GameAPI.unregisterGameUpdateCallback(this.call.update);
        this.encounterIndicator.hideIndicator()
    }

}

export {AdventureNode}