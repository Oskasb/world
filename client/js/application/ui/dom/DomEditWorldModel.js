import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {paletteKeys} from "../../../game/visuals/Colors.js";
import {detachConfig, saveWorldModelEdits} from "../../utils/ConfigUtils.js";

let tempVec = new Vector3();
let frustumFactor = 0.828;

let editAttach = null;

let operationsList = [
    "",
    "ATTACH",
    "FLATTEN",
    "ELEVATE",
    "HIDE",
    "DELETE"
]

function closeEditAttach() {
    if (editAttach !== null) {
        editAttach.closeEditTool();
        poolReturn(editAttach);
        editAttach = null;
    }
}

let locationModelConfigTemplate = {
    "asset": "",
    "pos": [0, 0, 0],
    "rot": [0, 0, 0],
    "scale": [0.02, 0.02, 0.02],
    "solidity": 1.0,
    "visibility": 3,
    "boxes": []
}

function worldModelOperation(wModel, operation) {

    if (operation === "ATTACH") {
        closeEditAttach()
        editAttach = poolFetch('DomEditAttach');
        let config = detachConfig(locationModelConfigTemplate);
        let map = {
            id:config.edit_id,
            root:"create",
            folder:"model",
            parent:wModel,
            config:config
        }

        editAttach.initEditTool(closeEditAttach, map)

    }

    if (operation === "ELEVATE") {
        wModel.obj3d.position.y += 1;
        wModel.applyObj3dUpdate()
    }

    if (operation === "HIDE") {
        if (wModel.hidden !== true) {
            wModel.setHidden(true);
        } else {
            wModel.setHidden(false);
        }
    }

    if (operation === "FLATTEN") {
        wModel.applyObj3dUpdate();
        let box = wModel.box;
        ThreeAPI.alignGroundToAABB(box);
    }

    if (operation === "DELETE") {
        console.log("Delete World Model")
        wModel.config['DELETED'] = true;
        wModel.call.setPaletteKey('ITEMS_WHITE');
        saveWorldModelEdits(wModel);
        wModel.deleteWorldModel();
    }

}


class DomEditWorldModel {
    constructor() {

        this.targetObj3d = new Object3D();
        this.updateObj3d = new Object3D();

        this.statusMap = {
            header:"xx",
            palette_selection:"xx",
            operation:"xx",
            palette:"xx"
        };

        let statusMap = this.statusMap;

        let rootElem = null;

        let htmlElem;
        let applyOperationDiv = null;
        let nodeDivs = [];
        let selectedOperation = "";

        let initEditStatus = function(obj3d) {
            this.targetObj3d.copy(obj3d);
            this.updateObj3d.position.set(0, 0, 0);
            this.updateObj3d.scale.set(1, 1, 1);
            this.updateObj3d.quaternion.set(0, 0, 0, 1);
            this.statusMap.rotX = 0;
            this.statusMap.rotY = 0;
            this.statusMap.rotZ = 0;
        //    htmlElem.initStatusMap(this.statusMap)
        }.bind(this);
        let paletteVal = null;
        let worldModel = null;
        let operationSelect = null;


        let updateSelectedOperation = function() {
            console.log("updateSelectedOperation")
            if (selectedOperation === "") {
                applyOperationDiv.style.opacity = "0.4";
            } else {
                applyOperationDiv.style.opacity = "1";
            }
            applyOperationDiv.innerHTML = selectedOperation;
        }


        let applyOperation = function(e) {
            console.log("Apply", selectedOperation);
            worldModelOperation(worldModel, selectedOperation);
        }

        let setWorldModel = function(wModel) {
            worldModel = wModel;
            statusMap.palette = worldModel.call.getPaletteKey();
            if (paletteVal !== null) {
                paletteVal.value = statusMap.palette;
                statusMap.palette_selection = statusMap.palette
            }
            initEditStatus(worldModel.obj3d)
        };

        let getWorldModel = function() {
            return worldModel;
        }

        let htmlReady = function(htmlEl) {
            htmlElem = htmlEl;
            rootElem = htmlEl.call.getRootElement();
            paletteVal = htmlElem.call.getChildElement('palette');

            if (worldModel !== null) {
                paletteVal.value = worldModel.call.getPaletteKey();
                statusMap.palette = paletteVal.value;
                statusMap.palette_selection = statusMap.palette
            }

            applyOperationDiv = htmlElem.call.getChildElement('apply_operation');
            operationSelect = htmlElem.call.getChildElement('operation');
            DomUtils.addClickFunction(applyOperationDiv, applyOperation)

            rootElem.style.transition = 'none';
            ThreeAPI.registerPrerenderCallback(update);
            htmlElem.call.populateSelectList('palette', paletteKeys)
            htmlElem.call.populateSelectList('operation', operationsList)
            updateSelectedOperation();
        }


        let update = function() {
            rootElem.style.transition = 'none';

            if (worldModel.config['DELETED'] === true) {
                close();
                return;
            }

            if (worldModel !== null) {

                if (paletteVal.value !== worldModel.call.getPaletteKey()) {
                    statusMap.palette = paletteVal.value;
                    console.log("Palette Changed", worldModel)
                    worldModel.call.setPaletteKey(statusMap.palette);
                    saveWorldModelEdits(worldModel);
                }

                if (operationSelect.value !== selectedOperation) {
                    statusMap.operation = operationSelect.value
                    selectedOperation = statusMap.operation;
                    updateSelectedOperation()
                }

                statusMap.header = worldModel.config.model

                let div = rootElem;
                let pos = worldModel.getPos();
            //    div.value = model;
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:pos, color:'YELLOW'});
                ThreeAPI.toScreenPosition(pos, tempVec);
                div.style.top = 35-tempVec.y*(100/frustumFactor)+"%";
                div.style.left = 60+tempVec.x*(100/frustumFactor)+"%";
            }

        };

        let close = function() {
            this.htmlElement.closeHtmlElement();
        }.bind(this);

        this.call = {
            setWorldModel:setWorldModel,
            getWorldModel:getWorldModel,
            htmlReady:htmlReady,
            update:update,
            close:close
        }

    }


    initDomEditWorldModel(closeCb) {
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_world_model', closeCb, this.statusMap, 'edit_frame', this.call.htmlReady);
    }

    closeEditTool() {
        closeEditAttach()
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEditWorldModel }