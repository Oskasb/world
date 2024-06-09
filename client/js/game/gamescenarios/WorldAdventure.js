import {Object3D} from "../../../libs/three/core/Object3D.js";
import {MATH} from "../../application/MATH.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {EncounterIndicator} from "../visuals/EncounterIndicator.js";
import {parseConfigDataKey} from "../../application/utils/ConfigUtils.js";
import {ENUMS} from "../../application/ENUMS.js";
import {getPlayerActor} from "../../application/utils/ActorUtils.js";

class WorldAdventure {
    constructor() {
        this.obj3d = new Object3D();
        this.id = null;
        this.config = {
            nodes:[]
        }

        this.distance = 0;
        this.isNear = false;
        let activeNodes = [];


        let isStarted = false;
        let rootIndicator = new EncounterIndicator(this.obj3d)

        let onIndicatorData = function(config) {
            rootIndicator.hideIndicator();
            rootIndicator.applyIndicatorConfig(config);
            rootIndicator.showIndicator();
        }

        let activeNodeIndex = -1;

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
                node.call.setAdventure(this);
            }

        }.bind(this)


        let activeNodeIndexUpdate = function() {
            console.log("activeNodeIndexUpdate",activeNodeIndex)
            if (isActive === true) {
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

            activeNodeIndex = getTargetNodeIndex();


                let newNode = this.adventureNodes[activeNodeIndex];
                if (!newNode) {
                    console.log("No new node.. (all nodes completed)", activeNodeIndex, this.adventureNodes)
                    sleepAdventure(activeNodeIndex);
                } else if (newNode.isActive === false) {
                    newNode.activateAdventureNode(this)
                    //    this.getPos().copy(newNode.getPos())
                    activeNodes.push(newNode);
                }


        }.bind(this)


        let processProximityState = function() {

            let dst = MATH.distanceBetween(this.getPos(), ThreeAPI.getCameraCursor().getPos())

                if (dst < 20) {
                    if (this.isNear === false) {
                        let node = getTargetNode();
                        node.activateAdventureNode()
                        rootIndicator.hideIndicator();
                    }
                    this.isNear = true;
                } else {
                    if (this.isNear === true) {
                        let node = getTargetNode();
                        node.deactivateAdventureNode()
                        rootIndicator.showIndicator();
                    }
                    this.isNear = false;
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
                        node.activateAdventureNode()
                    }
                }
            } else {
                processProximityState()
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
           }.bind(this);

        let deactivateAdventure = function() {
            GameAPI.gameAdventureSystem.call.playerAdventureDeActivated(this)
            isActive = false;
            closeActiveNodes();
        }.bind(this);

        let getNodeConfig = function(node) {
            return this.config.nodes[this.adventureNodes.indexOf(node)];
        }.bind(this)

        function setTargetNodeIndex(idx) {
            let playerActor = getPlayerActor();
            if (playerActor) {
                playerActor.setAdventureProgress(this.id, idx);
            }
        }

        let getTargetNodeIndex = function() {

            let playerActor = getPlayerActor();
            if (playerActor) {
                return playerActor.getAdventureProgress(this.id);
            }
            return 0;
        }.bind(this)

        let wakeTargetNode = function() {
            console.log("wakeTargetNode", this);
            isStarted = true;

        }.bind(this)

        let sleepAdventure = function(atNodeIndex) {
            console.log("sleepAdventure", this);

            closeActiveNodes();

            if (isStarted === true) {

                isStarted = false;
                if (typeof (atNodeIndex) === 'number') {
                    if (this.adventureNodes.length < atNodeIndex) {
                        console.log("Stop Adv after last node", atNodeIndex, this.adventureNodes)
                        GameAPI.gameAdventureSystem.call.adventureCompleted(this)
                    } else {
                        console.log("Stop Adv at present nodes", atNodeIndex, this.adventureNodes)
                    }
                }

                if (this.call.isCompleted() === false) {
                    rootIndicator.showIndicator();
                }
            }

        }.bind(this);


        let advanceAdventureStage = function() {
            console.log("advanceAdventureStage", this)

            GameAPI.gameAdventureSystem.call.playerAdventureActivated(activeNodes, this)
            let activeActor = GameAPI.getGamePieceSystem().selectedActor;

            if (activeActor) {
                activeActor.setAdventureProgress(this.id, getTargetNodeIndex() +1);
            }

        }.bind(this);

        let notifyEncounterCompleted = function(worldEncounter) {
                 let node = getTargetNode();
                 if (typeof (node) === 'object') {
                     if (node.call.getEncounter() === worldEncounter) {
                         console.log("notifyEncounterCompleted", worldEncounter, getTargetNodeIndex())
                         advanceAdventureStage()
                     }
                 }

        }

        let notifyEncounterOperation = function() {
                advanceAdventureStage()
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
            return this.adventureNodes[getTargetNodeIndex()];
        }.bind(this);


        let adventureIsActive = function() {
            let activeActor = getPlayerActor();
            if (activeActor) {
                let activeId = activeActor.getStatus(ENUMS.ActorStatus.ACTIVE_ADVENTURE)
                if (activeId === this.id) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }

        let adventureIsSelected = function() {
            let selectedAdv = GameAPI.gameAdventureSystem.call.getSelectedAdventure();
            if (selectedAdv === this) {
                return true
            } else {
                return false;
            }
        }.bind(this)


        this.call = {
            update:update,
            updateDistance:updateDistance,
            getCursorDistance:getCursorDistance,
            getTargetNodeIndex:getTargetNodeIndex,
            getTargetNode:getTargetNode,
            getNodeConfig:getNodeConfig,
            activateAdventure:activateAdventure,
            sleepAdventure:sleepAdventure,
            deactivateAdventure:deactivateAdventure,
            applyLoadedConfig:applyLoadedConfig,
            notifyEncounterCompleted:notifyEncounterCompleted,
            notifyEncounterOperation:notifyEncounterOperation,
            isCompleted:isCompleted,
            adventureIsActive:adventureIsActive,
            adventureIsSelected:adventureIsSelected
        }

    }

    getPos() {

        let targetNode = this.call.getTargetNode();
        if (typeof (targetNode) !== 'undefined') {
            this.obj3d.position.lerp(targetNode.getPos(), 0.2);
        }

        return this.obj3d.position;
    }

    getNodes() {
        return this.adventureNodes;
    }

}


export { WorldAdventure }