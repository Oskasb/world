import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {ENUMS} from "../../ENUMS.js";
import {physicalAlignYGoundTest, testProbeFitsAtPos} from "../../utils/PhysicsUtils.js";
import {detachConfig, saveEncounterEdits, saveWorldModelEdits} from "../../utils/ConfigUtils.js";
import {ConfigData} from "../../utils/ConfigData.js";
import {WorldModel} from "../../../game/gameworld/WorldModel.js";

let tempVec = new Vector3();
let frustumFactor = 0.828;
let applyContainerDiv = null;
let idLabelDiv = null;
let activeTool = null;

let toolsList = [
    "EDIT",
    "ADD",
    "CREATE",
    "CONFIG"
]

let modelConfigs = null;
let assetConfigs = null;

let locationModelConfigTemplate = {
    "asset": "",
    "pos": [0, 0, 0],
    "rot": [0, 0, 0],
    "scale": [0.01, 0.01, 0.01],
    "solidity": 1.0,
    "visibility": 3,
    "boxes": []
}

let worldModelTemplateConfig =                 {
    "model": false,
    "pos": [0, 0, 0],
    "rot": [0, 0, 0],
    "scale": [1, 1, 1],
    "on_ground": true,
    "visibility": 3,
    "palette": "DEFAULT",
    "no_lod":true
}

