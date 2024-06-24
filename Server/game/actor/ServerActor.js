import {Status} from "../status/Status.js";
import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {ServerActorMessageProcessor} from "./ServerActorMessageProcessor.js";
import {ServerActorPathWalker} from "./ServerActorPathWalker.js";
import {ServerActorTurnSequencer} from "./ServerActorTurnSequencer.js";
import {
    dispatchMessage,
    getGameServer,
    getGameServerWorld, getServerItemByItemId,
    registerGameServerUpdateCallback, registerServerItem,
    statusMapFromMsg, unregisterGameServerUpdateCallback
} from "../utils/GameServerFunctions.js";
import {TilePath} from "../../../client/js/game/piece_functions/TilePath.js";
import {Object3D} from "../../../client/libs/three/core/Object3D.js";
import {SimpleUpdateMessage} from "../utils/SimpleUpdateMessage.js";
import {ServerAction} from "../action/ServerAction.js";
import {ServerTransition} from "../encounter/movement/ServerTransition.js";
import {MATH} from "../../../client/js/application/MATH.js";
import {getInvSlotIndex} from "../../../client/js/application/utils/EquipmentUtils.js";
import {ServerItem} from "../item/ServerItem.js";


class ServerActor {
    constructor(id, statusValues) {
        this.obj3d = new Object3D();
        this.pos = this.obj3d.position;
        this.id = id;
        this.status = new Status(statusValues);

        this.equippedItems = [];
        this.serverActorStatusProcessor = new ServerActorMessageProcessor()
        this.serverActorPathWalker = new ServerActorPathWalker();
        this.turnSequencer = new ServerActorTurnSequencer()
        this.tilePath = new TilePath();
        this.simpleMessage = new SimpleUpdateMessage();
        this.serverAction = new ServerAction();
        this.serverTransition = new ServerTransition(this);

        this.sendFunction = null; // when in encounter use

        let selectServerActorActionId = function(trigger) {
            if (trigger === ENUMS.Trigger.ON_ACTIVATE) {
                let actions = this.getStatus(ENUMS.ActorStatus.ACTIONS)
                let actionKey = MATH.getRandomArrayEntry(actions);
                return actionKey;
            }

        }.bind(this);

        let encounter;

        let updateApplyActivePath = function(tpf) {
            let pathWalker = this.serverActorPathWalker;
            pathWalker.walkPath(this, tpf, encounter);
            if (this.tilePath.pathTiles.length === 0) {
                unregisterGameServerUpdateCallback(updateApplyActivePath);
            }
        }.bind(this);

        let activateEncounterPath = function(serverEncounter) {
            encounter = serverEncounter;
            registerGameServerUpdateCallback(updateApplyActivePath)
        }

        this.call = {
            selectServerActorActionId:selectServerActorActionId,
            activateEncounterPath:activateEncounterPath
        }

    }

    getStatus(key) {
        return this.status.getStatus(key);
    }

    setStatusKey(key, status) {
        return this.status.setStatusKey(key, status);
    }

    getStatusMap() {
        return this.status.statusMap;
    }


    rollInitiative() {
        this.turnSequencer.setGameActor(this);
        this.setStatusKey(ENUMS.ActorStatus.SEQUENCER_INITIATIVE, Math.random())
    }

    equipServerItem(serverItem) {
        if (this.equippedItems.indexOf(serverItem) === -1) {
            this.equippedItems.push(serverItem);
            serverItem.setStatusKey(ENUMS.ItemStatus.ACTOR_ID, this.status.getStatus(ENUMS.ActorStatus.ACTOR_ID))
            serverItem.setStatusKey(ENUMS.ItemStatus.ITEM_ID, serverItem.id)
            serverItem.setStatusKey(ENUMS.ItemStatus.EQUIPPED_SLOT, serverItem.slotId)
        //    console.log("Server Equip: to actor_id",serverItem.id, this.status.getStatus(ENUMS.ActorStatus.ACTOR_ID))
            this.setStatusKey(ENUMS.ActorStatus[serverItem.slotId], serverItem.id)
            console.log("Equip Slot", ENUMS.ActorStatus[serverItem.slotId], serverItem.id)
        } else {
            console.log("Item already equipped", serverItem, this)
        }
    }

