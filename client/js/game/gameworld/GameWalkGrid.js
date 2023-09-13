import { ConfigData } from "../../application/utils/ConfigData.js";
import {Object3D } from "../../../libs/three/core/Object3D.js";
import { DynamicGrid} from "./DynamicGrid.js";
import { DynamicPath } from "./DynamicPath.js";
import { DynamicWalker} from "./DynamicWalker.js";
import * as ScenarioUtils from "./ScenarioUtils.js";

let centerTileIndexX = 0;
let centerTileIndexY = 0;

class GameWalkGrid {
    constructor() {
        this.dynamicPath = new DynamicPath();
        this.dynamicGrid = new DynamicGrid();
        this.dynamicWalker = new DynamicWalker();
        this.isActive = false;

        this.dataId = null;

        this.hostObj3d = new Object3D();
        this.moveObj3d = this.hostObj3d;

        this.instances = [];
        this.configData = new ConfigData("GRID", "WALK_GRID",  'walk_grid_data', 'data_key', 'config')

        this.config = null;

        let configUpdate = function(config, updateCount) {
            console.log("Update Count: ", updateCount, config)
            this.config = config;
            if (updateCount) {
                GuiAPI.printDebugText("REFLOW GRID")
                //        this.removeEncounterGrid();
            } else {
                setTimeout(function() {
                    //    onReady(this);
                }, 0);
            }
            //    this.applyGridConfig(config, scenarioGridConfig);
        }.bind(this)

        let updateWalkGrid = function() {
            this.updateWalkGrid();
        }.bind(this);

        this.call = {
            configUpdate:configUpdate,
            updateWalkGrid:updateWalkGrid
        }
    }

    activateWalkGrid = function() {

        if (this.isActive) {
            this.deactivateWalkGrid();
        } else {
            console.log("Activate Walk Grid")
            if (this.dataId !== "grid_walk_world") {
                this.configData.parseConfig("grid_walk_world", this.call.configUpdate)
                this.dataId = "grid_walk_world";
            }

            this.isActive = true;

            this.dynamicGrid.activateDynamicGrid(this.config['grid'])
            GameAPI.registerGameUpdateCallback(this.call.updateWalkGrid);
        }

    }

    getTileAtPosition(posVec) {
        let gridTiles = this.dynamicGrid.dynamicGridTiles
        return ScenarioUtils.getTileForPosition(gridTiles, posVec)
    }

    buildGridPath(from, to) {
        this.dynamicWalker.call.clearDynamicPath()
        let gridTiles = this.dynamicGrid.dynamicGridTiles
        let fromTile = ScenarioUtils.getTileForPosition(gridTiles, from)
        let toTile = ScenarioUtils.getTileForPosition(gridTiles, to)
        return this.dynamicPath.selectTilesBeneathPath(fromTile, toTile, gridTiles);
    }

    getActiveTilePath() {
        return this.dynamicPath.tilePath;
    }

    walkAlongPath(obj3d) {
        console.log("Walk path", obj3d);
        this.setGridHostObj3d(obj3d);
        this.setGridMovementObj3d(obj3d);
        this.dynamicWalker.call.walkDynamicPath(this.getActiveTilePath(), obj3d)
    }

    setGridHostObj3d = function(obj3d) {
        this.hostObj3d.copy(obj3d);
    }

    setGridMovementObj3d = function(obj3d) {
        this.moveObj3d = obj3d;
    }

    updateWalkGrid = function() {
        let origin = this.hostObj3d.position; // ThreeAPI.getCameraCursor().getPos();
        let offset = this.config['grid']['tile_spacing'] * 0.5
        centerTileIndexX = Math.floor(origin.x + offset)
        centerTileIndexY = Math.floor(origin.z + offset)
        this.dynamicGrid.updateDynamicGrid(centerTileIndexX, centerTileIndexY);
    }

    deactivateWalkGrid() {
        console.log("Deactivate Walk Grid:", this)
        this.dynamicGrid.deactivateDynamicGrid();
        GameAPI.unregisterGameUpdateCallback(this.call.updateWalkGrid);
        this.isActive = false;
    }


}

export { GameWalkGrid }