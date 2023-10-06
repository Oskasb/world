


class EncounterTurnSequencer {
    constructor() {
        this.turnActorIndex = 0;
        this.actors = [];
        this.activeActor = null;
        this.turnIndex = 0;

        let movementEnded = function(actorObj3d) {

            this.activeActor = null;
            this.turnActorIndex++

            if (this.turnActorIndex === this.actors.length) {
                this.turnActorIndex = 0;
                this.turnIndex++
            }
            console.log("movementEnded", this.turnActorIndex, this.turnIndex)
        }.bind(this)

        this.call = {
            movementEnded:movementEnded
        }

    }

    addEncounterActor(actor) {
        this.actors.push(actor);
    }

    activateActorTurn() {
        this.activeActor.moveActorOnGridTo(this.activeActor.getGameWalkGrid().getTargetPosition(), this.call.movementEnded)
    }
    updateTurnSequencer() {

        let actor = this.actors[this.turnActorIndex];
        if (this.activeActor !== actor) {
            console.log("updateTurnSequencer new actor", actor)
            this.activeActor = actor;
            if (this.turnIndex === 0) {
                this.activateActorTurn();
            } else {
                let tile = GameAPI.call.getActiveEncounter().getRandomWalkableTiles(1)[0];
                this.activeActor.getGameWalkGrid().setTargetPosition(tile.getPos())
            }


        }


    }



}

export { EncounterTurnSequencer }