    getEquippedItemByTemplate(templateId) {
        for (let i = 0; i < this.equippedItems.length; i++) {
            let eqItem = this.equippedItems[i];
            if (eqItem.getStatus(ENUMS.ItemStatus.TEMPLATE) === templateId) {
                return eqItem;
            }
        }
    }

    getEquippedItemBySlotId(slotId) {

        let itemId = this.getStatus(ENUMS.ActorStatus[slotId]);
        if (itemId !== "") {
            console.log("Get Slot Item ", itemId);
        }

        for (let i = 0; i < this.equippedItems.length; i++) {
            let eqItem = this.equippedItems[i];
            if (eqItem.getStatus(ENUMS.ItemStatus.EQUIPPED_SLOT) === slotId) {
                console.log("Got Item ", eqItem.getStatus(ENUMS.ItemStatus.ITEM_ID));
                return eqItem;
            }
        }

    }

    unequipEquippedItem(item) {
        MATH.splice(this.equippedItems, item);
        let slotKey = item.getStatus(ENUMS.ItemStatus.EQUIPPED_SLOT);
        let currentItemId = this.getStatus(ENUMS.ActorStatus[slotKey])
        if (currentItemId !== "") {
            console.log("Unequip from slot ", slotKey, currentItemId);
            this.setStatusKey(ENUMS.ActorStatus[slotKey], "");
        }
        item.setStatusKey(ENUMS.ItemStatus.EQUIPPED_SLOT, "")
    }

    unequipItemBySlot(slotId) {
        console.log("unequipItemBySlot server", slotId);
        let item = this.getEquippedItemBySlotId(slotId)
        if (item) {
            this.unequipEquippedItem(item)
        } else {
            console.log("Server slotId not Equipped, bad call", slotId);
        }
    }

    updateStatusFromMessage(msg) {
    //    console.log("Actor status message: ", [msg]);
        this.serverActorStatusProcessor.processServerActorStatusMessage(this.status, msg)
    }

    updateActionStatusFromMessage(msg) {
        console.log("Actor ACTION message: ", [msg]);
    }

    removeServerActor(serverEncounter) {
        let clientStamp = this.status.getStatus(ENUMS.ActorStatus.CLIENT_STAMP);
        this.status.setStatusKey(ENUMS.ActorStatus.ACTIVATION_STATE, ENUMS.ActivationState.DEACTIVATING)

        let message = {
            request:ENUMS.ClientRequests.APPLY_ACTOR_STATUS,
            command:ENUMS.ServerCommands.ACTOR_REMOVED,
            stamp:clientStamp,
            actorId:this.status.getStatus(ENUMS.ActorStatus.ACTOR_ID)
        }

        if (serverEncounter) {
            serverEncounter.call.messageParticipants(message)
        } else {
            dispatchMessage(message)
        }


        let activeEncounters = getGameServerWorld().getActiveEncoutners();

        for (let i = 0; i < activeEncounters.length; i++) {
            if (activeEncounters[i].hostStamp === clientStamp) {
                activeEncounters[i].handleHostActorRemoved()
            }
        }
    }

    buildServerActorStatusMessage(request, command) {

        let update = this.simpleMessage.call.buildMessage(ENUMS.ActorStatus.ACTOR_ID, this.getStatusMap(), request)

        if (update) {

            let sendStatus = update.status;

           console.log("buildServerActorStatusMessage update", update)

            let message = {
                request:request,
                command:command,
                status:statusMapFromMsg(sendStatus, {}),
                stamp:this.getStatus(ENUMS.ActorStatus.CLIENT_STAMP)
            }
            return message;
        } else {
            return false;
        }

    }

