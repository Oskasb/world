import { SpatialTransition } from "../piece_functions/SpatialTransition.js";
import {notifyCameraStatus} from "../../3d/camera/CameraFunctions.js";
import {evt} from "../../application/event/evt.js";

let spatialTransition

let completedEncounters = [];
let lootedTreasured = [];

function encounterCompleted(event) {
    console.log("Enc Completed", event);
    completedEncounters.push(event.worldEncounterId);
}

class GameAdventureSystem {
    constructor() {
        spatialTransition  = new SpatialTransition();
        this.startActor = null;
        this.page = null;
        evt.on(ENUMS.Event.ENCOUNTER_COMPLETED, encounterCompleted)
    }

    getCompletedEncounters() {
        return completedEncounters;
    }

    getLootedTreasures() {
        return lootedTreasured;
    }
    selectAdventure(event) {

        let actor = this.startActor;
        notifyCameraStatus(ENUMS.CameraStatus.CAMERA_MODE, ENUMS.CameraControls.CAM_AUTO, true)
        notifyCameraStatus(ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, false)
        notifyCameraStatus(ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, false)
        if (event['activate_selection'] === true) {
            //    actor.activateWalkGrid(3);
            actor.call.activateActionKey("ACTION_TRAVEL_WALK", ENUMS.ActorStatus.TRAVEL)

        //    let items = [];
        //    MATH.copyArrayValues(actor.getStatus(ENUMS.ActorStatus.EQUIPPED_ITEMS), items)
        //    actor.setStatusKey(ENUMS.ActorStatus.EQUIP_REQUESTS, items)
        //    actor.setStatusKey(ENUMS.ActorStatus.EQUIPPED_ITEMS, [])
            evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, {request:ENUMS.ClientRequests.UPDATE_STRONGHOLD, status:{TEMPLATE:actor.getStatus(ENUMS.ActorStatus.STRONGHOLD_ID)}})

            setTimeout(function() {
                evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, {request:ENUMS.ClientRequests.LOAD_SERVER_ACTOR, status:actor.getStatus()})
            }, 200)

            actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_INACTIVE)
            this.startActor.setStatusKey(ENUMS.ActorStatus.HP, this.startActor.getStatus(ENUMS.ActorStatus.MAX_HP))
        //    GameAPI.getGamePieceSystem().addActorToPlayerParty(this.startActor);
        //    GameAPI.getGamePieceSystem().playerParty.selectPartyActor(this.startActor);
            GameAPI.getGamePieceSystem().playerActorId = actor.id;
            //    this.startActor.travelMode.mode = null;
            GuiAPI.closePage(this.page);
            GuiAPI.closePage(client.page)
            client.page = null;

            this.startActor.removeGameActor();
            return;
        }

        let lookAroundPoint = ThreeAPI.getCameraCursor().getLookAroundPoint();

        MATH.vec3FromArray(spatialTransition.targetPos, event.pos);
        spatialTransition.targetPos.y = ThreeAPI.terrainAt(spatialTransition.targetPos);
        ThreeAPI.getCameraCursor().setZoomDistance(5)
        let actorId = event['actor_id'];
        let pageId = event['page_id'];
        let worldEncounters = event['world_encounters'];
        worldEncounters.push('portals_20')
        evt.dispatch(ENUMS.Event.LOAD_ADVENTURE_ENCOUNTERS, {world_encounters:[]})

        if (this.startActor) {
            let deactivateActor = this.startActor;
            setTimeout(function() {
                deactivateActor.removeGameActor();
            }, 10)
        }

        if (this.page) {
            GuiAPI.closePage(this.page)
            this.page = null;
        }

        let _this = this;

        let actorLoaded = function(actor) {

            let equipCb = function(item) {
                actor.equipItem(item);
            }


            let delayed = function() {
                let status = event['status']


                for (let key in status) {
                    actor.setStatusKey(key, status[key])
                }



                let equippedItems = event['equipped_items']

                if (equippedItems) {
                    for (let i = 0; i < equippedItems.length; i++) {
                        evt.dispatch(ENUMS.Event.LOAD_ITEM, {id: equippedItems[i], callback:equipCb})
                    }
                }


            }

            let onActorReady = function() {
                setTimeout(delayed, 10);
            }

            actor.activateGameActor(onActorReady);
            this.startActor = actor;
        }.bind(this);

        evt.dispatch(ENUMS.Event.LOAD_ACTOR,  {id: actorId, pos:spatialTransition.targetPos, callback:actorLoaded})

        let onArriveCB = function(atPos) {
            evt.dispatch(ENUMS.Event.LOAD_ADVENTURE_ENCOUNTERS, {world_encounters:worldEncounters})
            setTimeout(function() {
                if (_this.page) {
                    GuiAPI.closePage(_this.page)
                }
                _this.page = GuiAPI.activatePage(pageId);
                notifyCameraStatus(ENUMS.CameraStatus.CAMERA_MODE, ENUMS.CameraControls.CAM_ORBIT, true)
            }, 200)
        }.bind(this)

        let distance = MATH.distanceBetween(spatialTransition.targetPos, lookAroundPoint);

        spatialTransition.initSpatialTransition(lookAroundPoint, spatialTransition.targetPos, 1, onArriveCB, 15+distance*0.25, 'curveSigmoid')

    }


}

export { GameAdventureSystem }