import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {ENUMS} from "../../ENUMS.js";
import {physicalAlignYGoundTest, testProbeFitsAtPos} from "../../utils/PhysicsUtils.js";
import {detachConfig, saveEncounterEdits} from "../../utils/ConfigUtils.js";
import {ConfigData} from "../../utils/ConfigData.js";
import {WorldModel} from "../../../game/gameworld/WorldModel.js";

let tempVec = new Vector3();
let frustumFactor = 0.828;
let applyContainerDiv = null;
let idLabelDiv = null;
let activeTool = null;

let toolsList = [
    "EDIT",
    "ADD"
]

let modelConfigs = null;

class DomEditModel {
    constructor() {

        let addModelStatusMap = {}

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
        let modelEdit = null;
        let modelConfig = {
            "model": "",
            "pos": [0, 0, 0],
            "rot": [0, 0, 0],
            "scale": [1, 1, 1],
            "on_ground": false,
            "palette":"DEFAULT",
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

        }

        function selectionUpdate(id) {
            console.log("selectionUpdate", id);

            if (previewModel !== null) {
                previewModel.removeLocationModels();
            }

            if (id !== "") {
                modelConfig.model = id;
                applyCursorUpdate(editObj3d)
                previewModel = new WorldModel(modelConfig, "preview_model");
                console.log("applySelectedModel", previewModel);
                if (previewCursor === null) {
                    activateCursor();
                }
            } else {
                if (previewCursor !== null) {
                    previewCursor.closeDomEditCursor()
                }
            }

        }


        let models = [""];
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
                addModelStatusMap.activateSelection = applySelectedModel;
                addModelStatusMap.selectionUpdate = selectionUpdate;

            }
            new ConfigData("WORLD_LOCATIONS","LOCATION_MODELS",  false, false, false, onConfig)
        }





        function closeTool() {
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



        let closeModelEdit = function() {
            console.log("Model Edit Closed");
            modelEdit.closeDomEditWorldModel();
            poolReturn(modelEdit)
            modelEdit = null;
        }

        let closeEditCursor = function(htmlElem) {
            let cursor = htmlElem.cursor;
            let model = htmlElem.model;
            editCursors[model.id] = false;
            htmlElem.cursor = null;
            htmlElem.model = null;
            cursor.closeDomEditCursor();
            poolReturn(cursor);
        }

        let divClicked = function(e) {
            let model = e.target.value
            console.log("Edit Activated", model);
            idLabelDiv.innerHTML = model.id;
            model.config = detachConfig(model.config);

            if (typeof (editCursors[model.id]) !== 'object') {
                e.target.style.visibility = "hidden";
                let cursor = poolFetch('DomEditCursor')

                let onClick = function(crsr) {
                    console.log("Clicked Cursor", crsr)
                    idLabelDiv.innerHTML = model.id;
                    if (modelEdit === null) {
                        modelEdit = poolFetch('DomEditWorldModel')
                        modelEdit.call.setWorldModel(model);
                        modelEdit.initDomEditWorldModel(closeModelEdit)
                    } else {
                        let mdl = modelEdit.call.getWorldModel();
                        if (mdl === model) {
                            closeModelEdit();
                        } else {
                            modelEdit.call.setWorldModel(model);
                        }
                    }
                }

                cursor.initDomEditCursor(closeEditCursor, model.obj3d, model.call.applyEditCursorUpdate, onClick);
                cursor.htmlElement.cursor = cursor;
                cursor.htmlElement.model = model;
                editCursors[model.id] = cursor;
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

            if (selectedTool === "EDIT") {

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
                    let div = DomUtils.createDivElement(document.body, 'model_' + visibleWorldModels.length, 'EDIT', 'button')
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
                if (typeof (editCursors[key]) === 'object') {
                    editCursors[key].closeCb(editCursors[key].htmlElement)
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


    initEditTool(closeCb) {
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('tool_selector', closeCb, this.statusMap, 'edit_frame tool_selector', this.call.htmlReady);
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