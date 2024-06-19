import {getLocalAccount, loadActorStatus, loadItemStatus, loadPlayerStatus} from "../setup/Database.js";
import {ENUMS} from "../ENUMS.js";
import {evt} from "../event/evt.js";
import {notifyCameraStatus} from "../../3d/camera/CameraFunctions.js";
import {setPlayerStatus} from "./StatusUtils.js";

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
                //    actorStatus[ENUMS.ActorStatus.CLIENT_STAMP] = client.getStamp();
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
      'SLOT_WRIST_R']
function itemLoaded(item) {
    let slot = item.getEquipSlotId()
    console.log("Saved Item Loaded ", slot, item);
}
function loadStoredItemId(itemId, cb) {

    let itemStatus = loadItemStatus(itemId);
    if (itemStatus === null) {
        console.log("Item load request failed", itemId)
        return;
    }

    evt.dispatch(ENUMS.Event.LOAD_ITEM,  {id: itemStatus[ENUMS.ItemStatus.TEMPLATE], itemId:itemStatus[ENUMS.ItemStatus.ITEM_ID], callback:itemLoaded})

}

function getEquippedItemStatuses(statusMap, itemsLoadedCB) {
    let list = {};
    for (let i = 0; i < slots.length; i++) {
        if (statusMap[slots[i]] !== "") {
            loadStoredItemId(statusMap[slots[i]])
        }
    }

    let invItems = statusMap[ENUMS.ActorStatus.INVENTORY_ITEMS];

    for (let i = 0; i < invItems.length; i++) {
        if (invItems[i] !== "") {
            loadStoredItemId(invItems[i])
        }
    }

    return list;
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
        actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_INACTIVE)
        setTimeout(function() {
            evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, {request:ENUMS.ClientRequests.LOAD_SERVER_ACTOR, status:actor.getStatus()})
            readyCB();
        }, 200)
        actor.removeGameActor()
    }

    function actorLoaded(actor) {
        console.log("init player with loaded actor", actor);
        actor.setStatusKey(ENUMS.ActorStatus.IN_COMBAT, false);
        actor.setStatusKey(ENUMS.ActorStatus.IS_ACTIVE, 0);
        actor.activateGameActor(actorReady);
    }


    let equippedItems = getEquippedItemStatuses(actorStatus);

    console.log("equippedItems :", equippedItems);

    evt.dispatch(ENUMS.Event.LOAD_ACTOR, {status: actorStatus, callback:actorLoaded});
    GameAPI.getGamePieceSystem().playerActorId = actorStatus[ENUMS.ActorStatus.ACTOR_ID];

}

export {
    loadStoredPlayer,
    initLoadedPlayerState
}