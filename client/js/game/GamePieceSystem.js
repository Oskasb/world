import { configDataList } from "../application/utils/ConfigUtils.js";
import { VisualGamePiece } from "./visuals/VisualGamePiece.js";
import { GameActor } from "./actor/GameActor.js";
import { PlayerParty } from "./Player/PlayerParty.js";
import { Item } from "./gamepieces/Item.js";


let visualConfigs = {};
let actorConfigs = {};
let itemConfigs = {};

let loadItem = function(event) {

    let itemConfig = itemConfigs[event['id']]

    let visualConfig = visualConfigs[itemConfig['visual_id']];

    let visualPiece = new VisualGamePiece(visualConfig);
    let item = new Item(visualPiece, itemConfig)

    let visualReadyCB = function(visualGP) {

        console.log("Visual Piece: ", visualGP)
    //    visualGP.obj3d = item.obj3d;

        if (event.pos) {
            item.getPos().copy(event.pos);
            visualGP.getSpatial().call.applyInstanceBuffers()
        }

        event.callback(item)
    }

    visualPiece.attachModelAsset(visualReadyCB);
}

let loadActor = function(event) {
    let actorConfig = actorConfigs[event.id]
    let actor = new GameActor(actorConfig);

    let visualConfig = visualConfigs[actor.config['visual_id']];

    let visualPiece = new VisualGamePiece(visualConfig);
    actor.setVisualGamePiece(visualPiece);

    if (event.tile) {

        let onReady = function(readyActor) {
            console.log("On Ready: ", readyActor)
            let gameWalkGrid = readyActor.getGameWalkGrid()
            let activateEncounterGrid = GameAPI.call.getActiveEncounter();

            readyActor.getPos().copy(activateEncounterGrid.getPos());
            readyActor.actorObj3d.position.copy(readyActor.getPos())
            gameWalkGrid.setTargetPosition(event.tile.getPos())

            if (event.callback) {
                event.callback(readyActor);
            }
        }

        actor.activateGameActor(onReady);
        return;
    } else if (event.pos) {
        actor.getPos().copy(event.pos);
    } else {
        GameAPI.getGamePieceSystem().addActorToPlayerParty(actor);
        GameAPI.getGamePieceSystem().playerParty.selectPartyActor(actor)
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

        let onItemsData = function(data) {
            itemConfigs = data;
            //        console.log("actorConfigs", actorConfigs)
        }

        configDataList("GAME","ITEMS", onItemsData)

        evt.on(ENUMS.Event.LOAD_ACTOR, loadActor)
        evt.on(ENUMS.Event.LOAD_ITEM,  loadItem)
    }

    getPlayerParty() {
        return this.playerParty;
    }

    addActorToPlayerParty(actor) {
        this.playerParty.addPartyActor(actor);
    }

    setSelectedGameActor = function(gameActor) {
        console.log("Set Selected Actor: ", gameActor);


        if (gameActor.getStatus(ENUMS.ActorStatus.HAS_POSITION) === true) {
            ThreeAPI.getCameraCursor().getCursorObj3d().position.copy( gameActor.actorObj3d.position)
        } else {
            gameActor.actorObj3d.position.copy(ThreeAPI.getCameraCursor().getCursorObj3d().position);
            gameActor.getGameWalkGrid().setGridMovementObj3d(gameActor.actorObj3d)
        }

        gameActor.setStatusKey(ENUMS.ActorStatus.HAS_POSITION, true)
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