import { ConfigData } from "../../application/utils/ConfigData.js";
import {Object3D } from "../../../libs/three/core/Object3D.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import { DynamicGrid} from "./DynamicGrid.js";
import { DynamicPath } from "./DynamicPath.js";
import { DynamicWalker} from "./DynamicWalker.js";
import * as ScenarioUtils from "./ScenarioUtils.js";
import { GridTileSelector } from "../piece_functions/GridTileSelector.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {getTileForScreenPosition} from "./ScenarioUtils.js";

let centerTileIndexX = 0;
let centerTileIndexY = 0;

class GameWalkGrid {
    constructor() {
        let actor = null;
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
            this.updateWalkGrid(actor);
        }.bind(this);

        let deactivate = function() {
            this.deactivateWalkGrid();
        }.bind(this);

        let setActor = function(actr) {
            actor = actr;
        }

        let getActor = function() {
            return actor;
        }

        this.call = {
            configUpdate:configUpdate,
            updateWalkGrid:updateWalkGrid,
            setActor:setActor,
            getActor:getActor,
            deactivate:deactivate
        }

        if (this.dataId !== "grid_walk_world") {
            this.configData.parseConfig("grid_walk_world", this.call.configUpdate)
            this.dataId = "grid_walk_world";
        }

    }

    getActivePathTiles() {
        return this.dynamicPath.tilePath.pathTiles
    }

    setTargetPosition(posVec) {
        this.targetPosition.copy(posVec);
    }

    getTargetPosition() {
        return this.targetPosition;
    }

    setGridCenter(posVec) {
        this.hostObj3d.position.copy(posVec);
    }

    getGridCenter() {
        return this.hostObj3d.position;
    }

    activateWalkGrid(actor, tileRange, onActiveCB) {

        this.call.setActor(actor)
        this.setGridCenter(actor.getSpatialPosition())


        if (this.isActive) {
            this.deactivateWalkGrid();
        } else {
            this.gridTileSelector.setPos(this.getGridCenter());
            this.gridTileSelector.activateGridTileSelector()
        }

            if (this.dataId !== "grid_walk_world") {
                console.log("Update Walk Grid config")
                this.configData.parseConfig("grid_walk_world", this.call.configUpdate)
                this.dataId = "grid_walk_world";
            }

            this.isActive = true;
        //    actor.getSpatialPosition(this.dynamicGrid.gridCenterPos);
            this.dynamicGrid.activateDynamicGrid(this.config['grid'], tileRange, onActiveCB)
            GameAPI.registerGameUpdateCallback(this.call.updateWalkGrid);
        //    actor.setSpatialPosition(this.dynamicGrid.gridCenterPos);

    }

    cancelActivePath() {
        this.dynamicPath.tilePath.cutTilePath();
    }

    getTileAtPosition(posVec) {
        let gridTiles = this.dynamicGrid.dynamicGridTiles
        return ScenarioUtils.getTileForPosition(gridTiles, posVec)
    }

    getTileByScreenPosition(posVec) {
        let gridTiles = this.dynamicGrid.dynamicGridTiles
        return ScenarioUtils.getTileForScreenPosition(gridTiles, posVec)
    }

    clearGridTilePath() {
        this.dynamicPath.clearPathVisuals();
        this.dynamicWalker.call.clearDynamicPath()
        this.dynamicPath.tilePath.clearTilePath()
    }

    buildGridPath(to, from) {
        this.setGridCenter(this.call.getActor().getSpatialPosition())
        this.lastCenterX = -1;
        this.call.updateWalkGrid();
        this.dynamicWalker.call.clearDynamicPath()
        let gridTiles = this.dynamicGrid.dynamicGridTiles
        let fromTile = ScenarioUtils.getTileForPosition(gridTiles, from)
        let toTile = ScenarioUtils.getTileForPosition(gridTiles, to)

            fromTile.getTileExtents(ThreeAPI.tempVec3, ThreeAPI.tempVec3b)
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:ThreeAPI.tempVec3, max:ThreeAPI.tempVec3b, color:'YELLOW'})
            toTile.getTileExtents(ThreeAPI.tempVec3, ThreeAPI.tempVec3b)
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:ThreeAPI.tempVec3, max:ThreeAPI.tempVec3b, color:'YELLOW'})
            this.dynamicPath.selectTilesBeneathPath(fromTile, toTile, gridTiles);

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
            onCompletedCB();
            this.clearGridTilePath()
            this.deactivateWalkGrid();
        }

    }

    getActiveTilePath() {
        return this.dynamicPath.tilePath;
    }

    walkObj3dAlongPath(obj3d) {
    //    console.log("Walk path", obj3d.position);
        this.setGridHostObj3d(obj3d);
        this.dynamicWalker.call.walkDynamicPath(this.getActiveTilePath(), this)
    }

    setGridHostObj3d = function(obj3d) {
        this.hostObj3d.copy(obj3d);
    }

    setGridMovementActor = function(actor) {
        actor.getSpatialPosition(this.moveObj3d.position);
    }

    getGridMovementObj3d = function() {
        this.call.getActor().getSpatialPosition(this.moveObj3d.position)
        return this.moveObj3d;
    }


    updateWalkGrid() {
        let origin = this.getGridCenter(); // ThreeAPI.getCameraCursor().getPos();
        let offset = 0.5 //this.config['grid']['tile_spacing'] * 0.5
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
        if (this.gridTileSelector) {
            this.gridTileSelector.deactivateGridTileSelector()
        }

        let activePath = this.getActiveTilePath();

        while (activePath.pathCompetedCallbacks.length) {
        //    console.log("pathCompetedCallbacks", activePath.pathCompetedCallbacks.length)
            activePath.pathCompetedCallbacks.pop()(this.moveObj3d)
        }
        while (activePath.pathingUpdateCallbacks.length) {
        //    console.log("pathingUpdateCallbacks", activePath.pathingUpdateCallbacks.length)
            activePath.pathingUpdateCallbacks.pop()
        }

        this.dynamicGrid.deactivateDynamicGrid();

        GameAPI.unregisterGameUpdateCallback(this.call.updateWalkGrid);
        this.isActive = false;
    }


}

export { GameWalkGrid }