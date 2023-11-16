import {GuiExpandingContainer} from "../widgets/GuiExpandingContainer.js";
import {GuiCameraControlButton} from "../widgets/GuiCameraControlButton.js";

let playerPortraitLayoutId = 'widget_companion_sequencer_button'

let buttons = []
let container = null;
let activeStatuses = [];
let cameraControls;

function getStatusList() {
    return cameraControls.getStatusList()
}

let testActive = function(statusKey) {
    let seqIndex = getStatusList().indexOf(statusKey);
    let button = buttons[seqIndex];
    let controlStatus = cameraControls.getCameraControlStatus(statusKey);
    button.setButtonIcon(controlStatus['controlKey']);
    return controlStatus['isActive'];

}

let statusEvent = {
    status_key:'',
    control_key:'',
    activate:false
}

let onActivate = function(statusKey) {
    // console.log("Button Pressed, onActivate:", statusKey)
    let controlStatus = cameraControls.getCameraControlStatus(statusKey);
    statusEvent['status_key'] = statusKey;
    statusEvent['control_key'] = controlStatus['controlKey'];
    statusEvent['activate']= !controlStatus['isActive'];
    evt.dispatch(ENUMS.Event.SET_CAMERA_STATUS, statusEvent)
}

let fitTimeout = null;

let onReady = function(button) {
    console.log("onReady", button)
  //  portrait.actor.setStatusKey(ENUMS.ActorStatus.SEQUENCER_SELECTED, false)
    container.addChildWidgetToContainer(button.guiWidget)
    button.setButtonIcon('CAM_AUTO')
    clearTimeout(fitTimeout);
    fitTimeout = setTimeout(function() {
        container.fitContainerChildren()
    },0)
}

function addControlButton(statusKey) {
    let seqIndex = getStatusList().indexOf(statusKey);
    buttons[seqIndex] = new GuiCameraControlButton(statusKey, playerPortraitLayoutId, onActivate, testActive, 0, 0, onReady)
}

function renderCameraControlUi(statusKey) {

    if (!buttons[getStatusList().indexOf(statusKey)]) {
        addControlButton(statusKey);
    }

}

let updateCameraUiSystem = function(tpf, time) {
    MATH.forAll(getStatusList(), renderCameraControlUi);
}



class CameraUiSystem {
    constructor(camControls) {
        cameraControls = camControls;
    }

    initCameraUi() {

        let containerReady = function(widget) {
            widget.attachToAnchor('mid_right');
            ThreeAPI.addPrerenderCallback(updateCameraUiSystem)
        }

        if (!container) {
            container = new GuiExpandingContainer()
            container.initExpandingContainer('widget_camera_status_expanding_container', containerReady)
        }

    }

    closeCameraUi() {

        while (buttons.length) {

        }

        ThreeAPI.unregisterPrerenderCallback(updateCameraUiSystem)
    }

}

export { CameraUiSystem }