import {GuiExpandingContainer} from "../widgets/GuiExpandingContainer.js";
import {GuiCameraControlButton} from "../widgets/GuiCameraControlButton.js";

let playerPortraitLayoutId = 'widget_companion_sequencer_button'

let cameraSpatialCursor = null;
let buttons = []
let container = null;
let activeStatuses = [];

let testActive = function(statusKey) {
    if (activeStatuses.indexOf(statusKey) !== -1) {
        return true;
    } else {
        return false;
    }
}

let onActivate = function(statusKey) {
    console.log("Button Pressed, onActivate:", statusKey)

    if (activeStatuses.indexOf(statusKey) === -1) {
        activeStatuses.push(statusKey)
    } else {
        MATH.splice(activeStatuses, statusKey)
    }

}

let fitTimeout = null;

let onReady = function(button) {
    console.log("onReady", button)
  //  portrait.actor.setStatusKey(ENUMS.ActorStatus.SEQUENCER_SELECTED, false)
    container.addChildWidgetToContainer(button.guiWidget)

    clearTimeout(fitTimeout);
    fitTimeout = setTimeout(function() {
        container.fitContainerChildren()
    },0)
}

function addControlButton(statusKey) {
    let seqIndex = statuses.indexOf(statusKey);
    buttons[seqIndex] = new GuiCameraControlButton(statusKey, playerPortraitLayoutId, onActivate, testActive, 0, 0, onReady)
}

function renderCameraControlUi(statusKey) {

    if (!buttons[statuses.indexOf(statusKey)]) {
        addControlButton(statusKey);
    }

}

let updateCameraUiSystem = function(tpf, time) {
    MATH.forAll(statuses, renderCameraControlUi);
}

let statuses = [];

class CameraUiSystem {
    constructor() {

        for (let key in ENUMS.CameraStatus) {
            statuses.push(ENUMS.CameraStatus[key])
        }
    }

    setCameraMode(camMode, camSpatialCursor) {

        let containerReady = function(widget) {
            console.log(widget)
            //    container = widget;
            widget.attachToAnchor('mid_right');
        }

        if (!container) {
            container = new GuiExpandingContainer()
            container.initExpandingContainer('widget_camera_status_expanding_container', containerReady)
            ThreeAPI.addPrerenderCallback(updateCameraUiSystem)
        }

        cameraSpatialCursor = camSpatialCursor;
    }

    closeCameraUi() {

        while (buttons.length) {

        }

        ThreeAPI.unregisterPrerenderCallback(updateCameraUiSystem)
    }

}

export { CameraUiSystem }