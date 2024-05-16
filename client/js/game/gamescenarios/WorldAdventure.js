import {Object3D} from "../../../libs/three/core/Object3D.js";
import {MATH} from "../../application/MATH.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";

class WorldAdventure {
    constructor() {
        this.obj3d = new Object3D();
        this.id = null;
        this.config = {
            nodes:[]
        }
        let activeAdventures = GameAPI.gameAdventureSystem.getActiveWorldAdventures()

        this.adventureNodes = [];

        let applyLoadedConfig = function(cfg) {
            console.log("applyLoadedConfig", cfg, this)
            MATH.vec3FromArray(this.getPos(), cfg.nodes[0].pos)
            this.config = cfg;
        }.bind(this);


        let update = function() {
            MATH.vec3FromArray(this.getPos(), this.config.nodes[0].pos)
            if (this.adventureNodes.length !== this.config.nodes.length) {
                closeActiveNodes();
            }

            while (this.adventureNodes.length < this.config.nodes.length) {
                let node = poolFetch('AdventureNode');
                node.activateAdventureNode(this)
                this.adventureNodes.push(node);
            }

        }.bind(this)


        let closeActiveNodes = function() {
            while(this.adventureNodes.length) {
                let node = this.adventureNodes.pop();
                node.deactivateAdventureNode();
                poolReturn(node);
            }
        }.bind(this)

        let activateAdventure = function() {
            activeAdventures.push(this)
            GameAPI.registerGameUpdateCallback(update);
           }.bind(this);

        let deactivateAdventure = function() {
            MATH.splice(activeAdventures, this);
            closeActiveNodes();
            GameAPI.unregisterGameUpdateCallback(update);
        }.bind(this);


        let getNodeConfig = function(node) {
            return this.config.nodes[this.adventureNodes.indexOf(node)];
        }.bind(this)

        this.call = {
            getNodeConfig:getNodeConfig,
            activateAdventure:activateAdventure,
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