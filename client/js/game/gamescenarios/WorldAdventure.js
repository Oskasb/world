import {Object3D} from "../../../libs/three/core/Object3D.js";
import {MATH} from "../../application/MATH.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {EncounterIndicator} from "../visuals/EncounterIndicator.js";
import {parseConfigDataKey} from "../../application/utils/ConfigUtils.js";
import {ENUMS} from "../../application/ENUMS.js";

class WorldAdventure {
    constructor() {
        this.obj3d = new Object3D();
        this.id = null;
        this.config = {
            nodes:[]
        }

        this.distance = 0;

        let activeNodes = [];

        let isStarted = false;
        let rootIndicator = new EncounterIndicator(this.obj3d)

        let onIndicatorData = function(config) {
            rootIndicator.hideIndicator();
            rootIndicator.applyIndicatorConfig(config);
            rootIndicator.showIndicator();
        }

        let targetNodeIndex = -1;
        let activeNodeIndex = -1;

        let activeAdventures = GameAPI.gameAdventureSystem.getActiveWorldAdventures()

        this.adventureNodes = [];

        let applyLoadedConfig = function(cfg) {
            console.log("applyLoadedConfig", cfg, this)
            MATH.vec3FromArray(this.getPos(), cfg.nodes[0].pos)
            this.config = cfg;
            this.id = cfg['edit_id'];
            ThreeAPI.clearTerrainLodUpdateCallback(lodUpdated)
            ThreeAPI.registerTerrainLodUpdateCallback(this.getPos(), lodUpdated)
        }.bind(this);


        let isActive = false;

        let lodUpdated = function(lodLevel) {

            if (lodLevel !== -1) {
                if (isActive === false) {
                    activateAdventure()
                }
            } else {
                if (isActive === true) {
                    deactivateAdventure()
                }
            }
        }.bind(this);


        let unrollAdventureNodes = function() {
            if (this.adventureNodes.length !== this.config.nodes.length) {
                closeActiveNodes();
            }

            while (this.adventureNodes.length < this.config.nodes.length) {
                let node = poolFetch('AdventureNode');
                this.adventureNodes.push(node);
            }

        }.bind(this)


        let activeNodeIndexUpdate = function() {
            if (targetNodeIndex === -1) {
                rootIndicator.showIndicator();
            } else {
                rootIndicator.hideIndicator();
            }

            let oldNode = this.adventureNodes[activeNodeIndex];
            if (oldNode) {
                if (oldNode.isActive === true) {
                    oldNode.deactivateAdventureNode();
                    MATH.splice(activeNodes, oldNode)
                }
            }

            activeNodeIndex = targetNodeIndex;

            if (activeNodeIndex !== -1) {
                let newNode = this.adventureNodes[activeNodeIndex];
                if (!newNode) {
                    console.log("No new node.. (all nodes completed)", activeNodeIndex, this.adventureNodes)
                    stopAdventure(activeNodeIndex);
                } else if (newNode.isActive === false) {
                    newNode.activateAdventureNode(this)
                    activeNodes.push(newNode);
                }
            }
        }.bind(this)


        let processActiveNode = function() {

            if (activeNodeIndex !== targetNodeIndex) {
                activeNodeIndexUpdate()
            }

            let dst = MATH.distanceBetween(this.getPos(), ThreeAPI.getCameraCursor().getPos())

            if (dst < 20) {
                if (isStarted === false) {
                    startAdventure();
                    if (activeNodeIndex === -1) {
                        setTargetNodeIndex(0);
                    }
                }
            } else {
                if (isStarted === true) {
                    if (activeNodeIndex === 0) {
                        stopAdventure();
                        setTargetNodeIndex(-1);
                    }
                }
            }

        }.bind(this)

        function calcDistance(aPos) {
            let cPos = ThreeAPI.getCameraCursor().getPos();
            return MATH.distanceBetween(cPos, aPos);
        }

        let getCursorDistance = function() {
            return this.distance;
        }.bind(this)

        let updateDistance = function() {
            this.distance = calcDistance(this.getPos())
        }.bind(this);

        let update = function() {
            MATH.vec3FromArray(this.getPos(), this.config.nodes[0].pos)
            unrollAdventureNodes()



            if (expandAll === true) {
                for (let i = 0; i < this.adventureNodes.length; i++) {
                    let node = this.adventureNodes[i];
                    if (node.isActive === false) {
                        node.activateAdventureNode(this)
                    }
                }
            } else {
                processActiveNode()
            }

        }.bind(this)


        let closeActiveNodes = function() {
            MATH.emptyArray(activeNodes);
            console.log("Close Active Nodes ", this.adventureNodes.length, this.adventureNodes)
            while(this.adventureNodes.length) {
                let node = this.adventureNodes.pop();
                node.deactivateAdventureNode();
                poolReturn(node);
            }
        }.bind(this)

        let expandAll = false;

        let activateAdventure = function(expandAllNodes) {
            if (isStarted === true) {
                return;
            }
            parseConfigDataKey("ENCOUNTER_INDICATORS", "INDICATORS",  'indicator_data', 'adventure_indicator', onIndicatorData)
            expandAll = expandAllNodes || false;
            isActive = true;
            activeAdventures.push(this)
            GameAPI.registerGameUpdateCallback(update);
           }.bind(this);

        let deactivateAdventure = function() {
            if (isStarted === true) {
                return;
            }
            isActive = false;
            MATH.splice(activeAdventures, this);
            closeActiveNodes();
            GameAPI.unregisterGameUpdateCallback(update);
        }.bind(this);


        let getNodeConfig = function(node) {
            return this.config.nodes[this.adventureNodes.indexOf(node)];
        }.bind(this)


        function setTargetNodeIndex(idx) {
            targetNodeIndex = idx;
        }

        function getTargetNodeIndex() {
            return targetNodeIndex;
        }

        let startAdventure = function() {
            console.log("startAdventure", this);
            MATH.splice(activeAdventures, this);
            isStarted = true;
            rootIndicator.hideIndicator();
        }.bind(this)

        let stopAdventure = function(atNodeIndex) {
            console.log("stopAdventure", this);
            if (activeAdventures.indexOf(this) === -1) {
                activeAdventures.push(this)
            }
            closeActiveNodes();
            if (isStarted === true) {
                isStarted = false;
                if (atNodeIndex) {
                    if (this.adventureNodes.length < atNodeIndex) {
                        console.log("Stop Adv after last node", atNodeIndex, this.adventureNodes)
                        GameAPI.gameAdventureSystem.call.adventureCompleted(this)
                    } else {
                        console.log("Stop Adv at present nodes", atNodeIndex, this.adventureNodes)
                    }
                } else {
                    rootIndicator.showIndicator();
                }
                GameAPI.gameAdventureSystem.call.playerAdventureDeActivated(this)
                activeNodeIndex = -1;
            }
        }.bind(this);


        let advanceAdventureStage = function() {
            if (activeNodeIndex === 0) {
                console.log("Trigger active adventure")
                GameAPI.gameAdventureSystem.call.playerAdventureActivated(activeNodes, this)
            }
            console.log("advanceAdventureStage", targetNodeIndex)
                   targetNodeIndex++

            let activeActor = GameAPI.getGamePieceSystem().selectedActor;

            if (activeActor) {
                activeActor.setAdventureProgress(this.id, targetNodeIndex);
            }

        }.bind(this);

        let notifyEncounterCompleted = function() {
            if (activeNodeIndex !== -1) {
                console.log("notifyEncounterCompleted", activeNodeIndex)
                notifyEncounterOperation();
            }
        }

        let notifyEncounterOperation = function(worldEncounter) {
            if (activeNodeIndex === -1) {
                return;
            }
        //    let node = this.adventureNodes[activeNodeIndex];
            advanceAdventureStage()
            return;
            let nodeCfg = node.call.getConfig();
            let encCfg = worldEncounter.config;
            if (encCfg['node_id'] === nodeCfg.node_id) {
                console.log("active node operation", node)

            } else {
                console.log('not active notifyEncounterOperation', worldEncounter.id, nodeCfg, worldEncounter, node)
            }

            }.bind(this)


        let isCompleted = function() {
            let activeActor = GameAPI.getGamePieceSystem().selectedActor;
            if (activeActor) {
                let dataList = activeActor.getStatus(ENUMS.ActorStatus.COMPLETED_ADVENTURES)
                if (dataList.indexOf(this.id) !== -1) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }

        }.bind(this)

        let getTargetNode = function() {
            return this.adventureNodes[activeNodeIndex];
        }.bind(this);


        this.call = {
            updateDistance:updateDistance,
            getCursorDistance:getCursorDistance,
            setTargetNodeIndex:setTargetNodeIndex,
            getTargetNodeIndex:getTargetNodeIndex,
            getTargetNode:getTargetNode,
            getNodeConfig:getNodeConfig,
            activateAdventure:activateAdventure,
            startAdventure:startAdventure,
            stopAdventure:stopAdventure,
            deactivateAdventure:deactivateAdventure,
            applyLoadedConfig:applyLoadedConfig,
            notifyEncounterCompleted:notifyEncounterCompleted,
            notifyEncounterOperation:notifyEncounterOperation,
            isCompleted:isCompleted
        }

    }

    getPos() {
        return this.obj3d.position;
    }

    getNodes() {
        return this.adventureNodes;
    }

}


export { WorldAdventure }