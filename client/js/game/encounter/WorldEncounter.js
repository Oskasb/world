import {Object3D} from "../../../libs/three/core/Object3D.js";
import { Vector3 } from "../../../libs/three/math/Vector3.js";
import { VisualEncounterHost } from "../visuals/VisualEncounterHost.js";
import { EncounterIndicator } from "../visuals/EncounterIndicator.js";
import {parseConfigDataKey} from "../../application/utils/ConfigUtils.js";
import {notifyCameraStatus} from "../../3d/camera/CameraFunctions.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {getDestination} from "../../../../Server/game/actor/ActorStatusFunctions.js";
import {DomInteract} from "../../application/ui/dom/DomInteract.js";
import {colorMapFx} from "../visuals/Colors.js";

let tempVec = new Vector3()
let calcVec = new Vector3()

let radiusEvent = {}

let indicateInteractRadius = function(encounter) {
    let radius = encounter.config.trigger_radius+2;
    radiusEvent.heads = Math.ceil(MATH.curveSqrt(radius))+2;
    radiusEvent.speed = MATH.curveSqrt(radius)+3;
    radiusEvent.radius = radius;
    radiusEvent.pos = encounter.getPos();
    radiusEvent.rgba = colorMapFx.GLITTER_FX
    radiusEvent.elevation = 0;
    evt.dispatch(ENUMS.Event.INDICATE_RADIUS, radiusEvent)
}

let indicateTriggerRadius = function(encounter) {
    let radius = encounter.config.trigger_radius
    radiusEvent.heads = Math.ceil(MATH.curveSqrt(radius))+2;
    radiusEvent.speed = MATH.curveSqrt(radius)+1;
    radiusEvent.radius = radius;
    radiusEvent.pos = encounter.getPos();
    radiusEvent.rgba = encounter.getTriggerRGBA();
    radiusEvent.elevation = 0;
    evt.dispatch(ENUMS.Event.INDICATE_RADIUS, radiusEvent)
}

let encounterEvent = {};
let green =  [0, 0.5, 0.0, 1]
let triggeredCount = 0;


function processEncounterActivation(actor, encounter) {

    actor.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, false);
    actor.setStatusKey(ENUMS.ActorStatus.REQUEST_PARTY, '');
    actor.setStatusKey(ENUMS.ActorStatus.ACTIVATING_ENCOUNTER, '');
    actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_BATTLE);
//    notifyCameraStatus(ENUMS.CameraStatus.CAMERA_MODE, ENUMS.CameraControls.CAM_ENCOUNTER, false);

    if (encounter.timeInsideTrigger === 0) {
        GuiAPI.screenText("PARTY ENCOUNTER", ENUMS.Message.HINT, 4);
        //    actor.actorStatusProcessor.processActorStatus(actor);
        let onCompleted = function(pos) {
            actor.setSpatialPosition(pos);
            poolReturn(transition)
        }

        let onUpdate = function(pos, vel) {
            ThreeAPI.getCameraCursor().getLookAroundPoint().copy(pos)
            actor.setSpatialPosition(pos);
        }

        let transition = poolFetch('SpatialTransition')
        transition.targetPos.copy(encounter.getPointInsideActivationRange(actor.getSpatialPosition()));
        transition.targetPos.x = Math.round(transition.targetPos.x);
        transition.targetPos.z = Math.round(transition.targetPos.z);
        actor.setDestination(transition.targetPos)
        transition.initSpatialTransition(actor.actorObj3d.position, transition.targetPos, 2.3, onCompleted, null, null, onUpdate)
    }
}

let indicateTriggerTime = function(actor, encounter) {
    let radius = 0.5 + MATH.curveQuad(encounter.timeInsideTrigger)
    radiusEvent.heads = 1;
    radiusEvent.speed = 1.5 * MATH.curveQuad(encounter.timeInsideTrigger) + 0.1;
    radiusEvent.radius = radius;
    radiusEvent.pos = tempVec


    radiusEvent.pos.copy(actor.getSpatialPosition());
    radiusEvent.rgba = green;
    radiusEvent.elevation = 2 - encounter.timeInsideTrigger * 2;
    evt.dispatch(ENUMS.Event.INDICATE_RADIUS, radiusEvent)
    radiusEvent.elevation = 0;
    evt.dispatch(ENUMS.Event.INDICATE_RADIUS, radiusEvent)

    radiusEvent.pos.copy(encounter.getPos());
    radiusEvent.rgba = encounter.getTriggerRGBA();
    radiusEvent.elevation = 2 - encounter.timeInsideTrigger * 2;
    evt.dispatch(ENUMS.Event.INDICATE_RADIUS, radiusEvent)
    radiusEvent.elevation = 0;
    evt.dispatch(ENUMS.Event.INDICATE_RADIUS, radiusEvent)
}




