import { ConfigData } from "../../application/utils/ConfigData.js";
import {Object3D } from "../../../libs/three/core/Object3D.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import { DynamicGrid} from "./DynamicGrid.js";
import { DynamicPath } from "./DynamicPath.js";
import { DynamicWalker} from "./DynamicWalker.js";
import * as ScenarioUtils from "./ScenarioUtils.js";
import { GridTileSelector } from "../piece_functions/GridTileSelector.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";


let centerTileIndexX = 0;
let centerTileIndexY = 0;

class GameWalkGrid {
    constructor() {
        this.dynamicPath = new DynamicPath();
        this.dynamicGrid = new DynamicGrid();
        this.dynamicWalker = new DynamicWalker();
        this.gridTileSelector = new GridTileSelector();

        this.lastCenterX = null;
        this.lastCenterY = null;

        this.isActive = false;

        this.dataId = null;

        this.targetPosition = new Vector3()

        this.hostObj3d = new Object3D();
        this.moveObj3d = new Object3D();

        this.instances = [];
        this.configData = new ConfigData("GRID", "WALK_GRID",  'walk_grid_data', 'data_key', 'config')

        this.config = null;

        let configUpdate = function(config, updateCount) {
        //    console.log("Update Count: ", updateCount, config)
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

        let deactivate = function() {
            this.deactivateWalkGrid();
        }.bind(this);

        this.call = {
            configUpdate:configUpdate,
            updateWalkGrid:updateWalkGrid,
            deactivate:deactivate
        }
    }

    setTargetPosition(posVec) {
        this.targetPosition.copy(posVec);
    }

    getTargetPosition() {
        return this.targetPosition;
    }

    updateGridCenter = function(posVec) {
        this.hostObj3d.position.copy(posVec);
    }

    activateWalkGrid = function(walkOriginObj3d, tileRange) {

        this.hostObj3d.copy(walkOriginObj3d);

        if (this.isActive) {
            this.deactivateWalkGrid();
        } else {
            this.gridTileSelector.setPos(this.hostObj3d.position);
            this.gridTileSelector.activateGridTileSelector()
        }

            console.log("Activate Walk Grid", this.hostObj3d.position)
            if (this.dataId !== "grid_walk_world") {
                this.configData.parseConfig("grid_walk_world", this.call.configUpdate)
                this.dataId = "grid_walk_world";
            }

            this.isActive = true;

            this.dynamicGrid.activateDynamicGrid(this.config['grid'], tileRange)
            GameAPI.registerGameUpdateCallback(this.call.updateWalkGrid);

    }

    getGridOriginPos() {
        return this.hostObj3d.position;
    }

    cancelActivePath() {
        this.dynamicPath.tilePath.cutTilePath();
    }

    getTileAtPosition(posVec) {
        let gridTiles = this.dynamicGrid.dynamicGridTiles
        return ScenarioUtils.getTileForPosition(gridTiles, posVec)
    }

    buildGridPath(to, from) {
        this.dynamicWalker.call.clearDynamicPath()
        let gridTiles = this.dynamicGrid.dynamicGridTiles
        let fromTile = ScenarioUtils.getTileForPosition(gridTiles, from)

        let toTile = ScenarioUtils.getTileForPosition(gridTiles, to)
        let tilePath = this.dynamicPath.selectTilesBeneathPath(fromTile, toTile, gridTiles);

        return tilePath;

    }

    applySelectedPath(onUpdateCB, onCompletedCB) {
        this.dynamicPath.clearPathVisuals();
        let activePath = this.getActiveTilePath();

        if (activePath.pathTiles.length > 1) {
            if (onCompletedCB) {
                activePath.pathCompetedCallbacks.push(onCompletedCB)
            }

        if (onUpdateCB) {
            activePath.pathingUpdateCallbacks.push(onUpdateCB);
        }

            this.walkObj3dAlongPath(this.moveObj3d)
        } else {
            this.deactivateWalkGrid();
        }

    }

    getActiveTilePath() {
        return this.dynamicPath.tilePath;
    }

    walkObj3dAlongPath(obj3d) {
    //    console.log("Walk path", obj3d.position);
        this.setGridHostObj3d(obj3d);
        this.setGridMovementObj3d(obj3d);
        this.dynamicWalker.call.walkDynamicPath(this.getActiveTilePath(), this)

    }

    setGridHostObj3d = function(obj3d) {
        this.hostObj3d.copy(obj3d);
    }

    setGridMovementObj3d = function(obj3d) {
        this.moveObj3d.copy(obj3d);
    }

    getGridMovementObj3d = function() {
        return this.moveObj3d;
    }



    updateWalkGrid = function() {
        let origin = this.hostObj3d.position; // ThreeAPI.getCameraCursor().getPos();
        let offset = 0 //this.config['grid']['tile_spacing'] * 0.5
        centerTileIndexX = Math.floor(origin.x + offset)
        centerTileIndexY = Math.floor(origin.z + offset)

        if (this.lastCenterX === centerTileIndexX && this.lastCenterY === centerTileIndexY) {

        } else {
            this.lastCenterX = centerTileIndexX;
            this.lastCenterY = centerTileIndexY;
            this.dynamicGrid.updateDynamicGrid(centerTileIndexX, centerTileIndexY);
            return true;
        }


    }

    deactivateWalkGrid() {
        console.log("Deactivate Walk Grid:", this)
        this.gridTileSelector.deactivateGridTileSelector()
        let activePath = this.getActiveTilePath();

        while (activePath.pathCompetedCallbacks.length) {
            activePath.pathCompetedCallbacks.pop()(this.moveObj3d)
        }
        while (activePath.pathingUpdateCallbacks.length) {
            activePath.pathingUpdateCallbacks.pop()
        }

        this.dynamicGrid.deactivateDynamicGrid();

        GameAPI.unregisterGameUpdateCallback(this.call.updateWalkGrid);
        this.isActive = false;
    }


}

export { GameWalkGrid }