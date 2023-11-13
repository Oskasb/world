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
            GameAPI.getGamePieceSystem().addActorToPlayerParty(this.startActor);
            GameAPI.getGamePieceSystem().playerParty.selectPartyActor(this.startActor);
            this.startActor.travelMode.mode = null;
            GuiAPI.closePage(this.page);
            GuiAPI.closePage(client.page)
            client.page = null;
            let equippedItems = event['equipped_items']


            let itemCallback = function(item) {
                console.log("Item Loaded; ", item)
                item.getSpatial().setScaleXYZ(1, 1, 1)
                actor.equipItem(item);
            }

            if (equippedItems) {
                while (equippedItems.length) {
                    evt.dispatch(ENUMS.Event.LOAD_ITEM, {id: equippedItems.pop(), pos: this.startActor.getPos(), callback:itemCallback})
                }
            }

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
            }, 200)
        }

        if (this.page) {
            GuiAPI.closePage(this.page)
            this.page = null;
        }

        let _this = this;

        let actorLoaded = function(actor) {
            actor.activateGameActor();
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