import { ConfigData } from "../../application/utils/ConfigData.js";
import { ItemSlot } from "../gamepieces/ItemSlot.js";

class CharacterEquipment {
    constructor(gamePiece, equipSlotConfigId) {
        this.gamePiece = gamePiece;
        this.slots = new ConfigData("GAME", "EQUIP_SLOTS").parseConfigData()[equipSlotConfigId].data.slots;
        this.itemSlots = {};
        this.slotToJointMap = {};

        this.pieceAttacher = this.gamePiece.pieceAttacher;

        for (let i = 0; i < this.slots.length;i++) {
            let slotId = this.slots[i]['slot_id'];
            let jointKey = this.slots[i]['joint'];
            this.itemSlots[slotId] = new ItemSlot(slotId);
            let dynamicJoint = this.pieceAttacher.getAttachmentJoint(jointKey);

            if (jointKey !== 'SKIN') {
                let jointOffsets = this.pieceAttacher.getAttachmentJointOffsets(jointKey);
                dynamicJoint.callbacks.applyBoneMap(this.model().boneMap);
                dynamicJoint.applyJointOffsets(jointOffsets);
            }

            this.slotToJointMap[slotId] = dynamicJoint

        }

        this.pieces = [];
    }

    model() {
        return this.gamePiece.modelInstance;
    }

    getSlotForItemPiece = function(gamePiece) {
        return this.itemSlots[gamePiece.getEquipSlotId()];
    };

    getJointForItemPiece(gamePiece) {
        return this.slotToJointMap[gamePiece.getEquipSlotId()]
    }

    applyItemStatusModifiers(itemPiece, multiplier) {

        let levelTables = itemPiece.getStatusByKey('levelTables');
        for (let key in levelTables) {
            let value = itemPiece.getStatusByKey(key) * multiplier;
    //        console.log("Add equip mod ", key, value)
            this.gamePiece.applyEquipmentStatusModifier(key, value)
        }
    }


    characterEquipItem(itemPiece) {
        this.pieces.push(itemPiece)
        this.applyItemStatusModifiers(itemPiece, 1);
        itemPiece.setEquippedToPiece(this.gamePiece)

        let dynamicJoint = this.getJointForItemPiece(itemPiece);

        let itemSlot = this.getSlotForItemPiece(itemPiece);
    //    let slot = MATH.getFromArrayByKeyValue(this.slots, 'slot_id', slotId);

        let oldItem = itemSlot.removeSlotItemPiece();
        evt.dispatch(ENUMS.Event.UNEQUIP_ITEM, {item:oldItem, time:0.6});
        itemSlot.setSlotItemPiece(itemPiece);
        if (dynamicJoint.key === 'SKIN') {
            itemPiece.modelInstance.obj3d.frusumCulled = false;
            this.model().attachInstancedModel(itemPiece.modelInstance)
            ThreeAPI.registerPrerenderCallback(itemPiece.callbacks.tickPieceEquippedItem);

        } else {
            dynamicJoint.registerAttachedSpatial(itemPiece.getSpatial());
            ThreeAPI.registerPrerenderCallback(dynamicJoint.callbacks.updateAttachedSpatial);
        }

    };

    getItemByItemId(itemId) {
        if (!this.pieces.length) return;
        if (itemId === 'random') {
            return this.pieces[Math.floor(Math.random()*this.pieces.length)]
        } else {
            console.log("Figure this out...")
        }

    }

    detatchEquipItem = function(itemPiece) {
        this.applyItemStatusModifiers(itemPiece, -1);
        itemPiece.setEquippedToPiece(null)
        let dynamicJoint = this.getJointForItemPiece(itemPiece);
        let itemSlot = this.getSlotForItemPiece(itemPiece);
        itemSlot.setSlotItemPiece(null);
        let slotId = itemPiece.getEquipSlotId();
        let slot = MATH.getFromArrayByKeyValue(this.slots, 'slot_id', slotId);

        if (slot.joint === 'SKIN') {
            this.model().detatchInstancedModel(itemPiece.modelInstance);
            ThreeAPI.unregisterPrerenderCallback(itemPiece.callbacks.tickPieceEquippedItem);
        } else {
            dynamicJoint.detachAttachedEntity();
            ThreeAPI.unregisterPrerenderCallback(dynamicJoint.callbacks.updateAttachedSpatial);
        }

        return itemPiece;
    }

    takeEquippedItem(itemPiece) {
        if (typeof (itemPiece) === 'string') {
            itemPiece = this.getItemByItemId(itemPiece);
        }
        itemPiece = MATH.quickSplice(this.pieces ,itemPiece );

        if(itemPiece) {
            this.detatchEquipItem(itemPiece);
            GameAPI.addPieceToWorld(itemPiece);
        }
        return itemPiece
    }

    removeAllItems = function() {
        while (this.pieces.length) {
            let piece = this.detatchEquipItem(this.pieces.pop());
            piece.disbandGamePiece();
        }
    }

}

export { CharacterEquipment }