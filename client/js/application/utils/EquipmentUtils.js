function getInvSlotIndex(invSlotId) {
    return invSlotId.split('_')[1];
}

function requestItemSlotChange(actor, item, toSlot) {
    let paperdollSlot = item.getEquipSlotId()
    let fromSlot = item.getStatus(ENUMS.ItemStatus.EQUIPPED_SLOT);
    let toInv = actor.actorInventory.isInventorySlot(toSlot)
    let toEquip = actor.actorEquipment.isEquipmentSlot(toSlot)
    let fromInv = actor.actorInventory.isInventorySlot(fromSlot)
    let fromEquip = actor.actorEquipment.isEquipmentSlot(fromSlot)

    let equipRequests = actor.getStatus(ENUMS.ActorStatus.EQUIP_REQUESTS);


    if (fromSlot === toSlot) {
        console.log("Drop on source", fromSlot, toSlot);
        return;
    }

    let uiState = "";

    if (toInv === true) {
        console.log("Drag to inventory slot", item, fromSlot, toSlot);
        uiState = ENUMS.UiStates.INVENTORY;
    } else if (toEquip === true) {
        console.log("Drag to equip slot", item, fromSlot, toSlot);
        uiState = ENUMS.UiStates.CHARACTER;
    }
    equipRequests.push(toSlot, item.getStatus(ENUMS.ItemStatus.TEMPLATE), item.id, uiState);

    console.log("Actor StatusMap EQUIP_REQUESTS", equipRequests)
}

export {
    requestItemSlotChange,
    getInvSlotIndex
}
