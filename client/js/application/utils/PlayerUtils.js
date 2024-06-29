import {db, getLocalAccount, loadActorStatus, loadItemStatus, loadPlayerStatus} from "../setup/Database.js";
import {ENUMS} from "../ENUMS.js";
import {evt} from "../event/evt.js";
import {notifyCameraStatus} from "../../3d/camera/CameraFunctions.js";
import {clearActorEncounterStatus, getPlayerStatus, setPlayerStatus} from "./StatusUtils.js";
import {requestItemSlotChange} from "./EquipmentUtils.js";

function loadStoredPlayer(dataList) {
    let account = getLocalAccount();
    let id = null;
    if (account !== null) {
        id = account[ENUMS.PlayerStatus.PLAYER_ID];
    }

    if (id) {
        dataList[ENUMS.PlayerStatus.PLAYER_ID] = id;
        let playerStatus = loadPlayerStatus(id);
        if (playerStatus !== null) {
            dataList[ENUMS.PlayerStatus.PLAYER_NAME] = playerStatus[ENUMS.PlayerStatus.PLAYER_NAME];
            let actorId = playerStatus[ENUMS.PlayerStatus.ACTIVE_ACTOR_ID];
            dataList[ENUMS.ActorStatus.ACTOR_ID] = actorId;
            if (actorId) {
                let actorStatus = loadActorStatus(actorId);
                if (actorStatus !== null) {
                    dataList['CLIENT_STAMP'] = client.getStamp();
                    actorStatus[ENUMS.ActorStatus.EQUIPPED_ITEMS] = [];
                    actorStatus[ENUMS.ActorStatus.EQUIP_REQUESTS] = [];
                    dataList['ACTOR_STAMP'] = actorStatus[ENUMS.ActorStatus.CLIENT_STAMP]
                    dataList[ENUMS.ActorStatus.CONFIG_ID] = actorStatus[ENUMS.ActorStatus.CONFIG_ID];
                }
            }
        }
    }
}

let slots = [
      'SLOT_HEAD',
      'SLOT_BODY',
      'SLOT_CHEST',
      'SLOT_WRIST',
      'SLOT_HANDS',
      'SLOT_WAIST',
      'SLOT_LEGS',
      'SLOT_SKIRT',
      'SLOT_FEET',
      'SLOT_HAND_R',
      'SLOT_HAND_L',
      'SLOT_BACK',
      'SLOT_WRIST_L',
      'SLOT_WRIST_R'
]

let loadedItems = [];

function itemLoaded(item) {
    let itemStatus = loadItemStatus(item.getStatus(ENUMS.ItemStatus.ITEM_ID));
    for (let key in itemStatus) {
        item.setStatusKey(key, itemStatus[key]);
    }
    let slot = item.getStatus(ENUMS.ItemStatus.EQUIPPED_SLOT);
    console.log("Saved Item Loaded ", slot, item.getStatus(ENUMS.ItemStatus.ITEM_ID), item.getStatus());
    loadedItems.push(item);
}
function loadStoredItemId(itemId, cb) {

    let itemStatus = loadItemStatus(itemId);
    if (itemStatus === null) {
        console.log("Item load request failed", itemId)
        return;
    }

    evt.dispatch(ENUMS.Event.LOAD_ITEM,  {id: itemStatus[ENUMS.ItemStatus.TEMPLATE], itemId:itemStatus[ENUMS.ItemStatus.ITEM_ID], callback:itemLoaded})
}

function getItemStatuses(statusMap) {

    for (let i = 0; i < slots.length; i++) {
        if (statusMap[slots[i]] !== "") {
            console.log("Load to Equip Slot ", statusMap[slots[i]])
            loadStoredItemId(statusMap[slots[i]])
        }
    }

    let invItems = statusMap[ENUMS.ActorStatus.INVENTORY_ITEMS];

    for (let i = 0; i < invItems.length; i++) {
        if (invItems[i] !== "") {
            console.log("Load to INVENTORY Slot ", invItems[i])
            loadStoredItemId(invItems[i])
        }
    }

}

function loadPlayerStashItems() {

    for (let key in ENUMS.PlayerStatus) {
        let status = getPlayerStatus([key])
        if (typeof (status) === 'object') {
            if(status.length > 0) {
                if (db.items[status[0]]) {
                    for (let i = 0; i <status.length; i++ ) {
                        loadStoredItemId(status[i])
                    }
                }
            }
        }
    }
}

function initLoadedPlayerState(dataList, readyCB) {
    ThreeAPI.getCameraCursor().setZoomDistance(5)
    notifyCameraStatus(ENUMS.CameraStatus.CAMERA_MODE, ENUMS.CameraControls.CAM_AUTO, true)
    notifyCameraStatus(ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, true)
    notifyCameraStatus(ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, true)

    let playerId = dataList[ENUMS.PlayerStatus.PLAYER_ID];
    let actorId = dataList[ENUMS.ActorStatus.ACTOR_ID] ;
    let playerStatus = loadPlayerStatus(playerId);

    for (let key in playerStatus) {
        setPlayerStatus(key, playerStatus[key]);
    }

    let actorStatus = loadActorStatus(actorId);
    let pos = ThreeAPI.getCameraCursor().getPos()
    pos.set(
        actorStatus[ENUMS.ActorStatus.POS_X],
        actorStatus[ENUMS.ActorStatus.POS_Y],
        actorStatus[ENUMS.ActorStatus.POS_Z],
    )
    ThreeAPI.getCameraCursor().getLookAroundPoint().copy(pos);


    function actorReady(actor) {
        console.log("loaded actor ready", actor);
        actor.call.activateActionKey("ACTION_TRAVEL_WALK", ENUMS.ActorStatus.TRAVEL)

        clearActorEncounterStatus(actor)
        actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_INACTIVE)
        let statusMap = JSON.parse(JSON.stringify(actor.getStatus()));
        actor.removeGameActor()
        setTimeout(function() {
            evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, {request:ENUMS.ClientRequests.LOAD_SERVER_ACTOR, status:statusMap})
        }, 500)
        readyCB(loadedItems);
    }

    function actorLoaded(actor) {
        console.log("init player with loaded actor", actor);
        actor.setStatusKey(ENUMS.ActorStatus.IN_COMBAT, false);
        actor.setStatusKey(ENUMS.ActorStatus.IS_ACTIVE, 0);
        actor.activateGameActor(actorReady);

    }

    getItemStatuses(actorStatus);
    loadPlayerStashItems()
    evt.dispatch(ENUMS.Event.LOAD_ACTOR, {status: actorStatus, callback:actorLoaded});
    GameAPI.getGamePieceSystem().playerActorId = actorStatus[ENUMS.ActorStatus.ACTOR_ID];

}

export {
    loadStoredPlayer,
    initLoadedPlayerState
}