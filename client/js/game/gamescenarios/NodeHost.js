import {Object3D} from "../../../libs/three/core/Object3D.js";
import {EncounterIndicator} from "../visuals/EncounterIndicator.js";
import {parseConfigDataKey} from "../../application/utils/ConfigUtils.js";

let typeIndicators = {};

typeIndicators[''] = 'unknown_indicator';
typeIndicators['TRAVEL'] = 'travel_indicator';
typeIndicators['TREASURE'] = false
typeIndicators['ENCOUNTER'] = false;
typeIndicators['BATTLE'] = false;

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
            let adventure = this.node.call.getAdventure();
            if (adventure === null) {
                return;
            }
            let cfg = this.node.call.getConfig();

            if (!cfg) {
                return;
            }

            let cfgType = cfg['node_type'] || "";

            if (cfgType !== nodeType) {
                nodeType = cfgType;
                let indicatorType = typeIndicators[nodeType];
                if (indicatorType !== false) {
                    parseConfigDataKey("ENCOUNTER_INDICATORS", "INDICATORS",  'indicator_data', indicatorType, onIndicatorData)
                } else {
                    this.encounterIndicator.hideIndicator();
                }
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

    getPos() {
        return this.obj3d.position;
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