import { ItemSlot } from "../gamepieces/ItemSlot.js";
import {ENUMS} from "../../application/ENUMS.js";
import {saveItemStatus} from "../../application/setup/Database.js";
import {isDev} from "../../application/utils/DebugUtils.js";

let parsedConfigData;


function getItemFromListById(items, itemId) {
    for (let i = 0; i < items.length; i++) {
        if (items[i].id === itemId) {
            return items[i];
        }
    }
}

class ActorEquipment {
    constructor(parsedEquipSlotData) {
        this.items = [];
        let hidden = null;
        if (!parsedConfigData) {
            parsedConfigData = parsedEquipSlotData;
        }

        let equipmentAddModifiers = [];

        let updateAddModifiers = function(items) {
            MATH.emptyArray(equipmentAddModifiers)
                for (let i = 0; i < items.length; i++) {
                    let addModifiers = items[i].call.getAddModifiers();
                    for (let key in addModifiers) {
                        let modifier = {};
                        modifier[key] = addModifiers[key];
                        equipmentAddModifiers.push(modifier)
                    //    console.log("addModifiers: ", key, addModifiers)
                    }
                }
            //    console.log("Equipmen Mods: ", equipmentAddModifiers)
        }



        let equipActorItem = function(item) {

        //    console.log("EQUIP ITEM: ", item)
            let itemSlot = this.getSlotForItem(item);
            if (!itemSlot) {
                console.log("No slot found... ", item)
                return;
            }

            if (this.items.indexOf(item) !== -1) {
            //    console.log("Item already equipped, boo", item);
                return;
            } else {
                this.items.push(item)
            }

            updateAddModifiers(this.items)

            let slotId = item.getEquipSlotId();
        //    console.log("Equip Actor Item ", item, slotId)
            item.setStatusKey(ENUMS.ItemStatus.EQUIPPED_SLOT, slotId);
            this.actor.setStatusKey(ENUMS.ActorStatus[slotId], item.getStatus(ENUMS.ItemStatus.ITEM_ID));

            if (this.actor.isPlayerActor()) {
                saveItemStatus(item.getStatus())
            }

            itemSlot.setSlotItem(item);

        }.bind(this);


        let unequipActorItem = function(item, passive) {
        //    console.log("UnEquip Actor Item ", item)
            if (this.items.indexOf(item) !== -1) {
                MATH.splice(this.items, item);
            } else {
                console.log("item already unequiped", item);
                return;
            }

            updateAddModifiers(this.items)

            let itemSlot = this.getSlotForItem(item);
            let slotId = item.getEquipSlotId();
            itemSlot.setSlotItem(null);

            let currentSlotStatus = this.actor.getStatus(ENUMS.ActorStatus[slotId]);

            if (currentSlotStatus === item.getStatus(ENUMS.ItemStatus.ITEM_ID)) {
        //        console.log("Unequip currently equipped itemId", slotId)
                this.actor.setStatusKey(ENUMS.ActorStatus[slotId], "")
            }

            if (passive !== true) {

                let requests = this.actor.getStatus(ENUMS.ActorStatus.EQUIP_REQUESTS)

            //    if (requests.indexOf(slotId) === -1) {
                    requests.push(slotId);
                    requests.push("");
                    this.actor.setStatusKey(ENUMS.ActorStatus.EQUIP_REQUESTS, requests);
           //     }
                MATH.splice(this.actor.getStatus(ENUMS.ActorStatus.EQUIPPED_ITEMS), item.getStatus(ENUMS.ItemStatus.TEMPLATE));
            } else {

            }

        }.bind(this)

        let getEquipmentStatusKey = function(key, store) {
            for (let i = 0; i < equipmentAddModifiers.length; i++) {
                let mod = equipmentAddModifiers[i];
                if (mod[key]) {
                    for (let j = 0; j < mod[key].length; j++) {
                        store.push(mod[key][j]);
                    }
                }
            }
        }

        let readyQueue = [];

        let itemReadyCb = function(item) {
            MATH.splice(readyQueue, item);

            if (readyQueue.length === 1) {
                readyQueue.pop()()
            }

        }


        let showEquipment = function(onReady) {
            if (hidden !== false) {
                readyQueue.push(onReady)
                for (let i = 0; i < this.items.length; i++) {
                    console.log("Show item: ", i)
                    readyQueue.push(this.items[i])
                    this.items[i].show(itemReadyCb)
                }
                if (readyQueue.length === 1) {
                    readyQueue.pop()()
                }
            }
            hidden = false;

        }.bind(this)

        let hideEquipment = function() {
            if (hidden !== true) {
                for (let i = 0; i < this.items.length; i++) {
                    //   console.log("Hide item: ", i, this.items)
                    this.items[i].hide()
                }
            }
            hidden = true;
        }.bind(this)

        this.call = {
            equipActorItem:equipActorItem,
            unequipActorItem:unequipActorItem,
            showEquipment:showEquipment,
            hideEquipment:hideEquipment,
            getEquipmentStatusKey:getEquipmentStatusKey
        }

    }

