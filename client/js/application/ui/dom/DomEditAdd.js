import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {saveEncounterEdits} from "../../utils/ConfigUtils.js";


class DomEditAdd {
    constructor() {

        let statusMap = null
        let rootElem = null;
        let htmlElem;

        let rayTestDiv = null;

        let activeEncounterGrid = null;
        let selectGrid = null;
        let addButtonDiv = null;
        let rayTestOn = false;
        function rayTest() {
            rayTestOn =! rayTestOn;
        }

        let htmlReady = function(htmlEl) {
        //    console.log(configData)
            htmlElem = htmlEl;
            statusMap = htmlElem.statusMap;
            rootElem = htmlEl.call.getRootElement();
            addButtonDiv = htmlElem.call.getChildElement('add_button');
            selectGrid = htmlElem.call.getChildElement('select_list');
            htmlElem.call.populateSelectList('select_list', statusMap.selectList)
            ThreeAPI.registerPrerenderCallback(update);
        }.bind(this);

        let selectionId = "";

        let applySelection = function(id) {
            selectionId = id
        };

        let update = function() {
            if (selectionId !== selectGrid.value) {
                applySelection(selectGrid.value);
            }
        };

        let close = function() {

        }

        this.call = {
            htmlReady:htmlReady,
            update:update,
            close:close
        }
    }

    initEditTool(closeCb, statusMap) {
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_add', closeCb, statusMap, 'edit_frame edit_add', this.call.htmlReady);
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

export { DomEditAdd }