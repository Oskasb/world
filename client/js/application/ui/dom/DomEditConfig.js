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
       //     htmlElem.call.populateSelectList('select_list', listifyConfig(statusMap.config));
       //     addButtonDiv = htmlElem.call.getChildElement('add_button');
       //     DomUtils.addClickFunction(addButtonDiv, applyAdd)
            ThreeAPI.registerPrerenderCallback(update);
            expandConfig(statusMap.config)
        }.bind(this);

        let editValues = null;

        function applyEdit(edit) {
            console.log("Apply Edit", edit);
        }

        function closeEditValues() {
            if (editValues !== null) {
                editValues.closeEditTool()
                poolReturn(editValues)
                editValues = null;
            }
        }

        function keyElemPressed(e) {
            console.log("keyElemPressed", e.target.id);
            let data = statusMap.config[e.target.id];
            closeEditValues()

            let map = {
                applyEdit:applyEdit,
                data:data,
                parent:statusMap.config
            }
            editValues = poolFetch('DomEditValues');
            editValues.initEditTool(closeEditValues, map)
        }

        function addKeyElement(value , type ) {

            let label = value;
            let valueType = typeof(value);
            if (Array.isArray(value)) {
                valueType = 'array';
            }

            if (valueType === 'array') {
                label = '[] <p>VIEW</p>'
            } else if (valueType === 'object') {
                label = '{} <p>VIEW</p>'
            } else {
                label ='<p>'+value+'</p>';
            }

            let div = DomUtils.createDivElement(applyContainerDiv, value, label, "config_inspect")
            DomUtils.addClickFunction(div, keyElemPressed)
            elementDivs.push(div);
        }

        let expandConfig = function(config) {
            while (elementDivs.length) {
                DomUtils.removeDivElement(elementDivs.pop())
            }

            for (let key in config) {
                let type = typeof (config[key])

                if (type === 'string') {
                } else if (type === 'number') {
                } else if (type === 'bool') {
                } else if (type === 'object') {
                    if (Array.isArray(config[key])) {
                        type = 'array'
                    } else {
                        type = 'object'
                    }
                }
                addKeyElement(key, type);
            }
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