    activateActorEquipment(actor, equipSlotConfigId) {
        this.actor = actor;
        this.slots = parsedConfigData[equipSlotConfigId].data.slots;
        this.itemSlots = {};
        this.slotToJointMap = {};

        for (let i = 0; i < this.slots.length;i++) {
            let slotId = this.slots[i]['slot_id'];
            this.itemSlots[slotId] = new ItemSlot();
            this.itemSlots[slotId].setSlotId(slotId)
        }
    }



    getEquippedItemBySlotId(slotId) {

        let itemId = this.actor.getStatus(ENUMS.ActorStatus[slotId]);

        if (itemId !== '') {
            let item = getItemFromListById(this.items, itemId);

            if (!item) {
                if (isDev()) {
                    console.log("No such item here:", itemId, this.items);
                }
                return null;
            }
            return item;
        } else {
            return null;
        }

        for (let i = 0; i < this.items.length; i++) {
            let itemSlotId = this.items[i].getEquipSlotId();
            if (itemSlotId === slotId) {
                return this.items[i];
            }
        }
    //    console.log("Item not equipped here.. ", slotId)
        return null;
    }


    getModel() {
        return this.actor.getVisualGamePiece().getModel();
    }

    getSlotForItem(item) {
        if (!this.itemSlots) {
            console.log("No slots yet? ", this)
            return;
        }

        return this.itemSlots[item.getEquipSlotId()];
    };

    getJointForItemSlot(itemSlot) {
        return this.slotToJointMap[itemSlot.slotId]
    }

    applyItemStatusModifiers(item, multiplier) {

        let levelTables = item.getStatusByKey('levelTables');
        for (let key in levelTables) {
    //        let value = item.getStatusByKey(key) * multiplier;
    //        console.log("Add equip mod ", key, value)
    //        this.gamePiece.applyEquipmentStatusModifier(key, value)
        }
    }


    getItemByItemId(itemId) {
        if (!this.items.length) return;
        if (itemId === 'random') {
            return this.items[Math.floor(Math.random()*this.items.length)]
        } else {
            console.log("Figure this out...")
        }

    }

    detatchEquipItem(item) {
    //    this.applyItemStatusModifiers(item, -1);
    //    item.setEquippedToPiece(null)
        let itemSlot = this.getSlotForitem(item);
        let dynamicJoint = this.getJointForItemSlot(itemSlot);
        itemSlot.setSlotItem(null);
        let slotId = item.getEquipSlotId();
        let slot = MATH.getFromArrayByKeyValue(this.slots, 'slot_id', slotId);

        if (slot.joint === 'SKIN') {
            this.getModel().detatchInstancedModel(item.getModel());
            ThreeAPI.unregisterPrerenderCallback(item.callbacks.tickPieceEquippedItem);
        } else {
            dynamicJoint.detachAttachedEntity();
            ThreeAPI.unregisterPrerenderCallback(dynamicJoint.callbacks.updateAttachedSpatial);
        }

        return item;
    }

    takeEquippedItem(item) {
        if (typeof (item) === 'string') {
            item = this.getItemByItemId(item);
        }
        item = MATH.splice(this.items ,item );

        if(item) {
            this.detatchEquipItem(item);
            GameAPI.addPieceToWorld(item);
        }
        return item
    }

    removeAllItems() {
        while (this.items.length) {
            let item = this.items[0];
            this.call.unequipActorItem(item);
            item.disposeItem()
        }
    }

}

export { ActorEquipment }