import { ItemSlot } from "../gamepieces/ItemSlot.js";
import {ENUMS} from "../../application/ENUMS.js";
import {saveItemStatus} from "../../application/setup/Database.js";
import {isDev} from "../../application/utils/DebugUtils.js";
import {poolReturn} from "../../application/utils/PoolUtils.js";

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

        //    let slotId = item.getEquipSlotId();
        //    console.log("Equip Actor Item ", item, slotId)
        //    item.setStatusKey(ENUMS.ItemStatus.EQUIPPED_SLOT, slotId);
        //    this.actor.setStatusKey(ENUMS.ActorStatus[slotId], item.getStatus(ENUMS.ItemStatus.ITEM_ID));
            itemSlot.setSlotItem(item);

        }.bind(this);


        let unequipActorItem = function(item, passive) {
            console.log("UnEquip Actor Item ", item)

            if (item.visualItem !== null) {
                if (item.visualItem.item !== null) {
                    item.visualItem.call.requestDeactivation();
                    poolReturn(item.visualItem);
                }
            }

            if (this.items.indexOf(item) !== -1) {
                MATH.splice(this.items, item);
            } else {
                console.log("item already unequiped", item);
                return;
            }

            updateAddModifiers(this.items)

            let itemSlot = this.getSlotForItem(item);
            if (itemSlot.item === item) {
                itemSlot.setSlotItem(null);
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


        let localState = {};
        for (let key in ENUMS.EquipmentSlots) {
            localState[ENUMS.EquipmentSlots[key]] = "";
        }


        let updateSlotStatus = function(slotKey) {
            let slotStatus = this.actor.getStatus(slotKey);
            let localId = localState[slotKey]
            if (localId !== slotStatus) {
                if (localId !== "") {
                    console.log("Unequip Client Item", localId);
                    let item = GameAPI.getItemById(localId);
                    if (item !== null) {
                        unequipActorItem(item);
                    }
                }

                if (slotStatus !== "") {
                //    console.log("Equip Client Item", slotStatus);
                    let item = GameAPI.getItemById(slotStatus);
                    if (item !== null) {
                        equipActorItem(item);
                    }
                }
                localState[slotKey] = slotStatus;
            }
        }.bind(this);

        function synchEquipment() {
            for (let key in ENUMS.EquipmentSlots) {
                updateSlotStatus(key)
            }
        }

        let activateLoadedStatus = function() {
            console.log("activateLoadedStatus equipment");
            for (let key in ENUMS.EquipmentSlots) {

                let slotId = ENUMS.EquipmentSlots[key]
                let slotItemId = this.actor.getStatus(ENUMS.ActorStatus[slotId])
                console.log("activateLoadedStatus item: ", slotId, slotItemId);
                if (slotItemId !== "") {
                    let item = GameAPI.getItemById(slotItemId);
                    console.log("activateLoadedStatus item: ", item);
                    equipActorItem(item);
                }
            }
        }.bind(this);


        this.call = {
            equipActorItem:equipActorItem,
            unequipActorItem:unequipActorItem,
            showEquipment:showEquipment,
            hideEquipment:hideEquipment,
            getEquipmentStatusKey:getEquipmentStatusKey,
            synchEquipment:synchEquipment,
            activateLoadedStatus:activateLoadedStatus
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

    isEquipmentSlot(slotId) {
        if (typeof (this.itemSlots[slotId]) === 'object') {
            return true;
        } else {
            return false;
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


    getEquippedItems(store) {

        for (let key in this.itemSlots) {

            let itemId = this.actor.getStatus(ENUMS.ActorStatus[key])
            if (itemId !== "") {
                let item = GameAPI.getItemById(itemId);
                if (item !== null) {
                    store.push(item)
                }
            }
        }
    }

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