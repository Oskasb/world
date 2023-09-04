import {ConfigData} from "../../application/utils/ConfigData.js";
import { Vector3 } from "../../../libs/three/math/Vector3.js";
import { Object3D } from "../../../libs/three/core/Object3D.js";

class GameWalkGrid {
    constructor() {
        this.isActive = false;
        this.gridTiles = [];

        this.dataId = null;

        this.instances = [];
        this.configData = new ConfigData("GRID", "WALK_GRID",  'walk_grid_data', 'data_key', 'config')

        this.config = null;

        this.cursorTileCenter = new Vector3()

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

    activateWalkGrid = function(event) {

        if (this.isActive) {
            this.deactivateWalkGrid();
        } else {
            console.log("Activate Walk Grid:", event)
            if (this.dataId !== event['data_id']) {
                this.configData.parseConfig(event['data_id'], this.call.configUpdate)
                this.dataId = event['data_id'];
            }
            this.isActive = true;
            GameAPI.registerGameUpdateCallback(this.call.updateWalkGrid);
        }

    }




    updateWalkGrid = function() {
        let cursorPos = ThreeAPI.getCameraCursor().getPos();
        let offset = 0.5 // this.config['tile_spacing'] * 0.5
        this.cursorTileCenter.set(Math.floor(cursorPos.x + offset), 0, Math.floor(cursorPos.z + offset) )
        this.cursorTileCenter.y = ThreeAPI.terrainAt(this.cursorTileCenter);
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:this.cursorTileCenter, color:'WHITE', size:this.config['tile_size']});


    }

    deactivateWalkGrid() {
        console.log("Deactivate Walk Grid:", this)
        GameAPI.unregisterGameUpdateCallback(this.call.updateWalkGrid);
        this.isActive = false;
    }

}

export {GameWalkGrid}