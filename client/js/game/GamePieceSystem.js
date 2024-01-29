import { configDataList } from "../application/utils/ConfigUtils.js";
import { VisualGamePiece } from "./visuals/VisualGamePiece.js";
import { GameActor } from "./actor/GameActor.js";
import { PlayerParty } from "./Player/PlayerParty.js";
import { Item } from "./gamepieces/Item.js";
import { ConfigData } from "../application/utils/ConfigData.js";
import { RemoteClient } from "../Transport/io/RemoteClient.js";
import {trackDebugConfig} from "../application/utils/DebugUtils.js";
import {evt} from "../application/event/evt.js";
import {getRemoteClients} from "../Transport/io/ServerCommandProcessor.js";

let statsConfig = {};
let visualConfigs = {};
let actorConfigs = {};
let itemConfigs = {};
let actors = [];
let items = [];
let actorIndex = 1; // zero index get culled by connection
let remoteClients = {}
let opponentList = []; // temp list for fetching opponents
let parsedEquipSlotData

let looseItems = []


let registerActor = function(actor) {
    if (actors.indexOf(actor) === -1) {
        actors.push(actor);
    }
}

let loadItem = function(event) {

    let itemConfig = itemConfigs[event['id']]
    let visualConfig = visualConfigs[itemConfig['visual_id']];
    let visualPiece = new VisualGamePiece(visualConfig);

    let visualReadyCB = function(visualGP) {

    //    console.log("Visual Piece: ", visualGP)
    //    visualGP.obj3d = item.obj3d;

    //
        let item = new Item(event['id'], visualPiece, itemConfig)
        items.push(item);
        if (event.pos) {
            item.getPos().copy(event.pos);
        }
        if (visualGP.isSkinnedItem) {
        //    console.log("Bind Skinned visualGP Item")
        } else {
            visualGP.getSpatial().call.applyInstanceBuffers()
        }

        item.status.call.initItemStatus();
        event.callback(item)
    }

    visualPiece.attachModelAsset(visualReadyCB);
}



let loadActor = function(event) {

    let actorConfig = actorConfigs[event.id]
    let actor = new GameActor(actorIndex, actorConfig, parsedEquipSlotData);
    actorIndex++;
   // actor.setStatusKey(ENUMS.ActorStatus.ACTOR_INDEX, actor.index);
    registerActor(actor);
    let statsData = statsConfig[actor.config['stats_id']];
//    console.log("Actor Stats :", statsData.status)

    let status = statsData.status;

    if (status) {
        for (let key in status) {
            actor.setStatusKey(key, status[key])
        }
    }

    let visualConfig = visualConfigs[actor.config['visual_id']];

    let visualPiece = new VisualGamePiece(visualConfig);
    actor.setVisualGamePiece(visualPiece);
    actor.setStatusKey(ENUMS.ActorStatus.CONFIG_ID, event.id)
    if (event.tile) {

        let onReady = function(readyActor) {
         //   console.log("On Ready: ", readyActor)
            let gameWalkGrid = readyActor.getGameWalkGrid()
            let activateEncounterGrid = GameAPI.call.getActiveEncounter();

            readyActor.setSpatialPosition(activateEncounterGrid.getPos());
            gameWalkGrid.setTargetPosition(event.tile.getPos())

            if (event.callback) {
                event.callback(readyActor);
            }
        }

        actor.activateGameActor(onReady);
        return;
    } else if (event.pos) {
        actor.setSpatialPosition(event.pos);
    } else {
     //   GameAPI.getGamePieceSystem().addActorToPlayerParty(actor);
     //   GameAPI.getGamePieceSystem().playerParty.selectPartyActor(actor)
    }

    if (event.callback) {
        event.callback(actor);
    }

}


let processConnectionMessage = function(event) {

    if (!GameAPI.getGamePieceSystem().getSelectedGameActor()) {
    //    return;
    }

    if (client.getStamp() === 0) {
        GuiAPI.screenText("No connection stamp yet", ENUMS.Message.HINT, 4)
        console.log("No connection stamp yet")
        return;
    }

    if (event.stamp === client.getStamp()) {
        console.log("Respond to Host", event)
        return;
    }

    if (!remoteClients[event.stamp]) {
        remoteClients[event.stamp] = new RemoteClient(event.stamp);
    } else {
        remoteClients[event.stamp].processClientMessage(event.msg);
    }

}


