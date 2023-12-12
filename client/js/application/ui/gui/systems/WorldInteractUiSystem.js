import {GuiWidget} from "../elements/GuiWidget.js";
import {GuiControlButton} from "../widgets/GuiControlButton.js";
import {colorMapFx, frameFeedbackMap, elementColorMap} from "../../../../game/visuals/Colors.js";
import {poolFetch} from "../../../utils/PoolUtils.js";

let playerPortraitLayoutId = 'widget_icon_button_tiny'
let frameLayoutId = 'widget_button_state_tiny_frame'

let interactibleActors = [];
let hintedActors = [];
let actorButtons = [];
let actorHints = [];
let buttons = []
let container = null;
let activeStatuses = [];
let cameraControls;

let maxButtonDistance = 20;
let maxHintDistance = 50;

let hintOptions = {
    //   "icon": "text_background"
  "icon": "pinpoint_crosshair"
};


function initHintWidget (onReady, actor) {
    let widgetRdy = function(widget) {
        widget.applyWidgetOptions(hintOptions)
        let surface = widget.guiSurface;
    //    surface.getBufferElement().setColorRGBA(this.rgba)
        onReady(widget, actor)
    }.bind(this);
    let guiWidget = new GuiWidget('icon_actor_hint');
    guiWidget.initGuiWidget(null, widgetRdy);
};

let testActive = function(statusKey, buttonWidget) {

    let actor = GameAPI.getActorById(statusKey);

    if (!actor) {
    //    console.log("Bad actor selection", statusKey)
    //    console.log("testActive", GameAPI.getGamePieceSystem().getActors(), actorButtons)
        removeActorButton(buttonWidget)
    } else {
        let color = colorMapFx[actor.getStatus(ENUMS.ActorStatus.ALIGNMENT)] || colorMapFx['ITEM']
        buttonWidget.guiWidget.guiSurface.getBufferElement().setColorRGBA(color)
        buttonWidget.setIconRgba(color)
        let alignment = actor.getStatus(ENUMS.ActorStatus.ALIGNMENT) || 'ITEM';
        let frameFbConfId = frameFeedbackMap[alignment];
        buttonWidget.setButtonFrameFeedbackConfig(frameFbConfId)

        let playerActor = GameAPI.getGamePieceSystem().selectedActor;

        if (playerActor) {
            let targetId = playerActor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET);
            if (targetId === statusKey) {
                return true;
            }
        }
        return false;
    }
}

let statusEvent = {
    status_key:'',
    control_key:'',
    activate:false
}

let onActivate = function(statusKey) {

    let actor = GameAPI.getActorById(statusKey);

    if (!actor) {
        console.log("Bad actor selection", statusKey)
        console.log("onActivate", GameAPI.getGamePieceSystem().getActors(), actorButtons)
    } else {
        actor.actorText.say("Me "+statusKey);
    }

    let playerActor = GameAPI.getGamePieceSystem().selectedActor;

    if (playerActor) {
        let targetId = playerActor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET);
        if (targetId === statusKey) {
            playerActor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, "");
            playerActor.setStatusKey(ENUMS.ActorStatus.SELECTED_ENCOUNTER, "");
        } else {
            playerActor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, statusKey);

            let worldEncounter = GameAPI.getWorldEncounterByHost(statusKey);
            console.log(worldEncounter)
            if (worldEncounter) {
                playerActor.setStatusKey(ENUMS.ActorStatus.SELECTED_ENCOUNTER, worldEncounter.id);
            } else {
                playerActor.setStatusKey(ENUMS.ActorStatus.SELECTED_ENCOUNTER, "");
            }

        }
    }
}

let fitTimeout = null;

let onReady = function(button) {
    let actor = GameAPI.getActorById(button.statusKey)
    button.setButtonIcon(actor.getStatus(ENUMS.ActorStatus.ICON_KEY))
}

function addActorButton(actor) {
    let button = new GuiControlButton(actor.id, playerPortraitLayoutId, onActivate, testActive, 0, 0, onReady, frameLayoutId)
    actorButtons.push(button)
    let statusUI = poolFetch('WorldActorStatusUI')
    statusUI.activateWorldActorStatus(actor, button.guiWidget);
    button.statusUi = statusUI;
}

function hintReady(widget, actor) {
    widget.actor = actor;
    actorHints.push(widget);
}

function addActorHint(actor) {
    initHintWidget(hintReady, actor)
}

function getActorHint(actor) {
    for (let i = 0; i < actorHints.length; i++) {
        let hint = actorHints[i];
        if (hint.actor === actor) {
            return hint;
        }
    }
}

function getActorButton(actor) {

    for (let i = 0; i < actorButtons.length; i++) {
        let button = actorButtons[i];
        if (button.statusKey === actor.id) {
            return button;
        }
    }

}