function testDestinationForTrigger(actor, encounter, radius) {

    let destPos = getDestination(actor);

    let distance = MATH.distanceBetween(destPos, encounter.getPos())

    let color = 'GREEN'
    let hostActor = encounter.getHostActor()
    let gridId = encounter.config.grid_id;

    if (distance < radius) {
        color = 'RED';
        actor.setStatusKey(ENUMS.ActorStatus.ACTIVATING_ENCOUNTER, encounter.id);

        if (encounter.engagementArc === null) {
            encounter.engagementArc = poolFetch('VisualEngagementArc')
            encounter.engagementArc.on(null, hostActor, null);
            encounter.engagementArc.from.copy(encounter.getPos());
            hostActor.setStatusKey(ENUMS.ActorStatus.ACTIVATING_ENCOUNTER, encounter.id)
            hostActor.actorText.say("Fight is on")

            encounter.gridBorder = poolFetch('VisualGridBorder');
            encounter.gridBorder.on(null, hostActor.getSpatialPosition(), null, gridId)

        }
        encounter.getHostActor().turnTowardsPos(destPos)
        encounter.engagementArc.to.copy(destPos);

    } else {
        actor.setStatusKey(ENUMS.ActorStatus.ACTIVATING_ENCOUNTER, "");
        if (encounter.engagementArc !== null) {
            hostActor.setStatusKey(ENUMS.ActorStatus.ACTIVATING_ENCOUNTER, '')
            encounter.engagementArc.off();
            encounter.engagementArc = null;
            hostActor.actorText.say("Chicken")
        }
        if (encounter.gridBorder !== null) {
            encounter.gridBorder.off();
            encounter.gridBorder = null;
        }
    }

    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:destPos, to:encounter.getPos(), color:color});

}

function checkTriggerPlayer(encounter) {

    let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();

    let hostActor = encounter.visualEncounterHost.call.getActor();
    if (!hostActor) return;

    if (selectedActor) {
        let tpf = GameAPI.getFrame().tpf
        let radius = encounter.config.trigger_radius;
        let distance = MATH.distanceBetween(selectedActor.getSpatialPosition(), encounter.getPos())

        if (encounter.config['interact_options']) {
            if (encounter.config['interact_options'].length > 0) {
                if (distance < radius + 7 && distance > radius + 0.5) {

                    if (encounter.interactGui === null) {
                        indicateInteractRadius(encounter);
                    }

                    if (distance < radius +2) {
                        if (encounter.interactGui === null) {
                            encounter.interactGui = new DomInteract(encounter, encounter.config['interact_options'])
                            selectedActor.turnTowardsPos(encounter.getPos());
                            selectedActor.setDestination(selectedActor.getSpatialPosition())
                            selectedActor.actorMovement.clearControlState(selectedActor);
                        }
                    } else {
                        if (encounter.interactGui !== null) {
                            encounter.interactGui.call.close();
                        }
                        encounter.interactGui = null;
                    }
                }
            }
        }

        if (distance < radius + 5) {
            indicateTriggerRadius(encounter);
            testDestinationForTrigger(selectedActor, encounter, radius)
            if (encounter.timeInsideProximity === 0) {
                hostActor.actorText.say("Get closer if you dare")
            }

            encounter.timeInsideProximity += tpf;
        } else {
            encounter.timeInsideProximity = 0;
        }

        let requestingActor = encounter.requestingActor;
        if (requestingActor) {
            distance = 0;
        }

        if (distance < radius) {
            if (encounter.interactGui !== null) {
                encounter.interactGui.call.close();
            }

            if (encounter.engagementArc !== null) {
                encounter.engagementArc.off();
                encounter.engagementArc = null;
            }

            if (encounter.gridBorder !== null) {
                encounter.gridBorder.off();
                encounter.gridBorder = null;
            }

            if (encounter.timeInsideTrigger === 0) {
                encounterEvent.request = ENUMS.ClientRequests.ENCOUNTER_INIT
                encounterEvent.actorId = selectedActor.getStatus(ENUMS.ActorStatus.ACTOR_ID);
                encounterEvent.playerParty = GameAPI.getGamePieceSystem().playerParty.listPartyMemeberIDs();
                encounterEvent.worldEncounterId = encounter.id;
                encounterEvent.encounterId = client.getStamp()+encounter.id+'_'+triggeredCount;
                encounterEvent.pos = encounter.getPos();
                encounterEvent.grid_id = encounter.config.grid_id;
                encounterEvent.spawn = encounter.config.spawn;
                encounterEvent.cam_pos = encounter.getTriggeredCameraHome();
                evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, encounterEvent)
                triggeredCount++
            }

            encounter.timeInsideTrigger += tpf;
        } else {
            encounter.timeInsideTrigger = 0;
        }
    }
}