class GamePieceSystem {
    constructor() {

        this.playerActorId = -1;
        this.playerParty = new PlayerParty();
        this.selectedActor = null;

    }

    getActors() {
        return actors;
    }

    getItems() {
        return items;
    }

    detachRemoteByActor(actor) {
        let clientStamp = actor.getStatus(ENUMS.ActorStatus.CLIENT_STAMP);
        let remoteClients = getRemoteClients();
        let remoteClient = remoteClients[clientStamp];
        if (!remoteClient) {
            console.log("Remote Client Expected", clientStamp, remoteClients);
        } else {
            remoteClient.closeRemoteClient();
            remoteClients[clientStamp] = null;
        }
    }

    hideNonPartyActors() {
        for (let i = 0; i < actors.length; i++) {
            if (this.playerParty.isMember(actors[i])) {

            } else {
                this.detachRemoteByActor(actors[i]);
            }
        }
    }

    addLooseItem(item) {
        console.log("Add Loose Item ", item)
        item.hide()
        looseItems.push(item)
    }

    grabLooseItems(actor) {

        for (let i = 0; i < looseItems.length; i++) {
            let item = looseItems[i];
            let itemActorId = item.getStatus(ENUMS.ItemStatus.ACTOR_ID);
            if (actor.getStatus(ENUMS.ActorStatus.ACTOR_ID) === itemActorId) {
                looseItems.splice(i, 1);
                i--
                console.log("Grab Loose Item ", item)
                actor.equipItem(item);
            }

        }

    }

    initGamePieceSystem = function() {
        parsedEquipSlotData = new ConfigData("GAME", "EQUIP_SLOTS").parseConfigData()

        let statsData = function(data) {
            statsConfig = data;
        //    console.log("statsConfig", statsConfig)
        }

        configDataList("GAME","CHARACTER_STATS", statsData)

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

        evt.on(ENUMS.Event.ON_SOCKET_MESSAGE,  processConnectionMessage)

        let setActorStatus = function(values) {
            let actor = this.selectedActor;
            console.log("SET_ACTOR_STATUS", actor, values);
            for (let i = 0; i < values.length; i++) {
                let key = values[i].key;
                let status = values[i].status;
                console.log("SET_ACTOR_STATUS", actor, key, status);
                actor.setStatusKey(key, status);
            }

        }.bind(this)

        evt.on(ENUMS.Event.SET_ACTOR_STATUS, setActorStatus)
        trackDebugConfig('WORLD', 'actors', actors);
    }

    getPlayerParty() {
        return this.playerParty;
    }

    addActorToPlayerParty(actor) {
        this.playerParty.addPartyActor(actor);
    }

    listCombatActorOpponents(actor) {
        let alignment = actor.getStatus(ENUMS.ActorStatus.ALIGNMENT);

        MATH.emptyArray(opponentList);

        for (let i = 0; i < actors.length; i++) {
            let align =  actors[i].getStatus(ENUMS.ActorStatus.ALIGNMENT);
            if (align !== alignment) {
                opponentList.push(actors[i].id)
            }
        }
        return opponentList;
    }

    setSelectedGameActor = function(gameActor) {
    //    console.log("Set Selected Actor: ", gameActor);
        GuiAPI.screenText("PLAYER CONTROL "+gameActor.id,  ENUMS.Message.SYSTEM, 4)

        if (gameActor.getStatus(ENUMS.ActorStatus.HAS_POSITION) === true) {
            gameActor.getSpatialPosition(ThreeAPI.getCameraCursor().getCursorObj3d().position)
        } else {
            gameActor.setSpatialPosition(ThreeAPI.getCameraCursor().getCursorObj3d().position)
            gameActor.getGameWalkGrid().setGridMovementActor(gameActor)
        }

        gameActor.setStatusKey(ENUMS.ActorStatus.HAS_POSITION, true)
        evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'game_travel'})
        gameActor.call.setAsSelection();
        this.selectedActor = gameActor;
    }

    isPlayerPartyActor(actor) {
        return this.playerParty.isMember(actor);
    }

    getSelectedGameActor = function() {
        return this.selectedActor;
    }

}

export { GamePieceSystem }