import {ConfigData} from "../../application/utils/ConfigData.js";
import { DynamicGrid} from "./DynamicGrid.js";

let centerTileIndexX = 0;
let centerTileIndexY = 0;

class GameWalkGrid {
    constructor() {
        this.dynamicGrid = new DynamicGrid();
        this.isActive = false;

        this.dataId = null;

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

            let dispatches = this.config['dispatch']
            if (typeof(dispatches) ===  'object') {
                for (let i = 0; i < dispatches.length; i++) {
                    evt.dispatch(ENUMS.Event[dispatches[i]['event']], dispatches[i]['value'])
                }
            }

            this.dynamicGrid.activateDynamicGrid(this.config['grid'])
            GameAPI.registerGameUpdateCallback(this.call.updateWalkGrid);
        }

    }

    updateWalkGrid = function() {
        let cursorPos = ThreeAPI.getCameraCursor().getPos();
        let offset = this.config['grid']['tile_spacing'] * 0.5
        centerTileIndexX = Math.floor(cursorPos.x + offset)
        centerTileIndexY = Math.floor(cursorPos.z + offset)
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