    getFirstFreeInvSlotIndex() {
        let invItems = this.getStatus(ENUMS.ActorStatus.INVENTORY_ITEMS);
        for (let i = 0; i < invItems.length; i++) {
            if (invItems[i] === "") {
                return i;
            }
        }
        console.log("Server inventory full... ouch")
    }

    applyActorEquipRequest(slotId, templateId, itemId, uiStateKey) {
        console.log("applyActorEquipRequest", slotId, templateId, itemId, uiStateKey)
        let invItems = this.getStatus(ENUMS.ActorStatus.INVENTORY_ITEMS);
        let serverItem = getServerItemByItemId(itemId);

        let isUpdate = true;

        if (!serverItem) {
            isUpdate = false;
            serverItem = new ServerItem(templateId, this.getStatus(ENUMS.ActorStatus.CLIENT_STAMP), slotId, itemId);
            registerServerItem(serverItem)
            serverItem.dispatchItemStatus(ENUMS.ClientRequests.LOAD_SERVER_ITEM, ENUMS.ServerCommands.ITEM_INIT)
        }

        serverItem.setStatusKey(ENUMS.ItemStatus.ACTOR_ID, this.getStatus(ENUMS.ActorStatus.ACTOR_ID));

        if (uiStateKey === ENUMS.UiStates.CHARACTER) {

            let currentItemId = this.getStatus(ENUMS.ActorStatus[ENUMS.EquipmentSlots[slotId]])

            if (currentItemId !== "") {
                console.log("Equip item on top of existing equipped item, switching...", currentItemId)
                this.unequipItemBySlot(slotId)
                let invSlotIndex = this.getFirstFreeInvSlotIndex();

                invItems[invSlotIndex] = itemId;
            } else {
                let fromSlot = invItems.indexOf(itemId);

                if (fromSlot === -1) {
                    console.log("Equip item from non-inv source")
                } else {
                    invItems[fromSlot] = "";
                }

                console.log("Equip item on empty slot...")
            }
            this.equipServerItem(serverItem)

        } else if (uiStateKey === ENUMS.UiStates.INVENTORY) {

            if (slotId !== "") {
                let slotIndex = getInvSlotIndex(ENUMS.InventorySlots[slotId]);
                let currentItemId = invItems[slotIndex];

                if (currentItemId === "") {

                    if (invItems.indexOf(itemId) !== -1) {
                        console.log("Move inv item into free inv slot");
                        invItems[invItems.indexOf(itemId)] = "";
                    } else {
                        let serverItem = getServerItemByItemId(itemId);
                        console.log("Put item into free inv slot", slotId, serverItem);
                        this.unequipEquippedItem(serverItem)
                    };

                    serverItem.setStatusKey(ENUMS.ItemStatus.EQUIPPED_SLOT, slotId)
                    invItems[slotIndex] = itemId;
                } else if (currentItemId !== itemId) {
                    console.log("Put item on top of inv item", currentItemId);
                } else if (currentItemId === itemId) {
                    console.log("Put item on top of itself, should not be happeningm")
                } else {
                    console.log("This should never happen...")
                }

            }

        } else {
            console.log("applyActorEquipRequest uiStateKey not yet supported", uiStateKey);
        }


        if (isUpdate === true) {
            serverItem.dispatchItemStatus(ENUMS.ClientRequests.APPLY_ITEM_STATUS, ENUMS.ServerCommands.ITEM_UPDATE)
        }


    }

    sendActorMessage() {
        if (typeof (this.sendFunction) === 'function') {
            this.sendFunction(this);
        }
    }

    messageClient(messageData) {
        let clientStamp = this.status.getStatus(ENUMS.ActorStatus.CLIENT_STAMP);
        getGameServer().messageClientByStamp(clientStamp, messageData);
    }

}

export {ServerActor}