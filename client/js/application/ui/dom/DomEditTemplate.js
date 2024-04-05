import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {detachConfig, saveConfigEdits, saveEncounterEdits} from "../../utils/ConfigUtils.js";
import {getEditIndex} from "../../../../../Server/game/utils/EditorFunctions.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {ENUMS} from "../../ENUMS.js";
import {WorldModel} from "../../../game/gameworld/WorldModel.js";


let select = []

class DomEditTemplate {
    constructor() {

        let statusMap = null
        let rootElem = null;
        let htmlElem;
        let loadContainerDiv = null;
        let selectList = null;
        let saveButtonDiv = null;
        let saveAsButtonDiv = null;
        let loadButtonDiv = null;

        let selectionId = "";
        let cursorObj3d = new Object3D();

        let createCursor = null
        let configEdit = null;

        let closeCursorCB = function() {

        }

        let closeCursor = function() {
            if (createCursor !== null) {
                createCursor.closeDomEditCursor();
                poolReturn(createCursor);
                createCursor = null;
            }
        }

        function updateSelectList() {
            let loadedTemplates = GameAPI.worldModels.getLoadedTemplates();

            for (let key in loadedTemplates) {
                let map = loadedTemplates[key];
                if (map.root === statusMap.root && map.folder === statusMap.folder) {
                    select.push(map.id);
                }
            }
            htmlElem.call.populateSelectList('select_list', select)
        }

        function applySave() {
          //  statusMap.activateSelection(selectionId);
            saveConfigEdits(statusMap.root, statusMap.folder, statusMap.id, statusMap.config, 'templates/')
            updateSelectList()
        }

        function applySaveAs() {
            //  statusMap.activateSelection(selectionId);
        }

        function applyLoad() {
            statusMap.parent.call.applyLoadedConfig(loadConfig, statusMap.id, true);
        }


        function onCursorUpdate(obj3d) {

        }

        function onCursorClick(val) {

        }

        function closeConfigEdit() {
            if (configEdit !== null) {
                poolReturn(configEdit);
                configEdit.closeEditTool();
                configEdit = null;
            }
        }

        let loadConfig = null;

        function selectionUpdate(selectionId) {
            if (selectionId !== "") {
                let loadedTemplates = GameAPI.worldModels.getLoadedTemplates();
                let map = loadedTemplates[selectionId];
                loadConfig = detachConfig(map.config);
                loadConfig.edit_id = "";
                loadConfig.pos = statusMap.config.pos;
                loadConfig.rot = statusMap.config.rot;

            } else {
                loadConfig = null;
            }
        }

        let htmlReady = function(htmlEl) {
            htmlElem = htmlEl;
            MATH.emptyArray(select);
            select.push("");
            statusMap = htmlElem.statusMap;
            updateSelectList()

            rootElem = htmlEl.call.getRootElement();

            for (let key in statusMap) {
                let elem = htmlElem.call.getChildElement(key);
                if (elem) {
                    elem.innerHTML = statusMap[key];
                }
            }

            selectList = htmlElem.call.getChildElement('select_list');



            saveButtonDiv = htmlElem.call.getChildElement('save_button');
            saveAsButtonDiv = htmlElem.call.getChildElement('saveas_button');
            loadButtonDiv = htmlElem.call.getChildElement("load_button");

            DomUtils.addClickFunction(saveButtonDiv, applySave)
            DomUtils.addClickFunction(saveAsButtonDiv, applySaveAs)
            DomUtils.addClickFunction(loadButtonDiv, applyLoad)

            loadContainerDiv = htmlElem.call.getChildElement('load_container');

            ThreeAPI.registerPrerenderCallback(update);
            applySelection(selectionId)
        }.bind(this);


        let applySelection = function(id) {
            selectionId = id;
            if (id === "") {
                loadContainerDiv.style.display = "none"
            } else {
                loadContainerDiv.style.display = ""
            }
            selectionUpdate(selectionId);
        };

        let update = function() {
            cursorObj3d.position.copy(ThreeAPI.getCameraCursor().getLookAroundPoint());
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
        this.htmlElement.initHtmlElement('edit_template', closeCb, statusMap, 'edit_frame edit_template', readyCb);
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

export { DomEditTemplate }