import {GuiExpandingContainer} from "../widgets/GuiExpandingContainer.js";
import {GuiControlButton} from "../widgets/GuiControlButton.js";

let playerPortraitLayoutId = 'widget_icon_button_tiny'
let frameLayoutId = 'widget_button_state_tiny_frame'

let interactibleActors = [];
let actorButtons = [];
let buttons = []
let container = null;
let activeStatuses = [];
let cameraControls;

function getStatusList() {
    return cameraControls.getStatusList()
}

let testActive = function(statusKey) {
    return false
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

    let actor = GameAPI.getActorByIndex(statusKey);

    if (!actor) {
        console.log("Bad actor selection" )
        console.log("onActivate", GameAPI.getGamePieceSystem().getActors())

    } else {
        actor.actorText.say("Me "+statusKey);
    }
    

    return;
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
  //  container.addChildWidgetToContainer(button.guiWidget)
    let actor = GameAPI.getActorByIndex(button.statusKey)
    button.setButtonIcon(actor.getStatus(ENUMS.ActorStatus.ICON_KEY))

}

function addActorButton(actor) {
    let button = new GuiControlButton(actor.index, playerPortraitLayoutId, onActivate, testActive, 0, 0, onReady, frameLayoutId)
    actorButtons.push(button)
}



function getActorButton(actor) {

    for (let i = 0; i < actorButtons.length; i++) {
        let button = actorButtons[i];
        if (button.statusKey === actor.index) {
            return button;
        }
    }

}


function renderWorldInteractUi() {

    for (let i = 0; i < interactibleActors.length; i++) {
        let actor = interactibleActors[i];
        let button = getActorButton(actor);

        if (!button) {
            console.log("No button yet", actor, actorButtons)
        } else {
            button.positionByWorld(actor.getSpatialPosition())
        }
    }

}

function updateInteractiveActors() {
    let worldActors = GameAPI.getGamePieceSystem().getActors();

    let count = 0;

    for (let i = 0; i < worldActors.length; i++) {
        let actor = worldActors[i];
    //    if (!actor.isPlayerActor()) {
            count++
            if (interactibleActors.indexOf(actor) === -1) {
                interactibleActors.push(actor);
                addActorButton(actor);
            }
    //    }
    }

    if (interactibleActors.length !== count) {
        for (let i = 0; i < interactibleActors.length; i++) {
            if (worldActors.indexOf(interactibleActors[i]) === -1) {
                interactibleActors.splice(i, 1);
                i--
            }
        }
    }
}

let updateWorldInteractUiSystem = function(tpf, time) {
    updateInteractiveActors()
    renderWorldInteractUi()
}

class WorldInteractUiSystem {
    constructor() {    }

    initWorldInteractUi() {
        ThreeAPI.addPrerenderCallback(updateWorldInteractUiSystem)
    }

    closeWorldInteractUi() {
        while (buttons.length) {

        }
        ThreeAPI.unregisterPrerenderCallback(updateWorldInteractUiSystem)
    }

}

export { WorldInteractUiSystem }