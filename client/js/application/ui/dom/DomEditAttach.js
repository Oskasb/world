import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {detachConfig, saveEncounterEdits} from "../../utils/ConfigUtils.js";
import {getEditIndex} from "../../../../../Server/game/utils/EditorFunctions.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {ENUMS} from "../../ENUMS.js";
import {WorldModel} from "../../../game/gameworld/WorldModel.js";
import {ConfigData} from "../../utils/ConfigData.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";

let assetConfigs = null;
let assets = [];
let tempVec = new Vector3();

let locationModelConfigTemplate = {
    "asset": "",
    "pos": [0, 0, 0],
    "rot": [0, 0, 0],
    "scale": [0.02, 0.02, 0.02],
    "solidity": 1.0,
    "visibility": 3,
    "boxes": []
}
class DomEditAttach {
    constructor() {

        if (assetConfigs === null) {
            let onConfig = function(configs) {
                console.log(configs)
                for (let key in configs) {
                    let id = configs[key].id
                    if (assets.indexOf(id) === -1) {
                        let cfg = configs[key].config;
                        let matId = cfg.material;
                        if (matId === "mat_instancing_basic") {
                            assets.push(id)
                        }
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

        let attachCursor = null
        let modelCursor = null;
        let configEdit = null;
        let editTarget = null;
        let closeCursorCB = function() {

        }

        let closeCursor = function() {

            if (attachCursor !== null) {
                attachCursor.closeDomEditCursor();
                poolReturn(attachCursor);
                attachCursor = null;
            }
            if (modelCursor !== null) {
                modelCursor.closeDomEditCursor();
                poolReturn(modelCursor);
                modelCursor = null;
            }

        }

        function applyAdd() {
          //  statusMap.activateSelection(selectionId);
        }

        function onCursorUpdate(obj3d) {
            if (attachCursor !== null) {
                if (modelCursor !== null) {
                    if (attachCursor.htmlElement !== null) {
                        attachCursor.closeDomEditCursor();
                        poolReturn(attachCursor);
                        attachCursor = null;
                    }

                }
            }
            if (modelCursor !== null) {
                let origin = statusMap.parent.getPos();
                tempVec.copy(obj3d.position);
                tempVec.sub(origin);
                tempVec.applyQuaternion(statusMap.parent.obj3d.quaternion);
                MATH.vec3ToArray(tempVec, editTarget.config.pos, 100);
                MATH.rotObj3dToArray(obj3d, editTarget.config.rot, 10);
                editTarget.hierarchyUpdated();
            }
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

        function attachFunction(selectionId, callback) {

            let config = detachConfig(locationModelConfigTemplate);
            config.asset = selectionId;
            statusMap.parent.configData.assets.push(config);
            statusMap.parent.call.locationModels(statusMap.parent.configData)
            callback(config);
        }

        function selectionUpdate(selectionId) {

            closeCursor()

            if (selectionId === "") {

            } else {
                function attachCallback(config) {

                    let targetId = config.edit_id;
                    let models =statusMap.parent.locationModels
                    for (let i = 0; i < models.length; i++) {
                        if (models[i].config.edit_id === targetId) {
                            editTarget = models[i];
                        }
                    }

                //    closeCursor()
                    closeConfigEdit()
                    modelCursor = poolFetch('DomEditCursor');
                    modelCursor.initDomEditCursor(closeCursorCB, cursorObj3d, onCursorUpdate, onCursorClick)
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

                attachCursor = poolFetch('DomEditCursor')
                attachFunction(selectionId, attachCallback);
                attachCursor.initDomEditCursor(closeCursorCB, cursorObj3d, onCursorUpdate, onCursorClick)
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

            if (attachCursor !== null) {
                attachCursor.call.setPos(cursorObj3d.position);
                ThreeAPI.getCameraCursor().getLookAroundPoint().add(attachCursor.call.getUpdateObj().position)
            }

            if (modelCursor !== null) {
                modelCursor.call.setPos(cursorObj3d.position);
                ThreeAPI.getCameraCursor().getLookAroundPoint().add(modelCursor.call.getUpdateObj().position)
            }

            if (selectionId !== selectList.value) {
                applySelection(selectList.value);

            }
        };

        let close = function() {
            closeCursor()
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