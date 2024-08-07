import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {getInvSlotIndex} from "../../../client/js/application/utils/EquipmentUtils.js";
import {getServerItemByItemId} from "./GameServerFunctions.js";

function equipActorItem(actor, serverItem, slotId) {
    let invItems = actor.getStatus(ENUMS.ActorStatus.INVENTORY_ITEMS);
    let currentItemId = actor.getStatus(ENUMS.ActorStatus[ENUMS.EquipmentSlots[slotId]])

    if (currentItemId !== "") {

        if (currentItemId === serverItem.id) {

        } else {
            console.log("Equip item on top of existing equipped item, switching...", currentItemId)
            actor.unequipItemBySlot(slotId)

            let switchItem = getServerItemByItemId(currentItemId);

            if (switchItem) {

                let switchFromSlot = switchItem.getStatus(ENUMS.ItemStatus.EQUIPPED_SLOT);
                if (typeof (switchFromSlot) === "string") {
                    addItemToInventory(actor, switchItem, serverItem.getStatus(ENUMS.ItemStatus.EQUIPPED_SLOT), true)
                } else {
                    console.log("There should be a slot id here... ", currentItemId);
                }

            } else {
                console.log("There should be an item here when switching", currentItemId);
            }

            serverItem.setStatusKey(ENUMS.ItemStatus.EQUIPPED_SLOT, slotId);
        }

    } else {
        let fromSlot = invItems.indexOf(serverItem.id);

        if (fromSlot === -1) {
            console.log("Equip item from non-inv source")
        } else {
            invItems[fromSlot] = "";
        }

        console.log("Equip item on empty slot...")
    }
    actor.equipServerItem(serverItem, slotId)
}

function unequipActorItem(actor, serverItem) {

}



function addItemToInventory(actor, serverItem, slotId, isASwitch) {
    let invItems = actor.getStatus(ENUMS.ActorStatus.INVENTORY_ITEMS);



    if (slotId !== "") {
        let slotIndex = getInvSlotIndex(ENUMS.InventorySlots[slotId]);
        let currentItemId = invItems[slotIndex];

        if (currentItemId === "") {


            if (isASwitch === true) {
                actor.unequipEquippedItem(serverItem, slotId)
            } else {
                let currentIndex = invItems.indexOf(serverItem.id)

                if (currentIndex !== -1) {
                    console.log("Move inv item into free inv slot");
                    invItems[currentIndex] = "";
                    serverItem.setStatusKey(ENUMS.ItemStatus.EQUIPPED_SLOT, slotId)
                } else {
                    console.log("Put item into free inv slot", slotId, serverItem.id);
                    actor.unequipEquippedItem(serverItem, slotId)
                };
            }

            invItems[slotIndex] = serverItem.id;
        } else if (currentItemId !== serverItem.id) {
            console.log("Put item on top of inv item", currentItemId);
            invItems[slotIndex] = serverItem.id;
            let currentItem = getServerItemByItemId(currentItemId);
            if (currentItem) {
                addItemToInventory(actor, currentItem, "")
                currentItem.dispatchItemStatus();
            } else {
                console.log("inv status id without item, clearing it")
            }
        } else if (currentItemId === serverItem.id) {
            console.log("Put item on top of itself, should not be possible")
        } else {
            console.log("This should never happen...")
        }

    } else { // determine slot here on the server...
        let invSlotIndex = actor.getFirstFreeInvSlotIndex();
        console.log("Put item into inventory", "SLOT_"+invSlotIndex, serverItem.id)
        addItemToInventory(actor, serverItem, "SLOT_"+invSlotIndex)

    }
}

function removeItemFromInventory(actor, serverItem) {

}

export {
    equipActorItem,
    unequipActorItem,
    addItemToInventory,
    removeItemFromInventory
}