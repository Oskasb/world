import {Object3D} from "../../../libs/three/core/Object3D.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {WorldEncounter} from "../encounter/WorldEncounter.js";

let worldEncounters = null;

class AdventureNode {
    constructor() {


        if (worldEncounters === null) {
            worldEncounters = GameAPI.worldModels.getWorldEncounters()
        }

        this.isActive = false;
        this.adventure = null;
        this.obj3d = new Object3D();
        let pos = this.obj3d.position;

        let nodeType = null;

        let encounter = null;
        let treasure = null;

        let getConfig = function() {
            return this.adventure.call.getNodeConfig(this);
        }.bind(this);

        let preDeactivated = false;

        let nodeHost = null;
        let spawnNodeHost = function() {
            console.log("spawnNodeHost", getConfig())
            nodeHost = poolFetch('NodeHost')
            nodeHost.activateNodeHost(this)
        }.bind(this)

        function despawnNodeHost() {
            console.log("despawnNodeHost", nodeHost)
            if (nodeHost) {
                nodeHost.deactivateNodeHost()
                poolReturn(nodeHost)
            } else {
                preDeactivated = true;
            }
        }

        function encReady(wEnc) {
            encounter = wEnc;
            wEnc.removeWorldEncounter()
            // wEnc.visualEncounterHost.removeEncounterHost();
            console.log("Node Encounter ready ", encounter);
            worldEncounters.push(encounter);
        }

        function removeNodeContent() {

            if (encounter !== null) {
                console.log("Remove Node encounter", encounter)
                encounter.deactivateWorldEncounter();
                MATH.splice(worldEncounters, encounter);
                encounter = null;
            }
            if (treasure !== null) {
                console.log("Remove Node treasure", treasure)
                treasure.removeWorldTreasure();
                treasure = null;
            }
        }

        function updateNodeType() {

            removeNodeContent()

            if (nodeType === "ENCOUNTER" || nodeType === "BATTLE") {
                let nodeId = getConfig()['node_id'];
                let nodeCfgs = GameAPI.worldModels.getNodeEncounterConfigs()
                let encCfg = nodeCfgs[nodeId]
                if (!encCfg) {
                    nodeType = 'UGLY_LOADING_ASYNC'
                    console.log("No config yet...", nodeId, nodeCfgs)
                } else {
                    new WorldEncounter(encCfg.edit_id, encCfg, encReady)
                }

            }

            if (nodeType === "TREASURE") {
                console.log("Handle treasure node here..")
            }

            if (nodeType === "TRAVEL") {
                console.log("Handle Travel Node type here..")
            }

        }


        function update() {

            let cfg = getConfig();
            let cfgType = cfg['node_type'] || "";

            if (cfgType !== nodeType) {
                nodeType = cfgType;
                updateNodeType()
            }

            MATH.vec3FromArray(pos, cfg.pos);
        }

        function getPos() {
            return pos;
        }

        function close() {
            removeNodeContent();
            despawnNodeHost()
        }

        this.call = {
            close:close,
            spawnNodeHost:spawnNodeHost,
            getConfig:getConfig,
            getPos:getPos,
            update:update
        }
    }

    getPos() {
        return this.call.getPos();
    }

    activateAdventureNode(adventure) {
        this.isActive = true;
        this.adventure = adventure;
        GameAPI.registerGameUpdateCallback(this.call.update);
        this.call.spawnNodeHost();
    }

    deactivateAdventureNode() {
        this.isActive = false;

        this.call.close();
        this.adventure = null;
        GameAPI.unregisterGameUpdateCallback(this.call.update);
    }

}

export {AdventureNode}