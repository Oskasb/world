import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {ConfigData} from "../../utils/ConfigData.js";

let tempVec = new Vector3();
let frustumFactor = 0.828;

let configData;
let spawns = []

let onConfig = function(configs) {
    console.log(configs)
    for (let i = 0; i < configs.length; i++) {
        let gridId = configs[i].id;
        if (spawns.indexOf(gridId) === -1) {
            spawns.push(gridId);
        }
    }
}

setTimeout(function() {
    configData = new ConfigData("SPAWN", "SPAWN_PATTERNS",  false, false, false, onConfig)
}, 2000)



class DomEditSpawns {
    constructor() {

        this.targetObj3d = new Object3D();
        this.updateObj3d = new Object3D();

        this.encounter = null;

        this.statusMap = {

        };

        let statusMap = this.statusMap;
        let rootElem = null;
        let htmlElem;

        let config = null;
        let activeEncounterGrid = null;
        let selectSpawnPattern = null;
        let selectActivePattern = null;

        let operateButtonDiv = null;
        function operateSelection() {
            console.log("operateSelection")
        }

        function gridLoaded(encGrid) {
            activeEncounterGrid = encGrid;
            ThreeAPI.registerPrerenderCallback(update);
        }
        let htmlReady = function(htmlEl) {
               console.log(configData)
            htmlElem = htmlEl;
            rootElem = htmlEl.call.getRootElement();
            selectSpawnPattern = htmlElem.call.getChildElement('spawns');
            selectActivePattern = htmlElem.call.getChildElement('active_spawns');
            htmlElem.call.populateSelectList('spawns', spawns)
            operateButtonDiv = htmlElem.call.getChildElement('operate_button');
            DomUtils.addClickFunction(operateButtonDiv, operateSelection)
            console.log("Edit encounter spawns", this.encounter);

            let json = JSON.stringify(this.encounter.config);
            config = JSON.parse(json);
            this.encounter.config = config;
            let loadGrid = poolFetch('EncounterGrid');
            loadGrid.initEncounterGrid(config.grid_id, getPos(), gridLoaded)

        }.bind(this);

        let getPos = function() {
            return this.encounter.getPos();
        }.bind(this)

        function closeGrid() {
            lastCursorTile = null;
            if (activeEncounterGrid !== null) {
                activeEncounterGrid.removeEncounterGrid();
                poolReturn(activeEncounterGrid);
                activeEncounterGrid = null;
            }
        }

        let lastCursorTile = null;

        let update = function() {

                if (activeEncounterGrid !== null) {
                    let cursorTile = activeEncounterGrid.getTileAtPosition(ThreeAPI.getCameraCursor().getPos());
                    if (lastCursorTile !== null) {
                        if (lastCursorTile.visualTile) {
                            lastCursorTile.clearPathIndication()
                        }
                    }
                        if (cursorTile.visualTile) {
                            cursorTile.indicatePath()
                        }
                        lastCursorTile = cursorTile;

                }

        }.bind(this);

        let close = function() {
            closeGrid()
        }

        this.call = {
            htmlReady:htmlReady,
            update:update,
            close:close
        }

    }

    setWorldEncounter(encounter) {
        this.encounter = encounter;
    }



    initEditTool(closeCb) {
        GameAPI.worldModels.deactivateEncounters();
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_spawns', closeCb, this.statusMap, 'edit_frame edit_spawns', this.call.htmlReady);
    }

    closeEditTool() {
        GameAPI.worldModels.activateEncounters();
        this.encounter = null;
        this.call.close();
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEditSpawns }