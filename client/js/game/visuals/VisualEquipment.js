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
        let items;

        let activeItems = [];
        let visualItems = [];

        let cancelled = false;
        function getVisualItemBySlot(slotId) {
            for (let i = 0; i < visualItems.length; i++) {
                let vItem = visualItems[i];
                if (vItem.item !== null) {
                    if (slotId === vItem.getSlotId()) {
                        return vItem;
                    }
                }
            }
            return null;
        }

        function getJointForItemSlot(itemSlot) {
            return slotToJointMap[itemSlot.slotId]
        }


        function getUpdateCallback(vItem, dynJoint) {
            if (dynJoint.key === 'SKIN') {

                let tickPieceEquippedItem = function() {
                    if (vItem.getSpatial().obj3d.parent) {
                        vItem.getSpatial().stickToObj3D(actor.actorObj3d)
                        vItem.getSpatial().obj3d.updateMatrixWorld();
                    } else {
                        console.log("Equipment init backwards")
                        let actorInstance = visualActor.getModel();
                        if (actorInstance !== null) {
                            let itemInstance = vItem.call.getInstance()
                            actorInstance.attachInstancedModel(itemInstance)
                        }
                    }
                }.bind(this)

                return tickPieceEquippedItem;
            } else {
            //    dynJoint.parentScale.copy(actor.getSpatialScale());
            //    dynJoint.parentScale.set(2, 2, 2)
                return dynJoint.callbacks.updateAttachedSpatial;
            }
        }

        function attachEquippedVisualItem(vItem, itemSlot) {
            if (cancelled) {
                console.log("Cancelled before attach")
                return;
            }
            let dynamicJoint = getJointForItemSlot(itemSlot);
            if (dynamicJoint.key === 'SKIN') {

                vItem.obj3d.frusumCulled = false;
                let itemInstance = vItem.call.getInstance()
                let modelClone = itemInstance.obj3d.children[0]
                let originalMaterial =  itemInstance.originalModel.material.mat
                //    console.log("skinned mesh clone:", itemInstance, modelClone, originalMaterial);
                itemInstance.applyModelMaterial(modelClone, originalMaterial)
                let actorInstance = visualActor.getModel();
                if (actorInstance !== null) {
                    actorInstance.attachInstancedModel(itemInstance)
                } else {
                    setTimeout(function() {
                    //    attachEquippedVisualItem(vItem, itemSlot)
                    }, 1)
                }
            } else {
                dynamicJoint.registerAttachedSpatial(vItem.getSpatial());
            }

        }


        function vItemReady(vItem) {

            if (vItem.item === null) {
                console.log("vItem cancelled before ready", vItem)
                return;
            }

            if (cancelled) {
                console.log("vItem cancelled before instance", vItem)
                return;
            }

            let slot = actorEquipment.getSlotForItem(vItem.item);
            let dynamicJoint = getJointForItemSlot(slot);
            let updateCB = getUpdateCallback(vItem, dynamicJoint)
            vItem.setUpdateCallback(updateCB);
            attachEquippedVisualItem(vItem, slot);
        }

        function addVisualItem(item) {
            cancelled = false;
            let vItem = poolFetch('VisualItem');
            visualItems.push(vItem);
            vItem.setItem(item, vItemReady);
        }


        function removeVisualItem(item) {
            let slotKey = item.getEquipSlotId()
            let vItem = getVisualItemBySlot(slotKey);

            let itemInstance = null
            if (vItem === null) {
                cancelled = true;
                return;
            }

                vItem.call.requestDeactivation();
                itemInstance = vItem.call.getInstance();
                if (itemInstance === null) {
                    cancelled = true;
                }


            if (cancelled === false) {
                if (itemInstance.getSpatial().call.isInstanced()) {
                    let slot = actorEquipment.getSlotForItem(item);
                    let dynamicJoint = getJointForItemSlot(slot);
                    dynamicJoint.detachAttachedEntity()
                } else {
                    let actorInstance = visualActor.getModel();
                    actorInstance.detatchInstancedModel(itemInstance);
                }
            }


            MATH.splice(visualItems, vItem);
            poolReturn(vItem);
        }

        function update() {
            items = actorEquipment.items;
            for (let i = 0; i < items.length; i++) {
                let item = items[i];
            //    if (item !== null) {
                    if (activeItems.indexOf(item) === -1) {
                        addVisualItem(item);
                        activeItems.push(item)
                    }
            //    }
            }

            if (activeItems.length > items.length) {
                for (let i = 0; i < activeItems.length; i++) {
                    let item = activeItems[i];
                //    if (item !== null) {
                        if (items.indexOf(item) === -1) {
                            removeVisualItem(item);
                            MATH.splice(activeItems, item);
                            i--
                        }
                //    }
                }
            }

        }

        function mapEquipSlots() {
            for (let i = 0; i < slots.length;i++) {
                let slotId = slots[i]['slot_id'];
                let jointKey = slots[i]['joint'];
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
            while (visualItems.length) {
                visualItems.pop().call.requestDeactivation()
            }
            MATH.emptyArray(activeItems)
        }



        this.call = {
            setVisualActor:setVisualActor,
            activateVisualEquipment:activateVisualEquipment,
            deactivateVisualEquipment:deactivateVisualEquipment
        }

    }


}

export {VisualEquipment}