let updateTriggered = function(encounter) {
    let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();
    encounter.timeInsideTrigger += GameAPI.getFrame().tpf *0.5;
    indicateTriggerTime(selectedActor, encounter)
}

class WorldEncounter {
    constructor(id, config, onReady) {
        this.id = id
        this.triggered = false;
        this.activated = false;
        this.started = false;
        this.timeInsideTrigger = 0;
        this.timeInsideProximity = 0;
        this.requestingActor = null;
        this.engagementArc = null;
        this.gridBorder = null;
        this.config = config;
        this.camHomePos = new Vector3();
        this.obj3d = new Object3D();
        MATH.vec3FromArray(this.obj3d.position, this.config.pos)
        this.obj3d.position.y = ThreeAPI.terrainAt(this.obj3d.position);

        this.visualEncounterHost = new VisualEncounterHost(this.obj3d);
        this.encounterIndicator = new EncounterIndicator(this.obj3d)
        this.interactGui = null;
        this.isVisible = false;

        let lastLod = null;

        let lodUpdated = function(lodLevel) {
            if (lastLod === lodLevel) return;
            lastLod = lodLevel;
        //    console.log(lodLevel)
            if (lodLevel !== -1 && lodLevel <= config['visibility']) {
                if (this.isVisible === false) {
                    this.showWorldEncounter()
                }
                this.isVisible = true
            } else {
                if (this.isVisible === true) {
                    this.hideWorldEncounter()
                }
                this.isVisible = false
            }
        }.bind(this)

        let onGameUpdate = function(tpf, gameTime) {
            if (this.triggered) {
                updateTriggered(this);
            } else {
                checkTriggerPlayer(this, gameTime);
            }
        }.bind(this)


        let serverEncounterActivated = function(message) {
            this.activted = true;
            let encId = message.encounterId;
            let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();
            let partyList = message.playerParty;
            let partyMatches = GameAPI.getPlayerParty().memberListMatchesPlayerParty(partyList)
            if (partyMatches === false) {
                console.log("Party is not matching message member list, this should not happen...")
            }

            let activate = function() {
                evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, {
                    request:ENUMS.ClientRequests.ENCOUNTER_PLAY,
                    encounterId:encId,
                    actorId:selectedActor.getStatus(ENUMS.ActorStatus.ACTOR_ID)
                })
            }


            if (config['activation_options']) {
                selectedActor.actorText.yell("I got Options")
            } else {
                activate()
            }


        //    console.log("ServerEncounterActive message: ", message)
        }.bind(this)

