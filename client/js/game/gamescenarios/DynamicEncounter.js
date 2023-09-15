
let encounterActors = []
class DynamicEncounter {
    constructor() {

    }

    setEncounterGrid(encounterGrid) {
        this.encounterGrid = encounterGrid;
    }

    addEncounterActors(count) {
        let actorTiles = this.encounterGrid.getRandomWalkableTiles(count);

        while (actorTiles.length) {

            let actorLoaded = function(actor) {
                encounterActors.push(actor);
            }

            let tile = actorTiles.pop();
            evt.dispatch(ENUMS.Event.LOAD_ACTOR, {id: 'ACTOR_FIGHTER', tile:tile, callback:actorLoaded});
        }
    }

    removeEncounterActors() {
        while (encounterActors.length) {

            let actor = encounterActors.pop();
            actor.deactivateGameActor();
        }
    }

}

export { DynamicEncounter }