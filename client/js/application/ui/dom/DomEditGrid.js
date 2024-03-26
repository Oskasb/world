import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {paletteKeys} from "../../../game/visuals/Colors.js";
import {ConfigData} from "../../utils/ConfigData.js";

let tempVec = new Vector3();
let frustumFactor = 0.828;

let configData;
let grids = []

let onConfig = function(configs) {
    console.log(configs)
    for (let i = 0; i < configs.length; i++) {
        let gridId = configs[i].id;
        if (grids.indexOf(gridId) === -1) {
            grids.push(gridId);
        }
    }
}

setTimeout(function() {
    configData = new ConfigData("GRID", "ENCOUNTER_GRIDS",  false, false, false, onConfig)
}, 2000)


function worldModelOperation(wModel, operation) {

    if (operation === "ELEVATE") {
        wModel.obj3d.position.y += 1;
        wModel.applyObj3dUpdate()
    }

    if (operation === "HIDE") {
        if (wModel.hidden !== true) {
            wModel.setHidden(true);
        } else {
            wModel.setHidden(false);
        }
    }

    if (operation === "FLATTEN") {
        wModel.applyObj3dUpdate();
        let box = wModel.box;
        ThreeAPI.alignGroundToAABB(box);
    }
}


class DomEditGrid {
    constructor() {

        this.targetObj3d = new Object3D();
        this.updateObj3d = new Object3D();

        this.encounter = null;

        this.statusMap = {

        };

        let statusMap = this.statusMap;
        let rootElem = null;
        let htmlElem;

        let activeEncounterGrid = null;
        let selectGrid = null;

        let htmlReady = function(htmlEl) {
               console.log(configData)
            htmlElem = htmlEl;
            rootElem = htmlEl.call.getRootElement();
            selectGrid = htmlElem.call.getChildElement('grid');
            htmlElem.call.populateSelectList('grid', grids)
            console.log("Edit encounter grid", this.encounter);
            let config = this.encounter.config;
            selectGrid.value = config.grid_id;
            ThreeAPI.registerPrerenderCallback(update);
        }.bind(this);

        let viewGridId = "";

        let getPos = function() {
            return this.encounter.getPos();
        }.bind(this)

        function gridLoaded(encGrid) {
            activeEncounterGrid = encGrid;
        }

        function closeGrid() {
            if (activeEncounterGrid !== null) {
                activeEncounterGrid.removeEncounterGrid();
                poolReturn(activeEncounterGrid);
                activeEncounterGrid = null;
            }
        }

        function applyGridId(gId) {
            viewGridId = gId;
            closeGrid()
            let loadGrid = poolFetch('EncounterGrid');
            loadGrid.initEncounterGrid(viewGridId, getPos(), gridLoaded)
        }

        let update = function() {
            if (viewGridId !== selectGrid.value) {
                applyGridId(selectGrid.value);
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
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_grid', closeCb, this.statusMap, 'edit_frame edit_grid', this.call.htmlReady);
    }

    closeEditTool() {
        this.encounter = null;
        this.call.close();
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEditGrid }