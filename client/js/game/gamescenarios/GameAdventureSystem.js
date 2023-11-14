import { SpatialTransition } from "../piece_functions/SpatialTransition.js";

let spatialTransition

class GameAdventureSystem {
    constructor() {
        spatialTransition  = new SpatialTransition();
        this.startActor = null;
        this.page = null;
    }

    selectAdventure(event) {

        let actor = this.startActor;

        if (event['activate_selection'] === true) {
        //    actor.activateWalkGrid(3);

            setTimeout(function() {
                actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_WALK)
                actor.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, true)
        //        actor.getGameWalkGrid().deactivateWalkGrid();
            }, 1000)


            GameAPI.getGamePieceSystem().addActorToPlayerParty(this.startActor);
            GameAPI.getGamePieceSystem().playerParty.selectPartyActor(this.startActor);
        //    this.startActor.travelMode.mode = null;
            GuiAPI.closePage(this.page);
            GuiAPI.closePage(client.page)
            client.page = null;


            return;
        }

        let lookAroundPoint = ThreeAPI.getCameraCursor().getLookAroundPoint();

        MATH.vec3FromArray(spatialTransition.targetPos, event.pos);
        spatialTransition.targetPos.y = ThreeAPI.terrainAt(spatialTransition.targetPos);
        ThreeAPI.getCameraCursor().setZoomDistance(3)
        let actorId = event['actor_id'];
        let pageId = event['page_id'];

        if (this.startActor) {
            let deactivateActor = this.startActor;
            setTimeout(function() {
                deactivateActor.deactivateGameActor();
            }, 10)
        }

        if (this.page) {
            GuiAPI.closePage(this.page)
            this.page = null;
        }

        let _this = this;

        let actorLoaded = function(actor) {

            let itemCallback = function(item) {
                item.getSpatial().setScaleXYZ(1, 1, 1)
                actor.equipItem(item);
            }
            let onActorReady = function() {
                let equippedItems = event['equipped_items']

                if (equippedItems) {
                    for (let i = 0; i < equippedItems.length; i++) {
                        evt.dispatch(ENUMS.Event.LOAD_ITEM, {id: equippedItems[i], pos: actor.getPos(), callback:itemCallback})
                    }
                }
            }

            actor.activateGameActor(onActorReady);

            this.startActor = actor;
        }.bind(this);

        evt.dispatch(ENUMS.Event.LOAD_ACTOR,  {id: actorId, pos:spatialTransition.targetPos, callback:actorLoaded})

        let onArriveCB = function(atPos) {
            setTimeout(function() {
                if (_this.page) {
                    GuiAPI.closePage(_this.page)
                }
                _this.page = GuiAPI.activatePage(pageId);
            }, 200)
        }.bind(this)

        let distance = MATH.distanceBetween(spatialTransition.targetPos, lookAroundPoint);

        spatialTransition.initSpatialTransition(lookAroundPoint, spatialTransition.targetPos, 1, onArriveCB, distance*0.5, 'curveSigmoid')

    }

}

export { GameAdventureSystem }