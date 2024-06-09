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
        let adventure = null;
        this.obj3d = new Object3D();
        let pos = this.obj3d.position;



        let nodeType = null;

        let encounter = null;
        let treasure = null;

        let getConfig = function() {
            return adventure.call.getNodeConfig(this);
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

            encounter.activateWorldEncounter()
            encounter.getHostActor().turnTowardsPos(ThreeAPI.getCameraCursor().getPos());

        //    wEnc.deactivateWorldEncounter()
            // wEnc.visualEncounterHost.removeEncounterHost();
            console.log("Node Encounter ready ", encounter);
            worldEncounters.push(encounter);
        }

        let removeNodeContent = function() {
            console.log("removeNodeContent", adventure)
            if (encounter !== null) {
                console.log("Remove Node encounter", encounter)
                encounter.deactivateWorldEncounter();
                MATH.splice(worldEncounters, encounter);
            }
            if (treasure !== null) {
                console.log("Remove Node treasure", treasure)
                treasure.removeWorldTreasure();
            }

            encounter = null;
            treasure = null;

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
                    if (encounter === null) {
                        console.log("setup enc node:", encCfg)
                        encounter = new WorldEncounter(encCfg.edit_id, encCfg, encReady)
                    }

                }

            }

            if (nodeType === "TREASURE") {
                console.log("Handle treasure node here..")
            }

            if (nodeType === "TRAVEL") {
                console.log("Handle Travel Node type here..")
            }

        }


        function setAdventure(adv) {
            adventure = adv;
            let cfg = getConfig();
            MATH.vec3FromArray(pos, cfg.pos);
        }

        function update() {

            let cfg = getConfig();
            let cfgType = cfg['node_type'] || "";

            if (cfgType !== nodeType) {
                nodeType = cfgType;
                updateNodeType()
            }
/*
            if (encounter !== null) {
                pos.copy(encounter.getPos())
            } else {
                MATH.vec3FromArray(pos, cfg.pos);
            }
*/


        }

        function getPos() {
            let cfg = getConfig();
            MATH.vec3FromArray(pos, cfg.pos);
            return pos;
        }

        let close = function() {
            removeNodeContent();
            despawnNodeHost();

            nodeType = null;
        }

        function getAdventure() {
            return adventure;
        }

        function getEncounter() {
            return encounter;
        }

        this.call = {
            close:close,
            setAdventure:setAdventure,
            getAdventure:getAdventure,
            getEncounter:getEncounter,
            spawnNodeHost:spawnNodeHost,
            getConfig:getConfig,
            getPos:getPos,
            update:update
        }
    }

    getPos() {
        return this.call.getPos();
    }

    activateAdventureNode() {
        this.isActive = true;
        GameAPI.registerGameUpdateCallback(this.call.update);
        this.call.spawnNodeHost();
    }

    deactivateAdventureNode() {
        console.log("deactivateAdventureNode", this)
        this.isActive = false;

        this.call.close();
//        this.call.setAdventure(adventure);
//        this.adventure = null;
        GameAPI.unregisterGameUpdateCallback(this.call.update);
    }

}

export {AdventureNode}