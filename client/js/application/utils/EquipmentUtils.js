

function requestItemSlotChange(actor, item, toSlot) {
    let paperdollSlot = item.getEquipSlotId()
    let fromSlot = item.getStatus(ENUMS.ItemStatus.EQUIPPED_SLOT);
    let toInv = actor.actorInventory.isInventorySlot(toSlot)
    let toEquip = actor.actorEquipment.isEquipmentSlot(toSlot)
    let fromInv = actor.actorInventory.isInventorySlot(fromSlot)
    let fromEquip = actor.actorEquipment.isEquipmentSlot(fromSlot)


    if (fromInv === true) {

        if (toInv === true) {
            console.log("Drag between inventory slots", item, fromSlot, toSlot);

            let invItem = actor.actorInventory.getItemAtSlot(toSlot);
            actor.actorInventory.addInventoryItem(item, toSlot, null);
            actor.actorInventory.addInventoryItem(null, fromSlot, null);
            if (invItem !== null) {
                actor.actorInventory.addInventoryItem(invItem, fromSlot, null);
            }

        } else if (toEquip === true) {

            console.log("Drag from inventory to equip", item, fromSlot, toSlot);
            let switchItem = actor.actorEquipment.getEquippedItemBySlotId(toSlot);
        //    console.log("Drag to paperdoll", item, fromSlot, toSlot);

            actor.equipItem(item);
            if (switchItem !== null) {
                actor.actorInventory.addInventoryItem(switchItem, fromSlot, null);
            }

        }

    } else if (fromEquip === true) {
        console.log("Drag from paperdoll", item, fromSlot, toSlot);
        actor.actorEquipment.call.unequipActorItem(item);
        actor.actorInventory.addInventoryItem(item, toSlot, null);
        if (toInv === true) {
            console.log("Drag from equipped to inv", item, fromSlot, toSlot);
            let invItem = actor.actorInventory.getItemAtSlot(toSlot);
            if (invItem !== null) {
                let switchedSlotId = invItem.getEquipSlotId();
                if (switchedSlotId === fromSlot) {
                    actor.equipItem(invItem);
                } else {
                    let moveToSlot = actor.actorInventory.getFirstEmptySlotKey();

                    if (typeof (moveToSlot) === 'string') {
                        actor.actorInventory.addInventoryItem(item, moveToSlot, null);

                    } else {
                        console.log("Inventory overflow, ADD TO STASH HERE...", invItem);
                    }
                }
            }
            console.log("Post UnEquip process ", actor.actorStatus.statusMap);
        } else if (toEquip === true) {
            console.log("Not a thing - Drag from equipped to equipped", item, fromSlot, toSlot);
        }

    } else {
        console.log("Item from unsupported slotid", fromSlot, item)
    }



}

export {
    requestItemSlotChange
}
