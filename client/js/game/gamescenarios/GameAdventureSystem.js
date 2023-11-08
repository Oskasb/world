class GameAdventureSystem {
    constructor() {
        this.startActor = null;
        this.page = null;
    }

    selectAdventure(event) {

        if (event['activate_selection'] === true) {
            GameAPI.getGamePieceSystem().addActorToPlayerParty(this.startActor);
            GameAPI.getGamePieceSystem().playerParty.selectPartyActor(this.startActor);
            GuiAPI.closePage(this.page);
            GuiAPI.closePage(client.page)
            return;
        }

        let lookAroundPoint = ThreeAPI.getCameraCursor().getLookAroundPoint();
        let cursorPos = ThreeAPI.getCameraCursor().getCursorObj3d().position;
        MATH.vec3FromArray(lookAroundPoint, event.pos);
        cursorPos.copy(lookAroundPoint);
        cursorPos.y = ThreeAPI.terrainAt(cursorPos);
        ThreeAPI.getCameraCursor().setZoomDistance(3)
        let actorId = event['actor_id'];
        let pageId = event['page_id'];

        if (this.startActor) {
            this.startActor.deactivateGameActor();
        }

        if (this.page) {
            GuiAPI.closePage(this.page)
            this.page = null;
        }
        let _this = this;

        let actorLoaded = function(actor) {
            actor.activateGameActor();
            this.startActor = actor;
            setTimeout(function() {
                if (_this.page) {
                    GuiAPI.closePage(_this.page)
                }
                _this.page = GuiAPI.activatePage(pageId);
            }, 200)

        }.bind(this);

        evt.dispatch(ENUMS.Event.LOAD_ACTOR,  {id: actorId, pos:cursorPos, callback:actorLoaded})

    }

}

export { GameAdventureSystem }