class DomEditModel {
    constructor() {

        let addModelStatusMap = {}

        function createFunction(id, obj3d, callback) {

            if (!createModelStatusMap.parent) {
                let config = detachConfig(worldModelTemplateConfig);
                MATH.rotObj3dToArray(obj3d, config.rot);
                MATH.vec3ToArray(obj3d.position, config.pos);
                createModelStatusMap.parent = new WorldModel(config);
            }

            let locMCfg = detachConfig(locationModelConfigTemplate);
            locMCfg.asset = id;
            createModelStatusMap.parent.configData.assets.push(locMCfg);
            createModelStatusMap.parent.call.locationModels(createModelStatusMap.parent.configData)
            callback(locMCfg);
        }

        let createModelStatusMap = {
            root:"create",
            folder:"model",

            createFunction:createFunction
        }

        let previewModel = null;
        let cursor = null;
        let editObj3d = new Object3D();
        this.statusMap = {
            selectedTool: "",
            selection: "--select--"
        };

        let statusMap = this.statusMap;
        let rootElem = null;
        let htmlElem;
        let selectedTool = "";
        let editCursors = {};
        let previewCursor = null;
        let applyOperationDiv = null;
        let toolSelectDiv = null;
        let visibleWorldModels = [];
        let locationModelDivs = [];
        let activeTool = null;
        let modelConfig = {
            "model": "",
            "pos": [0, 0, 0],
            "rot": [0, 0, 0],
            "scale": [1, 1, 1],
            "on_ground": false,
            "palette": "DEFAULT",
            "visibility": 3,
            "no_lod": true
        }

        function onClick(e) {
            console.log("Model Cursor Click", e)
        }

        function applyCursorUpdate(obj3d) {
            MATH.vec3ToArray(obj3d.position, modelConfig.pos, 100)
            MATH.rotObj3dToArray(obj3d, modelConfig.rot, 1000);
            if (previewModel !== null) {
                previewModel.call.applyEditCursorUpdate(obj3d);
            }
        }

        function closePreviewCursor() {
            previewCursor.closeDomEditCursor();
            poolReturn(previewCursor);
            previewCursor = null;
        }

        function activateCursor() {
            previewCursor = poolFetch('DomEditCursor')
            previewCursor.initDomEditCursor(closePreviewCursor, editObj3d, applyCursorUpdate, onClick);
        }

        function applySelectedModel(id) {
            let wMdlId = previewModel.generateModelId()
            modelConfig.no_lod = false;
            modelConfig.palette = "DEFAULT";
            modelConfig.edit_id = false;
            let newConfig = detachConfig(modelConfig);
            let newWmodel = GameAPI.worldModels.addConfigModel(newConfig, newConfig.edit_id)
            modelConfig.no_lod = true;
            saveWorldModelEdits(newWmodel);
        }

        function selectionUpdate(id) {
            if (previewModel !== null) {
                previewModel.removeLocationModels();
            }

            if (id !== "") {
                modelConfig.model = id;
                applyCursorUpdate(editObj3d)
                modelConfig.no_lod = true;
                previewModel = new WorldModel(detachConfig(modelConfig));
                previewModel.id = "preview_model"
                previewModel.config.edit_id = false;
                previewModel.call.setPaletteKey("ITEMS_BLACK")
                console.log("selectionUpdate",id, previewModel);
                if (previewCursor === null) {
                    activateCursor();
                }
            } else {
                if (previewCursor !== null) {
                    previewCursor.closeDomEditCursor()
                    poolReturn(previewCursor)
                    previewCursor = null;
                }
            }
        }

        let models = [""];
        let assets = [""];

        if (modelConfigs === null) {
            let onConfig = function(configs) {
                   console.log(configs)
                for (let key in configs) {
                    let id = configs[key].id
                    if (models.indexOf(id) === -1) {
                        models.push(id)
                    } else {
                        console.log("entry already added, not right", id);
                    }
                }
                console.log("Add Model Options", models)
                addModelStatusMap.selectList = models;
                createModelStatusMap.models = models;
                addModelStatusMap.activateSelection = applySelectedModel;
                addModelStatusMap.selectionUpdate = selectionUpdate;

            }
            new ConfigData("WORLD_LOCATIONS","LOCATION_MODELS",  false, false, false, onConfig)
        }

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
                console.log("Add Asset Options", assets)
                createModelStatusMap.selectList = assets;
            }
            new ConfigData("ASSETS","MODELS",  false, false, false, onConfig)
        }

        function closeTool() {
            if (previewCursor !== null) {
                previewCursor.closeDomEditCursor()
                poolReturn(previewCursor);
                previewCursor = null;
            }
            if (previewModel !== null) {
                previewModel.removeLocationModels();
            }
            if (activeTool !== null) {
                activeTool.closeEditTool();
                poolReturn(activeTool);
                activeTool = null;
            }
        }

        let setSelectedTool = function(tool) {
            close()
            selectedTool = tool;
            statusMap.selectedTool = tool;
            if (activeTool !== null) {
                closeTool();
            }
            console.log("setSelectedTool", tool)
            if (tool === "_ADD") {
                applyOperationDiv.innerHTML = tool;
                applyContainerDiv.style.display = ""
            } else {
                applyContainerDiv.style.display = "none"
            }

            if (selectedTool === "ADD") {
                activeTool = poolFetch('DomEditAdd');
                activeTool.initEditTool(closeTool, addModelStatusMap);
            }

            if (selectedTool === "CREATE") {
                activeTool = poolFetch('DomEditCreate');
                activeTool.initEditTool(closeTool, createModelStatusMap);
            }

        }

        let htmlReady = function(el) {
            htmlElem = el;
            let locationsData = GameAPI.worldModels.getActiveLocationData();
            let worldModels = GameAPI.worldModels.getActiveWorldModels();
            toolSelectDiv = htmlElem.call.getChildElement('tool');
            applyOperationDiv = htmlElem.call.getChildElement('apply_tool');
            applyContainerDiv = htmlElem.call.getChildElement('apply_container');
            idLabelDiv = htmlElem.call.getChildElement('selection_value');
            htmlElem.call.populateSelectList('tool', toolsList)
            console.log([worldModels, locationsData]);
            rootElem = htmlElem.call.getRootElement();
            ThreeAPI.registerPrerenderCallback(update);

            let selectedActor = GameAPI.getGamePieceSystem().selectedActor;
            if (selectedActor) {
                selectedActor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_INACTIVE)
            }

        }



        let closeActiveTool = function() {
            console.log("Model Edit Closed");
            if (activeTool !== null) {
                activeTool.closeEditTool();
                poolReturn(activeTool)
                activeTool = null;
            }
        }

        let closeEditCursor = function(htmlElem) {
            let cursor = htmlElem.cursor;
            let model = htmlElem.model;
            if (model === null) {
                return;
            }
            editCursors[model.id] = false;
            htmlElem.cursor = null;
            htmlElem.model = null;
            cursor.closeDomEditCursor();
            poolReturn(cursor);
        }

        let divClicked = function(e) {
            let model = e.target.value
            console.log("Activated", selectedTool, model);
            idLabelDiv.innerHTML = model.id;
            model.config = detachConfig(model.config);

            if (selectedTool === "EDIT") {
                if (typeof (editCursors[model.id]) !== 'object') {
                    e.target.style.visibility = "hidden";
                    let cursor = poolFetch('DomEditCursor')

                    let onClick = function(crsr) {
                        console.log("Clicked Cursor", crsr)
                        closeEditCursor(crsr.htmlElement);
                        idLabelDiv.innerHTML = model.id;
                        if (activeTool === null) {
                            activeTool = poolFetch('DomEditWorldModel')
                            activeTool.call.setWorldModel(model);
                            activeTool.initDomEditWorldModel(closeActiveTool)
                        } else {
                            let mdl = activeTool.call.getWorldModel();
                            if (mdl === model) {
                                closeActiveTool();
                            } else {
                                activeTool.call.setWorldModel(model);
                            }
                        }
                    }

                    cursor.initDomEditCursor(closeEditCursor, model.obj3d, model.call.applyEditCursorUpdate, onClick);
                    cursor.htmlElement.cursor = cursor;
                    cursor.htmlElement.model = model;
                    editCursors[model.id] = cursor;
                }
            }

            if (selectedTool === 'CONFIG') {
                closeActiveTool();
                activeTool = poolFetch('DomEditConfig');
                let map = {
                    id:model.id,
                    root:"model",
                    folder: GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL),
                    parent:model,
                    config:model.config,
                    onEditCB:model.call.applyLoadedConfig
                }
                activeTool.initEditTool(closeActiveTool, map)
            }
        }

        let update = function() {

            editObj3d.position.copy(ThreeAPI.getCameraCursor().getLookAroundPoint());

            if (toolSelectDiv.value !== selectedTool) {
                statusMap.tool = toolSelectDiv.value
                selectedTool = statusMap.tool;
                setSelectedTool(toolSelectDiv.value)
            }

            MATH.emptyArray(visibleWorldModels);

            if (selectedTool === "EDIT" || selectedTool === "CONFIG") {

                let none = true;
                for (let key in editCursors) {
                    if (typeof (editCursors[key]) === 'object') {
                       none = false
                    }
                }
                if (none) {
                    idLabelDiv.innerHTML = "--No Selection--";
                }

                let worldModels = GameAPI.worldModels.getActiveWorldModels();
                let camCursorDist = MATH.distanceBetween(ThreeAPI.getCameraCursor().getPos(), ThreeAPI.getCamera().position)
                for (let i = 0; i < worldModels.length; i++) {
                    let pos = worldModels[i].getPos();
                    let distance = MATH.distanceBetween(ThreeAPI.getCameraCursor().getPos(), pos)
                    if (distance < 25 + camCursorDist * 0.5) {
                        if (ThreeAPI.testPosIsVisible(pos)) {
                            visibleWorldModels.push(worldModels[i]);
                        }
                    }
                }

                while (locationModelDivs.length < visibleWorldModels.length) {
                    let div = DomUtils.createDivElement(document.body, 'model_' + visibleWorldModels.length, selectedTool, 'button')
                    DomUtils.addClickFunction(div, divClicked);
                    locationModelDivs.push(div);
                }
            }

            while (locationModelDivs.length > visibleWorldModels.length) {
                DomUtils.removeDivElement(locationModelDivs.pop());
            }

            for (let i = 0; i < visibleWorldModels.length; i++) {
                let model = visibleWorldModels[i];
                let div = locationModelDivs[i];
                let pos = model.getPos();
                div.value = model;

                ThreeAPI.toScreenPosition(pos, tempVec);
                div.style.top = 50-tempVec.y*(100/frustumFactor)+"%";
                div.style.left = 50+tempVec.x*(100/frustumFactor)+"%";

                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:pos, color:'YELLOW'});
                tempVec.x = pos.x;
                tempVec.z = pos.z;
                tempVec.y = 0;
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:pos, to:tempVec, color:'YELLOW'});
            }
        }

        function closeEditCursors() {
            for (let key in editCursors) {
                if (editCursors[key] !== false) {
                    if (typeof(editCursors[key].closeCb) !== 'function' ) {
                        console.log("Bad Edit cursor close",editCursors[key], key, editCursors)
                        return
                    }
                    editCursors[key].closeCb(editCursors[key].htmlElement)
                    editCursors[key] = false;
                }
            }
        }

        let close = function() {
            idLabelDiv.innerHTML = "--No Selection--";
            while (locationModelDivs.length) {
                DomUtils.removeDivElement(locationModelDivs.pop());
            }
            closeEditCursors()

        }

        this.call = {
            htmlReady:htmlReady,
            update:update,
            close:close
        }

    }


    initEditTool(closeCb, onReady) {

        let readyCb = function() {
            this.call.htmlReady(this.htmlElement)
            if (typeof (onReady) === 'function') {
                onReady(this);
            }
        }.bind(this)
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('tool_selector', closeCb, this.statusMap, 'edit_frame tool_selector', readyCb);
    }

    closeEditTool() {
        this.call.close();
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEditModel }