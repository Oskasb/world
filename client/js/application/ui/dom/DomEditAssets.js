import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";

let selectedTool = "MODELS";
let activeTools = []

function operateTool(tool, closeCB) {

    while (activeTools.length) {
        let editTool = activeTools.pop();
        console.log("Close Tool ", editTool, activeTools);
        editTool.closeEditTool();
        poolReturn(editTool);
    }

    let activateTool;

    if (tool === "ACTOR") {
        activateTool = poolFetch('DomEditActor');
    }

    if (tool === "ENVIRNMNT") {
        activateTool = poolFetch('DomEnvEdit');
        activateTool.setStatusMap(ThreeAPI.getEnvironment().getStatusMap())
    }

    if (tool === "TERRAIN") {
        activateTool = poolFetch('DomEditTerrain');
    }

    if (tool === "LOCATION") {
        activateTool = poolFetch('DomEditLocation');
    }

    if (tool === "ENCOUNTER") {
        activateTool = poolFetch('DomEditEncounter');
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