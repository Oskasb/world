class GameAdventureSystem {
    constructor() {
        this.startActor = null;
    }

    selectAdventure(event) {
        let lookAroundPoint = ThreeAPI.getCameraCursor().getLookAroundPoint();
        let cursorPos = ThreeAPI.getCameraCursor().getCursorObj3d().position;
        MATH.vec3FromArray(lookAroundPoint, event.pos);
        cursorPos.copy(lookAroundPoint);
        cursorPos.y = ThreeAPI.terrainAt(cursorPos);
        ThreeAPI.getCameraCursor().setZoomDistance(3)
        let actorId = event['actor_id'];

        if (this.startActor) {
            this.startActor.deactivateGameActor();
        }

        let actorLoaded = function(actor) {
            actor.activateGameActor();
            this.startActor = actor;
        }.bind(this);

        evt.dispatch(ENUMS.Event.LOAD_ACTOR,  {id: actorId, pos:cursorPos, callback:actorLoaded})

    }

}

export { GameAdventureSystem }