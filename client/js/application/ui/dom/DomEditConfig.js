import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {getReversedConfigs, mappedConfigKey, saveConfigEdits, saveEncounterEdits} from "../../utils/ConfigUtils.js";
import {getEditIndex} from "../../../../../Server/game/utils/EditorFunctions.js";

let reverseMap = null;

class DomEditConfig {
    constructor() {

        if (reverseMap === null) {
            reverseMap = getReversedConfigs();
        }

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

        function applyEdit() {
            console.log("Apply Edit", statusMap);
            statusMap.parent.id = saveConfigEdits(statusMap.root, statusMap.folder, statusMap.id, statusMap.config)
        }

        function closeEditValues() {
            if (editValues !== null) {
                editValues.closeEditTool()
                poolReturn(editValues)
                editValues = null;
            }
        }

        function keyElemPressed(key) {
            console.log("keyElemPressed", key, statusMap.config);
            let data = statusMap.config[key];
            closeEditValues()

            let map = {
                applyEdit:applyEdit,
                map:mappedConfigKey(key),
                key:key,
                data:data,
                depth:1,
                parent:statusMap.config
            }
            editValues = poolFetch('DomEditValues');
            editValues.initEditTool(closeEditValues, map)
        }

        function addKeyElement(key , type, value ) {
            let html = "<h2>"+key+"</h2>" + "<p>"+value+"</p>";
            let map = mappedConfigKey(value);
            if (map !== null) {

                if (map.length === 1) {
                    html += "<h4>"+map[0].source+"</h4><h3>"+map[0].root+" "+map[0].folder+"</h3>";
                    console.log("configKey has entry ", map, html)
                } else {
                    console.log("configKey has multiple entries ", map)
                    html += "<h3>| #LOC: "+map.length+" |</h3>";
                }


            }

            function onClick() {
                keyElemPressed(key)
            }

            let div = DomUtils.createDivElement(applyContainerDiv, key, html, "config_inspect type_"+type)
            DomUtils.addClickFunction(div, onClick)
            elementDivs.push(div);
        }

        let expandConfig = function(config) {
            while (elementDivs.length) {
                DomUtils.removeDivElement(elementDivs.pop())
            }

            for (let key in config) {
                let value = config[key];
                let type = typeof (config[key])

                if (type === 'string') {
                } else if (type === 'number') {
                } else if (type === 'bool') {
                } else if (type === 'object') {
                    if (Array.isArray(config[key])) {
                        type = 'array'
                        value = "[]"
                    } else {
                        type = 'object'
                        value = "{}"
                    }
                }
                addKeyElement(key, type, value);
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
        this.htmlElement.initHtmlElement('edit_config', null, statusMap, 'edit_frame edit_config', this.call.htmlReady);
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