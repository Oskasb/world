import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {detachConfig, saveEncounterEdits, saveWorldModelEdits} from "../../utils/ConfigUtils.js";
import {getEditIndex} from "../../../../../Server/game/utils/EditorFunctions.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {ENUMS} from "../../ENUMS.js";
import {WorldModel} from "../../../game/gameworld/WorldModel.js";
import {ConfigData} from "../../utils/ConfigData.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Quaternion} from "../../../../libs/three/math/Quaternion.js";

let assetConfigs = null;
let assets = [];
let tempVec = new Vector3();
let tempObj = new Object3D();
let tempQuat = new Quaternion();
let axisRot = ['X', 'Y', 'Z']

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

        let initScaleVec3 = new Vector3();
        let targetScaleVec3 = new Vector3()
        let lastScaleVec3 = new Vector3();
        let statusMap = null
        let rootElem = null;
        let htmlElem;
        let applyContainerDiv = null;
        let selectList = null;
        let addButtonDiv = null;
        let selectionId = "";
        let cursorObj3d = new Object3D();
        let lastSave = "";
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
                tempObj.position.copy(origin);
                tempObj.lookAt(obj3d.position);
                let distance = MATH.distanceBetween(origin, obj3d.position);
                tempVec.set(0, 0, distance);
                tempQuat.copy(statusMap.parent.obj3d.quaternion);
                tempQuat.normalize()
                tempQuat.invert();
                tempObj.quaternion.premultiply(tempQuat);
                tempVec.applyQuaternion(tempObj.quaternion)
                MATH.vec3ToArray(tempVec, editTarget.config.pos, 100);
                let inputRot = obj3d.rotation.y;
                let axis = statusMap.axis;
                editTarget.config.rot[axisRot.indexOf(axis)] = MATH.decimalify(inputRot, 100);
            //    MATH.rotObj3dToArray(obj3d, editTarget.config.rot, 100);

                if (MATH.distanceBetween(lastScaleVec3, obj3d.scale) !== 0) {
                    tempVec.copy(obj3d.scale);
                    tempVec.multiply(initScaleVec3);
                    if (MATH.distanceBetween(targetScaleVec3, tempVec) < 0.001) {
                        initScaleVec3.copy(tempVec);
                    } else {
                        if (tempVec.length() > 0.001) {
                            MATH.vec3ToArray(tempVec, editTarget.config.scale, 1000)
                            targetScaleVec3.copy(tempVec);
                        }
                    }
                    lastScaleVec3.copy(obj3d.scale);
                }

                editTarget.hierarchyUpdated();
            //    statusMap.parent.config.attachments[editTarget.config.edit_id] = editTarget.config;
             //   let save = JSON.stringify(editTarget.config);
            //   if (lastSave !== save) {
             //       lastSave = save;
            //        saveWorldModelEdits(statusMap.parent);
           //     }

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
                    MATH.vec3FromArray(initScaleVec3, config.scale);
                    let models =statusMap.parent.locationModels

                    for (let i = 0; i < models.length; i++) {
                        if (models[i].config.edit_id === targetId) {
                            editTarget = models[i];
                        }
                    }

                //    closeCursor()
                    closeConfigEdit()
                    modelCursor = poolFetch('DomEditCursor');

                    function closeModelCursor() {
                        if (modelCursor !== null) {
                            modelCursor.closeDomEditCursor();
                            poolReturn(modelCursor);
                            modelCursor = null;
                        }
                        closeConfigEdit();
                    }

                    modelCursor.initDomEditCursor(closeModelCursor, cursorObj3d, onCursorUpdate, onCursorClick)
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

                function closeAttachCursor() {
                    if (attachCursor !== null) {
                        attachCursor.closeDomEditCursor();
                        poolReturn(attachCursor);
                        attachCursor = null;
                    }
                }

                attachCursor.initDomEditCursor(closeAttachCursor, cursorObj3d, onCursorUpdate, onCursorClick)
            }


        }

        let htmlReady = function(htmlEl) {
            htmlElem = htmlEl;
            statusMap = htmlElem.statusMap;
            rootElem = htmlEl.call.getRootElement();

            let parentConfig = statusMap.parent.config;
            if (typeof (parentConfig.attachments !== 'object')) {
                parentConfig.attachments = {};
            }

            statusMap.axis = "Y";
            let axisSelect = htmlElem.call.getChildElement('axis');
            htmlElem.call.populateSelectList('axis', axisRot)
            axisSelect.value = statusMap.axis;
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
            closeCursor();
            closeConfigEdit();
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
        this.call.close();
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEditAttach }