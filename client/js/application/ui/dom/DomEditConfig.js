import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {saveEncounterEdits} from "../../utils/ConfigUtils.js";
import {getEditIndex} from "../../../../../Server/game/utils/EditorFunctions.js";


class DomEditConfig {
    constructor() {

        let statusMap = null
        let rootElem = null;
        let htmlElem;
        let applyContainerDiv = null;
        let selectList = null;
        let addButtonDiv = null;
        let selectionId = "";

        let elementDivs = [];

        function applyAdd() {
            statusMap.activateSelection(selectionId);
        }

        function listifyConfig(cfg) {
            let list = [];
            for (let key in cfg) {
                list.push(key)
            }
            return list;
        }

        let htmlReady = function(htmlEl) {
            htmlElem = htmlEl;
            statusMap = htmlElem.statusMap;
            rootElem = htmlEl.call.getRootElement();
            selectList = htmlElem.call.getChildElement('select_list');
            applyContainerDiv = htmlElem.call.getChildElement('apply_container');
            htmlElem.call.populateSelectList('select_list', listifyConfig(statusMap.config));
       //     addButtonDiv = htmlElem.call.getChildElement('add_button');
       //     DomUtils.addClickFunction(addButtonDiv, applyAdd)
            ThreeAPI.registerPrerenderCallback(update);
            applySelection(selectionId)
        }.bind(this);


        function addValueElement(type, value, entry) {


            let label = value;
            let valueType = typeof(value);
            if (Array.isArray(value)) {
                valueType = 'array';
            }

            if (valueType === 'array') {
                label = entry+' [] <p>VIEW</p>'
            } else if (valueType === 'object') {
                label = entry+' {} <p>VIEW</p>'
            } else {
                label = entry+': <p>'+value+'</p>';
            }

            let div = DomUtils.createDivElement(applyContainerDiv, valueType+"_"+entry, label, "config_inspect")
            elementDivs.push(div);
        }

        function addValues(key, type, value) {
            if (type === 'array') {
                for (let i = 0; i < value.length; i++) {
                    addValueElement(type, value[i], i)
                }
            } else if (type === 'object') {
                for (let key in value) {
                    addValueElement(type, value[key], key)
                }
            } else {
                addValueElement(type, value, 0)
            }
        }

        let applySelection = function(id) {
            selectionId = id;

            while (elementDivs.length) {
                DomUtils.removeDivElement(elementDivs.pop())
            }

            let element = statusMap.config[id];
            let type = typeof (element)


            if (type === 'string') {

            } else if (type === 'number') {

            } else if (type === 'bool') {

            } else if (type === 'object') {
                if (Array.isArray(element)) {
                    type = 'array'
                } else {
                    type = 'object'
                }
            }
            addValues(id, type, element);
            if (id === "") {
                applyContainerDiv.style.display = "none"
            } else {
                applyContainerDiv.style.display = ""
            }
        //    statusMap.selectionUpdate(selectionId);
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
            close:close,
        }
    }

    initEditTool(closeCb, statusMap) {
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_config', closeCb, statusMap, 'edit_frame edit_config', this.call.htmlReady);
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

export { DomEditConfig }