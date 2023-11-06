class ActorMovement {
    constructor() {
    }

    tileSelectionActive(actor) {
        let walkGrid = actor.getGameWalkGrid();
        let tileSelector = walkGrid.gridTileSelector;
        actor.setStatusKey(ENUMS.ActorStatus.SELECTING_DESTINATION, 1);
        if (!walkGrid.isActive) {
            actor.activateWalkGrid()
            console.log("MOVE ACTION - activate")
        } else {
            if (tileSelector.hasValue()) {
                actor.prepareTilePath(tileSelector.getPos());
            }
        }
    }

    tileSelectionCompleted(actor) {
        let walkGrid = actor.getGameWalkGrid();
        let tileSelector = walkGrid.gridTileSelector;
        if (walkGrid.isActive) {
            actor.setStatusKey(ENUMS.ActorStatus.SELECTING_DESTINATION, 0);
            let tileSelector = walkGrid.gridTileSelector;
            if (tileSelector.hasValue()) {
                console.log("MOVE ACTION - deactivate")
                actor.prepareTilePath(tileSelector.getPos());
            //    actor.moveActorOnGridTo(tileSelector.getPos(), walkGrid.call.deactivate)
                walkGrid.applySelectedPath(ThreeAPI.getCameraCursor().call.updatePathingCamera, ThreeAPI.getCameraCursor().call.pathCompletedCallback)
            }

            tileSelector.moveAlongX(0);
            tileSelector.moveAlongZ(0);
              }
    }

}

export {ActorMovement}