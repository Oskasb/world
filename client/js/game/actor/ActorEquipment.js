import { ConfigData } from "../../application/utils/ConfigData.js";
import { ItemSlot } from "../gamepieces/ItemSlot.js";

let parsedConfigData;

class ActorEquipment {
    constructor(parsedEquipSlotData) {
        this.items = [];

        if (!parsedConfigData) {
            parsedConfigData = parsedEquipSlotData;
        }

        let equipmentAddModifiers = [];

        let updateAddModifiers = function(items) {
            MATH.emptyArray(equipmentAddModifiers)
                for (let i = 0; i < items.length; i++) {
                    let addModifiers = items[i].call.getAddModifiers();
                    for (let key in addModifiers) {
                        equipmentAddModifiers.push(addModifiers)
                    }
                }
        //        console.log("Add modifiers:", equipmentAddModifiers)
        }


        function getUpdateCallback(item, dynJoint) {
            if (dynJoint.key === 'SKIN') {
                return item.callbacks.tickPieceEquippedItem;
            } else {
                return dynJoint.callbacks.updateAttachedSpatial;
            }
        }


        let equipActorItem = function(item) {
        //    console.log("EQUIP ITEM: ", item)
            this.items.push(item)
            //    this.applyItemStatusModifiers(item, 1);
            //    item.setEquippedToPiece(this.gamePiece)
            updateAddModifiers(this.items)

            let itemSlot = this.getSlotForItem(item);
            let dynamicJoint = this.getJointForItemSlot(itemSlot);
            let slotId = item.getEquipSlotId();
        //    let slot = MATH.getFromArrayByKeyValue(this.slots, 'slot_id', slotId);

            //        let oldItem = itemSlot.removeSlotitem();
            //    evt.dispatch(ENUMS.Event.UNEQUIP_ITEM, {item:oldItem, time:0.6});
            itemSlot.setSlotItem(item);
            if (dynamicJoint.key === 'SKIN') {
                item.modelInstance.obj3d.frusumCulled = false;
                this.getModel().attachInstancedModel(item.modelInstance)
            } else {
                dynamicJoint.registerAttachedSpatial(item.getSpatial());
            }
            item.call.setUpdateCallback(getUpdateCallback(item, dynamicJoint))
            item.show();
        }.bind(this);


        let unequipActorItem = function(item) {
            if (this.items.indexOf(item) !== -1) {
                MATH.splice(this.items, item);
            }

            updateAddModifiers(this.items)

            let itemSlot = this.getSlotForItem(item);
            let dynamicJoint = this.getJointForItemSlot(itemSlot);
            let slotId = item.getEquipSlotId();
            itemSlot.setSlotItem(null);
            if (dynamicJoint.key === 'SKIN') {
                this.getModel().detatchInstancedModel(item.modelInstance)
            } else {
                dynamicJoint.detachAttachedEntity(item.getSpatial());
            }
            item.hide();
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

        let showEquipment = function() {
            for (let i = 0; i < this.items.length; i++) {
            //    console.log("Show item: ", i)
                this.items[i].show()
            }
        }.bind(this)

        let hideEquipment = function() {
            for (let i = 0; i < this.items.length; i++) {
             //   console.log("Hide item: ", i, this.items)
                this.items[i].hide()
            }
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

        this.pieceAttacher = this.actor.getVisualGamePiece().pieceAttacher;

        for (let i = 0; i < this.slots.length;i++) {
            let slotId = this.slots[i]['slot_id'];
            let jointKey = this.slots[i]['joint'];
            this.itemSlots[slotId] = new ItemSlot(slotId);
            let dynamicJoint = this.pieceAttacher.getAttachmentJoint(jointKey);

            if (jointKey !== 'SKIN') {
                let jointOffsets = this.pieceAttacher.getAttachmentJointOffsets(jointKey);
                dynamicJoint.callbacks.applyBoneMap(this.getModel().boneMap);
                dynamicJoint.applyJointOffsets(jointOffsets);
            }

            this.slotToJointMap[slotId] = dynamicJoint

        }
    }



    getModel() {
        return this.actor.getVisualGamePiece().getModel();
    }

    getSlotForItem(item) {
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
            let item = this.items.pop();
            this.call.unequipActorItem(item);
            item.disposeItem()
        }
    }

}

export { ActorEquipment }