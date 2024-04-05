import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {saveEncounterEdits} from "../../utils/ConfigUtils.js";
import {getEditIndex} from "../../../../../Server/game/utils/EditorFunctions.js";


class DomEditAdd {
    constructor() {

        let statusMap = null
        let rootElem = null;
        let htmlElem;
        let applyContainerDiv = null;
        let selectList = null;
        let addButtonDiv = null;
        let selectionId = "";

        function applyAdd() {
            statusMap.activateSelection(selectionId);
        }

        let htmlReady = function(htmlEl) {
            htmlElem = htmlEl;
            statusMap = htmlElem.statusMap;
            rootElem = htmlEl.call.getRootElement();

            selectList = htmlElem.call.getChildElement('select_list');
            applyContainerDiv = htmlElem.call.getChildElement('apply_container');
            htmlElem.call.populateSelectList('select_list', statusMap.selectList)
            addButtonDiv = htmlElem.call.getChildElement('add_button');
            DomUtils.addClickFunction(addButtonDiv, applyAdd)
            ThreeAPI.registerPrerenderCallback(update);
            applySelection(selectionId)
        }.bind(this);

        let applySelection = function(id) {
            selectionId = id;
            if (id === "") {
                applyContainerDiv.style.display = "none"
            } else {
                applyContainerDiv.style.display = ""
            }
            statusMap.selectionUpdate(selectionId);
        };

        let update = function() {
            if (selectionId !== selectList.value) {
                applySelection(selectList.value);
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

    initEditTool(closeCb, statusMap, onReady) {

        let readyCb = function() {
            this.call.htmlReady(this.htmlElement)
            if (typeof (onReady) === 'function') {
                onReady(this);
            }
        }.bind(this)
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_add', closeCb, statusMap, 'edit_frame edit_add', readyCb);
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