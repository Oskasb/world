

let encounterActors = []

function spawnActor(actorConfig, tile) {
    let actorLoaded = function(actor) {
        encounterActors.push(actor);
    }

    evt.dispatch(ENUMS.Event.LOAD_ACTOR, {id: 'ACTOR_FIGHTER', tile:tile, callback:actorLoaded});

}

class DynamicEncounter {
    constructor() {

    }

    setEncounterGrid(encounterGrid) {
        this.encounterGrid = encounterGrid;
    }

    processSpawnEvent(spawn) {

        console.log("processSpawnEvent", spawn)

        if (spawn['actors']) {
            for (let i = 0; i < spawn.actors.length; i++) {
                let cfg = spawn.actors[i]
                let tile =  this.encounterGrid.getTileByRowCol(cfg.tile[0], cfg.tile[1]);
                if (tile.walkable === false) {
                    tile = this.encounterGrid.getRandomWalkableTiles(1)[0];
                }
                spawnActor(cfg, tile);
            }
        }

    }

    getEncounterActors() {
        return encounterActors;
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