        let triggerWorldEncounter = function() {

            let hostActor = this.visualEncounterHost.call.getActor();
            let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();
            hostActor.actorText.yell("Here we go")

            let activate = function() {
                this.triggered = true;
                selectedActor.getGameWalkGrid().setTargetPosition(this.getPos())
                selectedActor.getGameWalkGrid().cancelActivePath()
                selectedActor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, '');
                selectedActor.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, false);
                selectedActor.setStatusKey(ENUMS.ActorStatus.REQUEST_PARTY, '');
                selectedActor.setStatusKey(ENUMS.ActorStatus.ACTIVATING_ENCOUNTER, this.id);
                selectedActor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_INACTIVE);
                ThreeAPI.getCameraCursor().getLookAroundPoint().copy(this.getPos())
                processEncounterActivation(selectedActor, this);
            }.bind(this)

            if (config['trigger_options']) {
            //    selectedActor.actorText.yell("I got Options")
                new DomInteract(this, config['trigger_options'])
                setTimeout(activate, 500)
            } else {
                activate()
            }


        }.bind(this)

        let startWorldEncounter = function(message) {
            this.started = true;
            this.deactivateWorldEncounter();
            GuiAPI.getWorldInteractionUi().deactivateWorldInteractUi();
            GameAPI.worldModels.deactivateEncounters();

        //   return;
            let hostActor = this.visualEncounterHost.call.getActor();
            let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();

            encounterEvent.request = ENUMS.ClientRequests.ENCOUNTER_INIT
            encounterEvent.worldEncounterId = message.worldEncounterId
            encounterEvent.encounterId = message.encounterId;
            encounterEvent.pos = this.getPos();
            encounterEvent.grid_id = this.config.grid_id;
            encounterEvent.spawn = this.config.spawn;
            encounterEvent.cam_pos = this.getTriggeredCameraHome();
            selectedActor.setStatusKey(ENUMS.ActorStatus.SELECTED_ENCOUNTER, "");
            selectedActor.setStatusKey(ENUMS.ActorStatus.ACTIVATING_ENCOUNTER, "");
            selectedActor.setStatusKey(ENUMS.ActorStatus.ACTIVATED_ENCOUNTER, this.id);
            selectedActor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_BATTLE);
            notifyCameraStatus(ENUMS.CameraStatus.CAMERA_MODE, ENUMS.CameraControls.CAM_ENCOUNTER, true);
            evt.dispatch(ENUMS.Event.GAME_MODE_BATTLE, encounterEvent)
        }.bind(this)

        this.call = {
            triggerWorldEncounter:triggerWorldEncounter,
            serverEncounterActivated:serverEncounterActivated,
            startWorldEncounter:startWorldEncounter,
            lodUpdated:lodUpdated,
            onGameUpdate:onGameUpdate,
        }


        if (this.config.host_id) {
        //    console.log("config host_id: ", this.config.host_id)

            let actorReady = function(actor) {
                onReady(this)
            }.bind(this)

            let onData = function(config) {
                this.visualEncounterHost.applyHostConfig(config, actorReady);
            }.bind(this)

            parseConfigDataKey("ENCOUNTER_HOSTS", "HOSTS",  'host_data', this.config.host_id, onData)
        } else {
            onReady(this);
        }

        if (this.config.indicator_id) {
        //    console.log("config indicator_id: ", this.config.indicator_id)
            let onIndicatorData = function(config) {
                this.encounterIndicator.applyIndicatorConfig(config);
            }.bind(this)

            parseConfigDataKey("ENCOUNTER_INDICATORS", "INDICATORS",  'indicator_data', this.config.indicator_id, onIndicatorData)
        }

    }

    requestActivationBy(actor) {
        this.requestingActor = actor;
    }

    getRequestingActor() {
        return this.requestingActor;
    }

    getPos() {
        return this.obj3d.position;
    }

    getPointInsideActivationRange(fromPos) {
        calcVec.subVectors(fromPos , this.getPos());
        calcVec.normalize();
        calcVec.multiplyScalar(this.config.trigger_radius -1)
        calcVec.add(this.getPos());
        return calcVec;
    }

    getHostActor() {
        return this.visualEncounterHost.call.getActor();
    }

    getTriggeredCameraHome() {
        let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();
        let actorPos = selectedActor.getSpatialPosition();
        calcVec.copy(this.getPos());
        calcVec.sub(actorPos);

        if (Math.abs(calcVec.x) < Math.abs(calcVec.z)) {
            calcVec.x = 0;
        } else {
            calcVec.z = 0;
        }

        calcVec.multiplyScalar(-3.3);
        this.camHomePos.addVectors(this.getPos(), calcVec);
        this.camHomePos.y += calcVec.length()*1.1;
        return this.camHomePos;
    }

    getTriggerRGBA() {
        return this.encounterIndicator.config.rgba
    }

    activateWorldEncounter() {
    //    console.log("activateWorldEncounter", this)
        ThreeAPI.registerTerrainLodUpdateCallback(this.getPos(), this.call.lodUpdated)
    }

    deactivateWorldEncounter() {
        ThreeAPI.clearTerrainLodUpdateCallback(this.call.lodUpdated)
        this.removeWorldEncounter()
    }

    showWorldEncounter() {
     //   console.log("showWorldEncounter", lodLevel, this)
        if (this.isVisible) {
            console.log("ALREADY VISIBLE showWorldEncounter", this)
            return;
        }

        this.encounterIndicator.showIndicator();
        this.visualEncounterHost.showEncounterHost();
        GameAPI.registerGameUpdateCallback(this.call.onGameUpdate)
        this.isVisible = true;
    }

    hideWorldEncounter() {
        if (this.isVisible) {
            this.encounterIndicator.hideIndicator();
            GameAPI.unregisterGameUpdateCallback(this.call.onGameUpdate)
        }
        this.visualEncounterHost.hideEncounterHost();
        this.isVisible = false;
    }
    removeWorldEncounter() {
        this.hideWorldEncounter();
        this.visualEncounterHost.removeEncounterHost();
    }


}

export { WorldEncounter }