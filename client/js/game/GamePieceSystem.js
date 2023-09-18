import { configDataList } from "../application/utils/ConfigUtils.js";
import { VisualGamePiece } from "./visuals/VisualGamePiece.js";
import { GameActor } from "./visuals/GameActor.js";

let visualConfigs = {};
let actorConfigs = {};

let loadActor = function(event) {
    let actorConfig = actorConfigs[event.id]
    let actor = new GameActor(actorConfig);

    let visualConfig = visualConfigs[actor.config['visual_id']];

    let visualPiece = new VisualGamePiece(visualConfig);
    actor.setVisualGamePiece(visualPiece);
    actor.activateGameActor();

    console.log("loadActor:", actor)

    if (event.tile) {
        actor.getPos().copy(event.tile.getPos());
    } else if (event.pos) {
        actor.getPos().copy(event.pos);
    } else {
        GameAPI.getGamePieceSystem().setSelectedGameActor(actor);
    }

    if (event.callback) {
        event.callback(actor);
    }


}

class GamePieceSystem {
    constructor() {

        this.selectedActor = null;

    }

    initGamePieceSystem = function() {
        let onData = function(data) {
            visualConfigs = data;
            console.log("visualConfigs", visualConfigs)
        }

        configDataList("GAME","VISUALS", onData)

        let onActorsData = function(data) {
            actorConfigs = data;
            console.log("actorConfigs", actorConfigs)
        }

        configDataList("GAME","ACTORS", onActorsData)

        evt.on(ENUMS.Event.LOAD_ACTOR, loadActor)

    }

    setSelectedGameActor = function(gameActor) {
        console.log("Set Selected Actor: ", gameActor);
        gameActor.actorObj3d.position.copy(ThreeAPI.getCameraCursor().getCursorObj3d().position);
        gameActor.getGameWalkGrid().setGridMovementObj3d(gameActor.actorObj3d)
        evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'game_travel'})
        gameActor.call.setAsSelection();
        this.selectedActor = gameActor;
    }

    getSelectedGameActor = function() {
        return this.selectedActor;
    }

}

export { GamePieceSystem }