function renderWorldInteractUi() {

    for (let i = 0; i < interactibleActors.length; i++) {
        let actor = interactibleActors[i];
        let button = getActorButton(actor);

        if (!button) {
        //    console.log("No button yet", actor, actorButtons)
            if (actor.getStatus(ENUMS.ActorStatus.EXISTS) === 0) {
                MATH.splice(interactibleActors, actor);
                i--
            }
        } else {
            let pos = actor.getSpatialPosition()
            pos.y += actor.getStatus(ENUMS.ActorStatus.HEIGHT) + 0.7;
            button.positionByWorld(pos)
            if (button.statusUi) {
                button.statusUi.call.update()
            }

        }
    }

}

function renderWorldHintUi() {
    for (let i = 0; i < hintedActors.length; i++) {
        let actor = hintedActors[i];

        let hint = getActorHint(actor);

        if (!hint) {
            console.log("No hint yet", actor)
        } else {
            let pos = actor.getSpatialPosition()
            pos.y += actor.getStatus(ENUMS.ActorStatus.HEIGHT) + 0.7;
            GuiAPI.worldPosToScreen(pos, ThreeAPI.tempVec3, 0.41, 0.0)
            hint.offsetWidgetPosition(ThreeAPI.tempVec3);
            let surface = hint.guiSurface;
            let rgba = elementColorMap[actor.getStatus(ENUMS.ActorStatus.ALIGNMENT)]
            surface.getBufferElement().setColorRGBA(rgba)
            hint.icon.setGuiIconColorRGBA(rgba)

        }
    }
}

function removeActorButton(button) {
    MATH.splice(actorButtons, button);
    button.removeGuiWidget()
    button.statusUi.deactivateWorldActorStatus();
    button.statusUi = null;
}

function removeActorFromInteraction(actor, selectedActor) {
    if (interactibleActors.indexOf(actor) !== -1) {
        MATH.splice(interactibleActors, actor);

        if (selectedActor) {
            if (selectedActor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET) === actor.id) {
                selectedActor.setStatusKey(ENUMS.ActorStatus.REQUEST_PARTY, "");
                selectedActor.setStatusKey(ENUMS.ActorStatus.SELECTED_ENCOUNTER, "");
                selectedActor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, "");
            }
        }


        let button = getActorButton(actor);
        if (button) {
            removeActorButton(button)
        }
    }
}

function removeActorFromHint(actor) {
    if (hintedActors.indexOf(actor) !== -1) {
        MATH.splice(hintedActors, actor);
        let hint = getActorHint(actor);
        if (hint) {
            MATH.splice(actorHints, hint);
            hint.actor = null;
            hint.recoverGuiWidget()
        }
    }
}

let alignmentRangeFactors = {}
alignmentRangeFactors['FRIENDLY'] = 10;
alignmentRangeFactors['NEUTRAL'] = 1;
alignmentRangeFactors['HOSTILE'] = 1;
alignmentRangeFactors['ITEM'] = 0.5;

function updateInteractiveActors() {
    let worldActors = GameAPI.getGamePieceSystem().getActors();

    let selectedActor = GameAPI.getGamePieceSystem().selectedActor;

    if (!selectedActor) {
        return;
    }

    let playerPos = selectedActor.getSpatialPosition();

    for (let i = 0; i < worldActors.length; i++) {
        let actor = worldActors[i];

        let alignment = actor.getStatus(ENUMS.ActorStatus.ALIGNMENT);
        let rangeFactor = alignmentRangeFactors[alignment];

        if (actor.getStatus(ENUMS.ActorStatus.EXISTS) === 1) {
            if (actor.isPlayerActor()) {
                removeActorFromInteraction(actor)
                removeActorFromHint(actor)
            } else {
                let distance = MATH.distanceBetween(playerPos, actor.getSpatialPosition())
                if (distance < maxButtonDistance*rangeFactor) {
                    if (interactibleActors.indexOf(actor) === -1) {
                        interactibleActors.push(actor);
                        addActorButton(actor);
                        removeActorFromHint(actor)
                    }
                } else {
                    removeActorFromInteraction(actor, selectedActor)
                    if (distance < maxHintDistance*rangeFactor) {
                        if (hintedActors.indexOf(actor) === -1) {
                            hintedActors.push(actor);
                            addActorHint(actor);
                        }
                    } else {
                        removeActorFromHint(actor)
                    }
                }
            }
        } else {
            removeActorFromInteraction(actor)
            removeActorFromHint(actor)
        }
    }
}

let updateWorldInteractUiSystem = function(tpf, time) {
    updateInteractiveActors()
    renderWorldInteractUi()
    renderWorldHintUi()
}

class WorldInteractUiSystem {
    constructor() {    }

    initWorldInteractUi() {
        ThreeAPI.addPrerenderCallback(updateWorldInteractUiSystem)
    }

    closeWorldInteractUi() {
        interactibleActors.length = 0;
        while (actorButtons.length) {
            removeActorButton(actorButtons.pop())
        }
        ThreeAPI.unregisterPrerenderCallback(updateWorldInteractUiSystem)
    }

}

export { WorldInteractUiSystem }