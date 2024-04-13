import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {ConfigData} from "../../utils/ConfigData.js";
import {detachConfig} from "../../utils/ConfigUtils.js";

let selectedTool = "";
let activeTools = []


function listifyConfig(cfg) {
    let list = [""];
    for (let key in cfg) {
        list.push(key)
    }
    return list;
}


function selectionUpdate(s) {
    console.log("Select Asset ", s)
}

function loadTemplate(t) {
    console.log("Load Asset Template", t)
}

function activateSelection(selectionId) {
    console.log("Activate Asset Selection", selectionId)
}

function operateTool(tool, closeCB) {

    while (activeTools.length) {
        let editTool = activeTools.pop();
        console.log("Close Tool ", editTool, activeTools);
        editTool.closeEditTool();
        poolReturn(editTool);
    }

    let activateTool;

    if (tool === "ACTOR") {

        // let actorConfigs = new ConfigData("GAME", "ACTORS").parseConfigData()[actorId].data;

        let actorConfig = new ConfigData("GAME", "ACTORS").parseConfigData();

        let addToolStatusMap = {
            selectList: listifyConfig(actorConfig)
        }

        addToolStatusMap.parent = {};

        addToolStatusMap.root = "game";
        addToolStatusMap.folder = "actors";
        addToolStatusMap.config = actorConfig;

        addToolStatusMap.selectionUpdate = selectionUpdate;
        addToolStatusMap.loadTemplate = loadTemplate;
        addToolStatusMap.activateSelection = activateSelection;

        activateTool = poolFetch('DomEditAdd');
        activateTool.call.setStatusMap(addToolStatusMap);
    //    activateTool = poolFetch('DomEditActor');
    }

    if (tool === "ASSET_") {
        activateTool = poolFetch('DomEditTerrain');
    }

    if (tool === "GEOMETRY_") {
        activateTool = poolFetch('DomEditLocation');
    }

    function toolReady(etool) {
        console.log("Tool Ready", tool, etool)
        activeTools.push(etool)
    }

    if (activateTool) {
        activateTool.initEditTool(closeCB, toolReady);
    }

}

let toolsList = [
    "",
    "ACTOR",
    "ASSET",
    "GEOMETRY"
]

class DomEditAssets {
    constructor() {
        this.statusMap = {
            tool:selectedTool
        };

        let statusMap = this.statusMap;
        let toolSelectDiv = null;

        function toolClosedCB() {
        //    toolSelectDiv.value = "MODELS";
        }

        let applyTool = function() {
            operateTool(statusMap.tool, toolClosedCB);
        }

        let htmlReady = function(htmlElem) {

            toolSelectDiv = htmlElem.call.getChildElement('tool');
            htmlElem.call.populateSelectList('tool', toolsList)
            ThreeAPI.registerPrerenderCallback(update);
            selectedTool = "";
        }

        let update = function() {
            if (toolSelectDiv.value !== selectedTool) {
                statusMap.tool = toolSelectDiv.value
                selectedTool = statusMap.tool;
                applyTool()
            }
        }

        let close = function() {
            ThreeAPI.unregisterPrerenderCallback(this.call.update);
            this.htmlElement.closeHtmlElement();
            poolReturn(this.htmlElement);
            this.htmlElement = null;
        }.bind(this);

        this.call = {
            htmlReady:htmlReady,
            update:update,
            close:close
        }

    }

    initDomEditAssets() {
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_assets', this.call.close, this.statusMap, 'edit_frame edit_assets', this.call.htmlReady);
    }


}

export { DomEditAssets }