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

let edits = ["NEW", "MODIFY"]
let editList = [""];


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
        let changeModelContainer = null;
        let changeModelSelection = null;
        let selectList = null;
        let editSelect = null;
        let addButtonDiv = null;
        let selectionId = "";
        let cursorObj3d = new Object3D();
        let lastSave = "";
        let modelCursor = null;
        let configEdit = null;
        let editTarget = null;
        let activeEdit = null;
        let changeToModel = null;
        let closeCursorCB = function() {

        }

        let closeCursor = function() {

            if (modelCursor !== null) {
                modelCursor.closeDomEditCursor();
                poolReturn(modelCursor);
                modelCursor = null;
            }

        }


        function applyOperateButton(x) {
            console.log("Apply applyOperateButton: ", x);
            //  statusMap.activateSelection(selectionId);
            if (activeEdit === 'NEW') {
                editTarget.call.setPaletteKey('DEFAULT');
                editTarget.config.paletteKey = 'DEFAULT';

                if (!statusMap.parent.config.assets) {
                    statusMap.parent.config.assets = [];
                }

                let cAssets = statusMap.parent.config.assets;
                let add = true;
                for (let i = 0; i < cAssets.length; i++ ) {
                    if (cAssets[i].edit_id === editTarget.config.edit_id) {
                        add = false;
                    }
                }
                if (add === true) {
                    cAssets.push(editTarget.config)
                }

                saveWorldModelEdits(statusMap.parent);
            }
            if (activeEdit === 'MODIFY') {
                editTarget.call.setPaletteKey('DEFAULT');
                editTarget.config.paletteKey = 'DEFAULT';
                //    statusMap.parent.config.attachments[editTarget.config.edit_id] = editTarget.config;
                //   let save = JSON.stringify(editTarget.config);
                //   if (lastSave !== save) {
                //       lastSave = save;
                saveWorldModelEdits(statusMap.parent);
            }

            //     }
        }
        function applyEdit(edit) {
            console.log("Apply Edit: ", edit);
          //  statusMap.activateSelection(selectionId);
        }

        function onCursorUpdate(obj3d) {

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
             //   statusMap.parent.config.attachments[editTarget.config.edit_id] = editTarget.config;
             //   let save = JSON.stringify(editTarget.config);
            //   if (lastSave !== save) {
             //       lastSave = save;
           //         saveWorldModelEdits(statusMap.parent);
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
            let assets = statusMap.parent.configData.assets


            for (let i = 0; i < assets.length; i++) {
                if (assets[i].edit_id !== config.edit_id) {
                 console.log("BAD ATTACH LOOP... not needed but tired")
                    statusMap.parent.configData.assets.push(config);
                }
            }
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

                    editTarget.call.setPaletteKey('ITEMS_MONO')
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
                        config:config,
                        onEditCB:applyEdit
                    }
                    configEdit.initEditTool(closeConfigEdit, map);
                }

                attachFunction(selectionId, attachCallback);

            }


        }

        let htmlReady = function(htmlEl) {
            htmlElem = htmlEl;
            statusMap = htmlElem.statusMap;
            rootElem = htmlEl.call.getRootElement();

            let parentConfig = statusMap.parent.config;

            editSelect = htmlElem.call.getChildElement('edit');
            htmlElem.call.populateSelectList('edit', edits)

            statusMap.axis = "Y";
            let axisSelect = htmlElem.call.getChildElement('axis');
            htmlElem.call.populateSelectList('axis', axisRot)
            axisSelect.value = statusMap.axis;
            selectList = htmlElem.call.getChildElement('select_list');
            htmlElem.call.populateSelectList('select_list', editList)
            applyContainerDiv = htmlElem.call.getChildElement('apply_container');
            changeModelSelection = htmlElem.call.getChildElement('model_list');
            changeToModel = changeModelSelection.value;
            changeModelContainer = htmlElem.call.getChildElement('model_container');
            htmlElem.call.populateSelectList('model_list', assets);
            addButtonDiv = htmlElem.call.getChildElement('add_button');
            DomUtils.addClickFunction(addButtonDiv, applyOperateButton)
            ThreeAPI.registerPrerenderCallback(update);
            applySelection(selectionId)
        }.bind(this);

        function applyEditMode(mode) {
            MATH.emptyArray(editList)
            if (mode === 'NEW') {
                addButtonDiv.innerHTML = "SAVE"
                MATH.copyArrayValues(assets, editList)
                htmlElem.call.populateSelectList('select_list', editList)
                changeModelContainer.style.display = 'none';
            } else if (mode === 'MODIFY') {
                addButtonDiv.innerHTML = "REMOVE"
                for (let i = 0;i < statusMap.parent.configData.assets.length; i++) {
                    editList.push(i);
                    htmlElem.call.populateSelectList('select_list', editList)
                //    changeModelContainer.style.display = '';
                }
            }

        };
        let applySelection = function(id) {
            selectionId = id;

            if (editSelect.value === 'MODIFY') {
                if (id === "0") {
                    changeModelContainer.style.display = "none"
                } else {
                    changeModelContainer.style.display = ""

                    let models =statusMap.parent.locationModels
                    editTarget = models[id];
                    console.log("Set Edit Target ", changeToModel);
                    console.log(editTarget)
                    ThreeAPI.getCameraCursor().getLookAroundPoint().copy(editTarget.getPos())
                    modelCursor.call.setPos(editTarget.getPos());
                    selectionUpdate(changeToModel);
                    return;
                }
            } else {
                changeModelContainer.style.display = "none"
            }

            selectionUpdate(selectionId);
        };

        function modifyChangeModel() {
            statusMap.config.model = changeToModel;
            editTarget.call.setAssetId(changeToModel);
        }

        let update = function() {
            cursorObj3d.position.copy(ThreeAPI.getCameraCursor().getLookAroundPoint());

            if (activeEdit !== editSelect.value) {
                applyEditMode(editSelect.value);
                activeEdit = editSelect.value;
            }

            if (modelCursor !== null) {
                modelCursor.call.setPos(cursorObj3d.position);
                ThreeAPI.getCameraCursor().getLookAroundPoint().add(modelCursor.call.getUpdateObj().position)
            }

            if (selectionId !== selectList.value) {
                applySelection(selectList.value);
            }

            if (changeToModel !== changeModelSelection.value) {
                changeToModel = changeModelSelection.value
                modifyChangeModel();
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