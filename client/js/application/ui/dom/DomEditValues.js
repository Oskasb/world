import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {saveEncounterEdits} from "../../utils/ConfigUtils.js";
import {getEditIndex} from "../../../../../Server/game/utils/EditorFunctions.js";


class DomEditValues {
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
            statusMap.applyEdit(statusMap.key);
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
            let dataKey = statusMap.key;
            rootElem = htmlEl.call.getRootElement();
            selectList = htmlElem.call.getChildElement('select_list');


            applyContainerDiv = htmlElem.call.getChildElement('apply_container');
            htmlElem.call.populateSelectList('select_list', listifyConfig(statusMap.config));
       //     addButtonDiv = htmlElem.call.getChildElement('add_button');
       //     DomUtils.addClickFunction(addButtonDiv, applyAdd)
            ThreeAPI.registerPrerenderCallback(update);
            let type = typeof (statusMap.data);
            htmlElem.call.getChildElement('label').innerHTML = dataKey+" ("+type+")";
            applySelection(dataKey)
        }.bind(this);


        function closeSubValueEdit() {
            if (subValueEdit !== null) {
                if (subValueEdit !== null) {
                    subValueEdit.closeEditTool()
                    poolReturn(subValueEdit)
                    subValueEdit = null;
                }
            }
        }

        let subValueEdit = null;


        function openSubValueEdit(key, data) {
            closeSubValueEdit()

            let map = {
                applyEdit:statusMap.applyEdit,
                key:key,
                data:data,
                parent:statusMap.config
            }
            subValueEdit = poolFetch('DomEditValues');
            subValueEdit.initEditTool(closeSubValueEdit, map)
        }

        function addValueElement(entry, key) {
            let type = getElementTypeKey(entry)
            let label = key;
            let openSubEditor;

            if (type === 'array') {

                let eVal = "| "
                for (let i = 0; i < entry.length; i++) {
                    let subType = getElementTypeKey(entry[i]);
                    if (subType === 'object') {
                        eVal += "{} "
                    } else if (subType === 'array') {
                        eVal += "[] "
                    } else {
                        eVal += subType+" "
                    }
                    eVal += "| ";
                }

                label = '<h2>'+key+'<h2><p>'+eVal+'</p>'
                openSubEditor = true;
            } else if (type === 'object') {
                let eVal = "|"
                for (let key in entry) {
                    let subType = getElementTypeKey(entry[key]);
                    if (subType === 'object') {
                        eVal += "{}"
                    } else if (subType === 'array') {
                        eVal += "[]"
                    } else {
                        eVal += subType
                    }
                    eVal += "|";
                }
                label = '<h2>'+key+'<h2><p>'+eVal+'</p>'
                openSubEditor = true;
            } else {
                label ='<h2>'+type+'<h2><p>'+entry+'</p>';
            }

            let div = DomUtils.createDivElement(applyContainerDiv, type+"_"+entry, label, "config_inspect  type_"+type);

            if (openSubEditor === true) {

                let open = function() {
                    openSubValueEdit(key, entry, entry)
                }

                DomUtils.addClickFunction(div, open)
            }

            elementDivs.push(div);
        }

        function addValues(key, element) {
            let type = getElementTypeKey(element)
            if (type === 'array') {
                for (let i = 0; i < element.length; i++) {
                    addValueElement(element[i], i)
                }
            } else if (type === 'object') {
                for (let key in element) {
                    addValueElement(element[key], key)
                }
            } else {
                addValueElement(element, null)
            }
        }

        function getElementTypeKey(element) {
            if (Array.isArray(element)) {
                return 'array'
            }
            return typeof (element)
        }

        let applySelection = function(id) {

            console.log(id, statusMap)
            while (elementDivs.length) {
                DomUtils.removeDivElement(elementDivs.pop())
            }

            let element = statusMap.data;

            addValues(id, element);
        };

        let update = function() {
            if (subValueEdit !== null) {
                subValueEdit.htmlElement.call.getRootElement().style.left = "440em";
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
        this.htmlElement.initHtmlElement('edit_values', closeCb, statusMap, 'edit_frame edit_values', this.call.htmlReady);
    }

    closeEditTool() {
        this.call.close();
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEditValues }