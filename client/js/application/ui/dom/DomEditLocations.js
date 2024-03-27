import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {notifyCameraStatus} from "../../../3d/camera/CameraFunctions.js";
import {GuiAxisSlider} from "../gui/widgets/GuiAxisSlider.js";
import {GuiAxisFeedback} from "../gui/widgets/GuiAxisFeedback.js";
import {ENUMS} from "../../ENUMS.js";
import {detachConfig} from "../../utils/ConfigUtils.js";

let classNames = {
    'GuiAxisSlider':GuiAxisSlider,
    'GuiAxisFeedback':GuiAxisFeedback
}

let tempVec = new Vector3();
let frustumFactor = 0.828;
let domEnvEdit = null;
let domEditTerrain = null;
let domEditEncounter = null;
let domEditLocation = null;
let selectedTool = "MODELS";
let activeTools = []

let inputWidget = [];
let inputSamplers = [];
let inputWidgets = [];
let controls = [];

let controlValues = {
    CAM_TURN:0,
    CAM_PITCH:0,
    CAM_FORWARD:0,
    CAM_DISTANCE:0,
    CONTROL_FORWARD:0,
    CONTROL_STRAFE:0,
};

function attachInputSampler(controlKeys, inputSamplers) {

    for (let i = 0; i < controlKeys.length; i++) {
        let controlKey = controlKeys[i];
        if (typeof (controlKey) === 'string') {
            if (inputSamplers.indexOf(controlKey) === -1) {
                inputSamplers.push(controlKey);
            }
        }
    }
}

function attachInputWidget(inputConfig) {

    let widgets = inputWidgets;
    let controls = inputConfig['controls'] || [];
    let on_active = inputConfig['on_active'] || [];

    attachInputSampler(controls, inputSamplers)
    attachInputSampler(on_active, inputSamplers)

    let onUpdate = function(values) {
        for (let i = 0; i < values.length; i++) {
            if (controls[i]) {
                controlValues[controls[i]] = values[i];
            }
        }
        GameAPI.getPlayer().setStatusKey(ENUMS.PlayerStatus.CONTROL_VALUES, controlValues);
    }

    let onActivate = function(bool) {
        for (let i = 0; i < on_active.length; i++) {
            controlValues[on_active[i]] = bool;
        }
    }

    let widgetReadyCB = function(inputWidget) {
        //    console.log("WidgetReady:", inputWidget);
        //    inputWidget.guiWidget.applyWidgetOptions(inputConfig['options'])
        inputWidget.addInputUpdateCallback(onUpdate)
        inputWidget.addOnActivateCallback(onActivate)
        widgets.push(inputWidget)
    }

    let widget = new classNames[inputConfig['class_name']](inputConfig['options'])
    widget.initGuiWidget(inputConfig['widget_config'], widgetReadyCB)
}

let inputConfigs = [
    {"class_name": "GuiAxisSlider",
        "widget_config": "widget_thumbstick",
        "controls":["CONTROL_STRAFE","CONTROL_FORWARD"],
        "options":{
            "anchor": "stick_bottom_right",
            "icon": "directional_arrows",
            "axis": [1, 1],
            "release": [1, 1],
            "range": [0.08, 0.08]
        }
    },
    {"class_name": "GuiAxisSlider",
        "widget_config": "widget_thumbstick",
        "controls":[null,"CAM_FORWARD"],
        "options":{
            "anchor": "stick_bottom_left",
            "icon": "vertical_arrows",
            "axis": [0, 1],
            "release": [1, 1],
            "range": [0.08, 0.08]
        }
    }
]

function operateTool(tool, closeCB) {

    while (activeTools.length) {
        let editTool = activeTools.pop();
        editTool.closeEditTool();
        poolReturn(editTool);
    }

    if (tool === "MODELS" || tool === "--select--" || tool === "") {
        return;
    }

    let activateTool;

    if (tool === "ENVIRNMNT") {
        activateTool = poolFetch('DomEnvEdit');
        activateTool.setStatusMap(ThreeAPI.getEnvironment().getStatusMap())
    }

    if (tool === "TERRAIN") {
        activateTool = poolFetch('DomEditTerrain');
    }

    if (tool === "LOCATION") {
        activateTool = poolFetch('DomEditLocation');
    }

    if (tool === "ENCOUNTER") {
        activateTool = poolFetch('DomEditEncounter');
    }
    activateTool.initEditTool(closeCB);
    activeTools.push(activateTool)

}

let toolsList = [
    "MODELS",
    "ENVIRNMNT",
    "TERRAIN",
    "LOCATION",
    "ENCOUNTER"
]

class DomEditLocations {
    constructor() {
        this.statusMap = {
            tool:selectedTool
        };

        let statusMap = this.statusMap;
        let toolSelectDiv = null;

        function toolClosedCB() {
            toolSelectDiv.value = "";
        }

        let applyTool = function() {
            operateTool(statusMap.tool, toolClosedCB);
        }

        let htmlReady = function(htmlElem) {

            let locationsData = GameAPI.worldModels.getActiveLocationData();
            let worldModels = GameAPI.worldModels.getActiveWorldModels();
            toolSelectDiv = htmlElem.call.getChildElement('tool');
            htmlElem.call.populateSelectList('tool', toolsList)
            console.log([worldModels, locationsData]);
            ThreeAPI.registerPrerenderCallback(update);
            applyTool();

            let selectedActor = GameAPI.getGamePieceSystem().selectedActor;
            if (selectedActor) {
                selectedActor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_INACTIVE)
            }

        }

        let visibleWorldModels = [];
        let locationModelDivs = [];
        let editCursors = {};
        let modelEdit = null;

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

            model.config = detachConfig(model.config);

            if (typeof (editCursors[model.id]) !== 'object') {
                e.target.style.visibility = "hidden";
                let cursor = poolFetch('DomEditCursor')

                let onClick = function(crsr) {
                    console.log("Clicked Cursor", crsr)

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
            let locationsData = GameAPI.worldModels.getActiveLocationData();

            if (toolSelectDiv.value !== selectedTool) {
                statusMap.tool = toolSelectDiv.value
                selectedTool = statusMap.tool;
                applyTool()
            }

            MATH.emptyArray(visibleWorldModels);

            if (selectedTool === "MODELS") {
                let worldModels = GameAPI.worldModels.getActiveWorldModels();
                let camCursorDist = MATH.distanceBetween(ThreeAPI.getCameraCursor().getPos(), ThreeAPI.getCamera().position)
                for (let i = 0; i < worldModels.length; i++) {
                    let pos = worldModels[i].getPos();
                    let distance = MATH.distanceBetween(ThreeAPI.getCameraCursor().getPos(), pos)
                    if (distance < 25 + camCursorDist*0.5) {
                        if (ThreeAPI.testPosIsVisible(pos)) {
                            visibleWorldModels.push(worldModels[i]);
                        }
                    }
                }

                while (locationModelDivs.length < visibleWorldModels.length) {
                    let div = DomUtils.createDivElement(document.body, 'model_'+visibleWorldModels.length, 'EDIT', 'button')
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

        let close = function() {
            while (locationModelDivs.length) {
                DomUtils.removeDivElement(locationModelDivs.pop());
            }

            let selectedActor = GameAPI.getGamePieceSystem().selectedActor;
            if (selectedActor) {
                selectedActor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_WALK)
            }

        }

        this.call = {
            htmlReady:htmlReady,
            update:update,
            close:close
        }

    }

    initDomEditLocations(closeCb) {

        for (let i = 0; i < inputConfigs.length; i++) {
            attachInputWidget(inputConfigs[i]);
        }

        notifyCameraStatus( ENUMS.CameraStatus.CAMERA_MODE, ENUMS.CameraControls.CAM_EDIT, null)
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_locations', closeCb, this.statusMap, 'edit_frame', this.call.htmlReady);
    }

    closeDomEditLocations() {

        while (inputWidgets.length) {
            inputWidgets.pop().removeGuiWidget();
        }

        this.call.close();
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEditLocations }