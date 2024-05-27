import {Object3D} from "../../../libs/three/core/Object3D.js";
import {EncounterIndicator} from "../visuals/EncounterIndicator.js";
import {parseConfigDataKey} from "../../application/utils/ConfigUtils.js";

let typeIndicators = {};

typeIndicators[''] = 'unknown_indicator';
typeIndicators['TRAVEL'] = 'travel_indicator';
typeIndicators['TREASURE'] = 'treasure_indicator'
typeIndicators['ENCOUNTER'] = 'encounter_indicator';
typeIndicators['BATTLE'] = 'battle_indicator';

class NodeHost {
    constructor() {

        this.node = null;
        this.obj3d = new Object3D();
        this.encounterIndicator = new EncounterIndicator(this.obj3d)
        let pos = this.obj3d.position;
        let nodeType = null;



        let onIndicatorData = function(config) {
            this.encounterIndicator.hideIndicator();
            this.encounterIndicator.applyIndicatorConfig(config);
            this.encounterIndicator.showIndicator();
        }.bind(this)



        let update = function () {
            if (this.node.adventure === null) {
                return;
            }
            let cfg = this.node.call.getConfig();

            let cfgType = cfg['node_type'] || "";

            if (cfgType !== nodeType) {
                nodeType = cfgType;
                let indicatorType = typeIndicators[nodeType];
                parseConfigDataKey("ENCOUNTER_INDICATORS", "INDICATORS",  'indicator_data', indicatorType, onIndicatorData)
            }
            MATH.vec3FromArray(pos, cfg.pos);
        }.bind(this)

        function close() {
            nodeType = null;
        }

        this.call = {
            update:update,
            close:close
        }

    }

    activateNodeHost(node) {
        this.node = node;
        GameAPI.registerGameUpdateCallback(this.call.update);
        this.encounterIndicator.showIndicator()
    }

    deactivateNodeHost() {
        GameAPI.unregisterGameUpdateCallback(this.call.update);
        this.encounterIndicator.hideIndicator()
        this.call.close()
    }

}

export { NodeHost }