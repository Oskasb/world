import { ConfigData } from "../../application/utils/ConfigData.js";
import { ItemSlot } from "../gamepieces/ItemSlot.js";

class ActorEquipment {
    constructor() {
        this.items = [];
    }

    activateActorEquipment(actor, equipSlotConfigId) {
        this.actor = actor;
        this.slots = new ConfigData("GAME", "EQUIP_SLOTS").parseConfigData()[equipSlotConfigId].data.slots;
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

    getSlotForItemPiece = function(item) {
        return this.itemSlots[item.getEquipSlotId()];
    };

    getJointForItemPiece(item) {
        return this.slotToJointMap[item.getEquipSlotId()]
    }

    applyItemStatusModifiers(item, multiplier) {

        let levelTables = item.getStatusByKey('levelTables');
        for (let key in levelTables) {
            let value = item.getStatusByKey(key) * multiplier;
    //        console.log("Add equip mod ", key, value)
    //        this.gamePiece.applyEquipmentStatusModifier(key, value)
        }
    }

    characterEquipItem(item) {
        this.items.push(item)
        this.applyItemStatusModifiers(item, 1);
        item.setEquippedToPiece(this.gamePiece)

        let dynamicJoint = this.getJointForitem(item);

        let itemSlot = this.getSlotForitem(item);
    //    let slot = MATH.getFromArrayByKeyValue(this.slots, 'slot_id', slotId);

        let oldItem = itemSlot.removeSlotitem();
        evt.dispatch(ENUMS.Event.UNEQUIP_ITEM, {item:oldItem, time:0.6});
        itemSlot.setSlotitem(item);
        if (dynamicJoint.key === 'SKIN') {
            item.modelInstance.obj3d.frusumCulled = false;
            this.getModel().attachInstancedModel(item.modelInstance)
            ThreeAPI.registerPrerenderCallback(item.callbacks.tickPieceEquippedItem);

        } else {
            dynamicJoint.registerAttachedSpatial(item.getSpatial());
            ThreeAPI.registerPrerenderCallback(dynamicJoint.callbacks.updateAttachedSpatial);
        }

    };

    getItemByItemId(itemId) {
        if (!this.items.length) return;
        if (itemId === 'random') {
            return this.items[Math.floor(Math.random()*this.items.length)]
        } else {
            console.log("Figure this out...")
        }

    }

    detatchEquipItem = function(item) {
        this.applyItemStatusModifiers(item, -1);
        item.setEquippedToPiece(null)
        let dynamicJoint = this.getJointForItemPiece(item);
        let itemSlot = this.getSlotForItemPiece(item);
        itemSlot.setSlotItemPiece(null);
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

    removeAllItems = function() {
        while (this.items.length) {
            let item = this.detatchEquipItem(this.items.pop());
            item.disbandGamePiece();
        }
    }

}

export { ActorEquipment }