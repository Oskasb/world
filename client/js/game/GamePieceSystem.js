import { configDataList } from "../application/utils/ConfigUtils.js";
import { VisualGamePiece } from "./visuals/VisualGamePiece.js";
import { GameActor } from "./actor/GameActor.js";
import { PlayerParty } from "./Player/PlayerParty.js";

let visualConfigs = {};
let actorConfigs = {};

let loadActor = function(event) {
    let actorConfig = actorConfigs[event.id]
    let actor = new GameActor(actorConfig);

    let visualConfig = visualConfigs[actor.config['visual_id']];

    let visualPiece = new VisualGamePiece(visualConfig);
    actor.setVisualGamePiece(visualPiece);


    //  console.log("loadActor:", actor)

    if (event.tile) {
        actor.activateGameActor();

        let gameWalkGrid = actor.getGameWalkGrid()
        let activateEncounterGrid = GameAPI.call.getActiveEncounter();

        actor.getPos().copy(activateEncounterGrid.getPos());
        actor.actorObj3d.position.copy(actor.getPos())

        gameWalkGrid.setTargetPosition(event.tile.getPos())

    } else if (event.pos) {
        actor.getPos().copy(event.pos);
    } else {
        GameAPI.getGamePieceSystem().addActorToPlayerPArty(actor);
    }

    if (event.callback) {
        event.callback(actor);
    }


}

class GamePieceSystem {
    constructor() {

        this.playerParty = new PlayerParty();
        this.selectedActor = null;

    }

    initGamePieceSystem = function() {
        let onData = function(data) {
            visualConfigs = data;
            //        console.log("visualConfigs", visualConfigs)
        }

        configDataList("GAME","VISUALS", onData)

        let onActorsData = function(data) {
            actorConfigs = data;
            //        console.log("actorConfigs", actorConfigs)
        }

        configDataList("GAME","ACTORS", onActorsData)

        evt.on(ENUMS.Event.LOAD_ACTOR, loadActor)

    }

    getPlayerParty() {
        return this.playerParty;
    }

    addActorToPlayerPArty(actor) {
        this.playerParty.addPartyActor(actor);
    }

    setSelectedGameActor = function(gameActor) {
        console.log("Set Selected Actor: ", gameActor);

        if (gameActor.getStatus('has_position') === true) {
            ThreeAPI.getCameraCursor().getCursorObj3d().position.copy( gameActor.actorObj3d.position)
        } else {
            gameActor.actorObj3d.position.copy(ThreeAPI.getCameraCursor().getCursorObj3d().position);
            gameActor.getGameWalkGrid().setGridMovementObj3d(gameActor.actorObj3d)
        }

        gameActor.setStatusKey('has_position', true)
        evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'game_travel'})
        gameActor.call.setAsSelection();
        this.selectedActor = gameActor;
    }

    isPlayerPartyActor(actor) {
        let partyActors = this.playerParty.getPartyActors();
        if (partyActors.indexOf(actor) !== -1) {
            return true;
        }
    }

    getSelectedGameActor = function() {
        return this.selectedActor;
    }

}

export { GamePieceSystem }