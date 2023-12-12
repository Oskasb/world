import {EncounterStatus} from "./EncounterStatus.js";


let encounterActors = []
let faces = ['face_1', 'face_2', 'face_3', 'face_5', 'face_6', 'face_7', 'face_8']
let loads = 0;

function spawnActor(actorConfig, tile, encounterTurnSequencer, onReady) {
    let actorLoaded = function(actor) {
        actor.setStatusKey(ENUMS.ActorStatus.ALIGNMENT, 'HOSTILE');
        actor.setStatusKey(ENUMS.ActorStatus.NAME, 'Bandit '+actor.index);
        actor.setStatusKey(ENUMS.ActorStatus.ICON_KEY, MATH.getRandomArrayEntry(faces));
        actor.rollInitiative()
        encounterActors.push(actor);
        encounterTurnSequencer.addEncounterActor(actor);
        loads--
        if (loads === 0) {
            onReady()
        }
    }

    evt.dispatch(ENUMS.Event.LOAD_ACTOR, {id: 'ACTOR_FIGHTER', tile:tile, callback:actorLoaded});

}

class DynamicEncounter {
    constructor(id, worldEncId) {

        this.id = id;
        this.status = new EncounterStatus(id, worldEncId)
        this.isRemote = false;
        this.page = GuiAPI.activatePage('page_encounter_info');
    }

    setStatusKey(key, status) {
        let write = this.status.setStatusKey(key, status);
        if (this.isRemote === false) {
            this.status.setStatusKey(ENUMS.EncounterStatus.CLIENT_STAMP, client.getStamp());
            let gameTime = GameAPI.getGameTime();
            this.status.broadcastStatus(gameTime);
        } else {
        //    console.log("Battle Data:", key, status);
        //    GuiAPI.screenText("GOT BATTLE DATA")
        }
        return write
    }

    getStatus(key) {
        this.status.getStatusByKey(key);
    }

    setEncounterGrid(encounterGrid) {
        this.encounterGrid = encounterGrid;
    }

    processSpawnEvent(spawn, encounterTurnSequencer, onReady) {

        console.log("processSpawnEvent", spawn)

        if (spawn['actors']) {
            loads = spawn.actors.length
            for (let i = 0; i < spawn.actors.length; i++) {
                let cfg = spawn.actors[i]
                let tile =  this.encounterGrid.getTileByRowCol(cfg.tile[0], cfg.tile[1]);
                if (tile.walkable === false) {
                    tile = this.encounterGrid.getRandomWalkableTiles(1)[0];
                }
                spawnActor(cfg, tile, encounterTurnSequencer, onReady);
            }
        }
    }

    removeEncounterActors() {
        while (encounterActors.length) {
            let actor = encounterActors.pop();
            console.log("Remove Enc Actors", actor)
            actor.removeGameActor();
        }
    }

    closeDynamicEncounter() {
        this.removeEncounterActors();
        this.page.closeGuiPage();
    }

}

export { DynamicEncounter }