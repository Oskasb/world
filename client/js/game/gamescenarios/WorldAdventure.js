import {Object3D} from "../../../libs/three/core/Object3D.js";
import {MATH} from "../../application/MATH.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {EncounterIndicator} from "../visuals/EncounterIndicator.js";
import {parseConfigDataKey} from "../../application/utils/ConfigUtils.js";

class WorldAdventure {
    constructor() {
        this.obj3d = new Object3D();
        this.id = null;
        this.config = {
            nodes:[]
        }

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



        let processActiveNode = function() {
            if (activeNodeIndex !== targetNodeIndex) {
                rootIndicator.hideIndicator();
                let oldNode = this.adventureNodes[activeNodeIndex];
                if (oldNode) {
                    oldNode.call.deactivateAdventureNode()
                }

                activeNodeIndex = targetNodeIndex;

                let newNode = this.adventureNodes[activeNodeIndex];
                if (!newNode) {
                    console.log("No new node.. there should be one")
                }

                if (newNode.isActive === false) {
                    newNode.activateAdventureNode(this)
                }
            }

        }.bind(this)

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
            isStarted = true;
            rootIndicator.hideIndicator();
        }.bind(this)

        let stopAdventure = function() {
            isStarted = false;
        }

        this.call = {
            setTargetNodeIndex:setTargetNodeIndex,
            getTargetNodeIndex:getTargetNodeIndex,
            getNodeConfig:getNodeConfig,
            activateAdventure:activateAdventure,
            startAdventure:startAdventure,
            stopAdventure:stopAdventure,
            deactivateAdventure:deactivateAdventure,
            applyLoadedConfig:applyLoadedConfig,
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