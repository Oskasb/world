import {ItemSlot} from "../gamepieces/ItemSlot.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";

class VisualEquipment {
    constructor() {

        let visualActor;
        let actor;
        let actorEquipment;
        let pieceAttacher;
        let slotToJointMap = {};
        let slots;
        let itemSlots;

        let activeSlots = [];
        let visualItems = [];
        let visualizedSlots = []
        let clearSlots = [];


        function getVisualItemBySlot(slotId) {
            for (let i = 0; i < visualItems.length; i++) {
                if (slotId === vItem.getSlotId()) {
                    return vItem;
                }
            }
            return null;
        }

        function getJointForItemSlot(itemSlot) {
            return slotToJointMap[itemSlot.slotId]
        }


        function getUpdateCallback(item, dynJoint) {
            if (dynJoint.key === 'SKIN') {

                let tickPieceEquippedItem = function() {
                    if (item.getSpatial().obj3d.parent) {
                        item.getSpatial().stickToObj3D(actor.actorObj3d)
                        item.getSpatial().obj3d.updateMatrixWorld();
                    } else {
                        console.log("Equipment init not right")
                    }
                }.bind(this)

                return tickPieceEquippedItem;
            } else {
                return dynJoint.callbacks.updateAttachedSpatial;
            }
        }

        function attachEquippedItem(item, itemSlot) {
            let dynamicJoint = getJointForItemSlot(itemSlot);
            if (dynamicJoint.key === 'SKIN') {

                item.visualGamePiece.obj3d.frusumCulled = false;
                let itemInstance = item.visualGamePiece.call.getInstance()
                let modelClone = item.visualGamePiece.getModel().obj3d.children[0]
                let originalMaterial =  item.visualGamePiece.getModel().originalModel.material.mat
                //    console.log("skinned mesh clone:", itemInstance, modelClone, originalMaterial);
                itemInstance.applyModelMaterial(modelClone, originalMaterial)
                this.getModel().attachInstancedModel(itemInstance)
            } else {
                dynamicJoint.registerAttachedSpatial(item.getSpatial());
            }

        }

        function update() {
            MATH.emptyArray(activeSlots);

            for (let key in itemSlots) {
                let slot = itemSlots[key];
                let item = slot.getSlotItem();
                if (item !== null) {
                    if (activeSlots.indexOf(key) === -1) {
                        activeSlots.push(key);
                    }
                }
            }

                for (let i = 0; i < visualizedSlots.length; i++) {
                    let key = visualizedSlots[i];
                    if (activeSlots.indexOf(key) === -1) {
                        clearSlots.push(key);
                    }
                }

            for (let i = 0; i < clearSlots.length; i++) {
                let key = clearSlots[i];

                let vItem = getVisualItemBySlot(key);
                if (vItem === null) {
                    console.log("There should be an item here")
                } else {
                    MATH.splice(visualizedSlots, key);
                    vItem.deactivateVisualItem();
                    poolReturn(vItem);
                }
            }

            while (activeSlots.length > visualItems.length) {
                for (let i = 0; i < activeSlots.length; i++) {

                    let key = activeSlots[i];
                    let vItem = getVisualItemBySlot(key);

                    if (vItem === null) {
                        visualizedSlots.push(key);
                        let slot = itemSlots[key];
                        let item = slot.getSlotItem();
                        let dynamicJoint = getJointForItemSlot(slot);
                        let updateCB = getUpdateCallback(item, dynamicJoint)
                        vItem = poolFetch('VisualItem');
                        vItem.setItem(item);
                        vItem.setUpdateCallback(updateCB);
                        visualItems.push(vItem);

                        attachEquippedItem(item, slot);
                    }
                }
            }
        }

        function clearEquipSlots() {

            for (let key in itemSlots) {
                itemSlots[key].removeSlotItem();
                poolReturn(itemSlots[key]);
                itemSlots[key] = null;
            }
        }

        function mapEquipSlots() {
            clearEquipSlots()
            for (let i = 0; i < slots.length;i++) {
                let slotId = slots[i]['slot_id'];
                let jointKey = slots[i]['joint'];
                itemSlots[slotId] = poolFetch('ItemSlot');
                itemSlots[slotId].setSlotId(slotId);
                let dynamicJoint = pieceAttacher.getAttachmentJoint(jointKey);

                if (jointKey !== 'SKIN') {
                    if (!dynamicJoint) {
                        console.log("No Joint", jointKey, slotId, pieceAttacher);
                        return
                    }
                    let jointOffsets = pieceAttacher.getAttachmentJointOffsets(jointKey);
                    dynamicJoint.callbacks.applyBoneMap(visualActor.call.getInstance().getBoneMap());
                    dynamicJoint.applyJointOffsets(jointOffsets);
                }

                slotToJointMap[slotId] = dynamicJoint

            }
        }

        function setVisualActor(vActor) {

            visualActor = vActor;
            actor = visualActor.call.getActor();
            actorEquipment = actor.actorEquipment;
            slots = actorEquipment.slots;
            itemSlots = actorEquipment.itemSlots;
            pieceAttacher = visualActor.pieceAttacher;
            mapEquipSlots()
        }

        function activateVisualEquipment() {
            ThreeAPI.registerPrerenderCallback(update);
        }

        function deactivateVisualEquipment() {
            ThreeAPI.unregisterPrerenderCallback(update);
        }



        this.call = {
            setVisualActor:setVisualActor,
            activateVisualEquipment:activateVisualEquipment,
            deactivateVisualEquipment:deactivateVisualEquipment
        }

    }


}

export {VisualEquipment}