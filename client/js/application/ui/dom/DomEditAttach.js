import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {saveEncounterEdits} from "../../utils/ConfigUtils.js";
import {getEditIndex} from "../../../../../Server/game/utils/EditorFunctions.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {ENUMS} from "../../ENUMS.js";
import {WorldModel} from "../../../game/gameworld/WorldModel.js";
import {ConfigData} from "../../utils/ConfigData.js";

let assetConfigs = null;
let assets = [];
class DomEditAttach {
    constructor() {

        if (assetConfigs === null) {
            let onConfig = function(configs) {
                console.log(configs)
                for (let key in configs) {
                    let id = configs[key].id
                    if (assets.indexOf(id) === -1) {
                        assets.push(id)
                    } else {
                        console.log("entry already added, not right", id);
                    }
                }
            }
            new ConfigData("ASSETS","MODELS",  false, false, false, onConfig)
        }


        let statusMap = null
        let rootElem = null;
        let htmlElem;
        let applyContainerDiv = null;
        let selectList = null;
        let addButtonDiv = null;
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

        function applyAdd() {
          //  statusMap.activateSelection(selectionId);
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

        function attachFunction(selectionId, cursorObj3d, createCallback) {

        }

        function selectionUpdate(selectionId) {

            closeCursor()

            if (selectionId === "") {

            } else {
                function createCallback(config) {
                    closeConfigEdit()
                    configEdit = poolFetch('DomEditConfig');
                    let map = {
                        id:selectionId,
                        root:statusMap.root,
                        folder:statusMap.folder,
                        parent:statusMap.parent,
                        config:config
                    }
                    configEdit.initEditTool(closeConfigEdit, map);
                }

                createCursor = poolFetch('DomEditCursor')
                attachFunction(selectionId, cursorObj3d, createCallback);
                createCursor.initDomEditCursor(closeCursorCB, cursorObj3d, onCursorUpdate, onCursorClick)
            }


        }

        let htmlReady = function(htmlEl) {
            htmlElem = htmlEl;
            statusMap = htmlElem.statusMap;
            rootElem = htmlEl.call.getRootElement();

            selectList = htmlElem.call.getChildElement('select_list');
            applyContainerDiv = htmlElem.call.getChildElement('apply_container');
            htmlElem.call.populateSelectList('select_list', assets)
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

    initEditTool(closeCb, statusMap) {
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_attach', closeCb, statusMap, 'edit_frame edit_attach', this.call.htmlReady);
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

export { DomEditAttach }