import {HtmlElement} from "./HtmlElement.js";
import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {requestItemSlotChange} from "../../utils/EquipmentUtils.js";

let defaultAdsr = {
    attack: {duration:0.5, from:0, to: 1.2, easing:"cubic-bezier(0.7, 0.2, 0.85, 1.15)"},
    decay:  {duration:0.2, to: 1, easing:"ease-in-out"},
    sustain: {duration: 2, to: 1, easing:"ease-in-out"},
    release: {duration:0.4, to: 0, easing:"cubic-bezier(0.4, -0.2, 0.7, -0.2)"}
}

let dragEvent = null;
let dragListening = false;

class DomInventory {
    constructor() {
        let dragItem = null;
        let actor = null;
        let sourceSlot
        let switchCB = function(dragItem, switchItem) {
            if (switchItem !== null) {
                actor.actorInventory.addInventoryItem(switchItem, sourceSlot, null);
                switchItem = null;
            }
        }

        let handleItemDragEvent = function(e) {
            if (e !== null) {
                dragListening = true;
                dragEvent = e;
                dragItem = e.item;
            } else {
                dragListening = false;
                if (dragTargetSlot !== null) {
                    let slotId = dragTargetSlot.id;
                    console.log("Drag To Inv Slot", slotId, dragTargetSlot, dragItem);
                    requestItemSlotChange(actor, dragItem, slotId);
                    return;
                    sourceSlot = dragItem.getStatus(ENUMS.ItemStatus.EQUIPPED_SLOT);
                    let invItem = actor.actorInventory.getItemAtSlot(sourceSlot);
                    if (invItem !== dragItem) {
                        console.log("Not switching inv items.. ")
                        let equippedItem = actor.actorEquipment.getEquippedItemBySlotId(sourceSlot);
                        if (equippedItem !== null) {
                            actor.actorEquipment.call.unequipActorItem(equippedItem);
                        }
                    } else {
                        actor.actorInventory.addInventoryItem(null, sourceSlot, null);
                    }
                    actor.actorInventory.addInventoryItem(dragItem, slotId, switchCB);
                }
            }
        }

        let htmlElement = new HtmlElement();
        let buttonDiv = null;
        let adsrEnvelope;
        let slotElements = {};
        let dragTargetSlot = null;
        let rootElem;
        let statusMap = {
            name : ".."
        }

        let setInitTransforms = function() {
            rootElem = htmlElement.call.getRootElement();
            rootElem.style.transform = "translate3d(50%, -68%, 0)";
        }

        let retrigger = function() {
            close();
            setTimeout(function() {
                activate( GameAPI.getActorById(statusMap.id))
            }, 1500);
        }

        let mouseMove = function(e) {
        //    console.log("mouse Move ", e.target);
            e.target.style.borderColor = "rgba(155, 225, 255, 0.2)";
        }

        let mouseOut = function(e) {
        //    console.log("mouse Out ", e.target);
            e.target.style.borderColor = "";
        }

        let readyCb = function() {

            let items = actor.actorInventory.items;

            for (let key in items) {
                let slot = htmlElement.call.getChildElement(key);
                slotElements[key] = slot;
                DomUtils.addMouseMoveFunction(slot, mouseMove)
                DomUtils.addPointerExitFunction(slot, mouseOut)
            }

            let reloadDiv = htmlElement.call.getChildElement('reload');
            DomUtils.addClickFunction(reloadDiv, retrigger)
        }

        let rebuild;


        let getDragOverSlot = function() {
            let dragX = dragEvent.x;
            let dragY = dragEvent.y;
            for (let key in slotElements) {
                let slot = slotElements[key];
                let rect = DomUtils.getElementCenter(slot, rootElem);
                let inside = DomUtils.xyInsideRect(dragX, dragY, rect);
                if (inside === true) {
                    return slot
                }
            }
            return null;
        }

        let update = function() {

            if (actor === null) {
                console.log("No actor")
                return;
            }

            if (dragListening === true) {
                if (dragEvent !== null) {
                    let slot = getDragOverSlot()
                    if (slot !== null) {
                    //    console.log("Drag Listening", slot)
                        if (dragTargetSlot !== slot) {
                            if (dragTargetSlot !== null) {
                                dragTargetSlot.style.borderColor = "";
                            }
                            slot.style.borderColor = "white";
                            dragTargetSlot = slot;
                        }
                    } else {
                        if (dragTargetSlot !== null) {
                            dragTargetSlot.style.borderColor = "";
                            dragTargetSlot = null;
                        }
                    }
                }
            }


        }

        let close = function() {
            ThreeAPI.unregisterPrerenderCallback(update);
            actor.deactivateUiState(ENUMS.UiStates.INVENTORY);
            actor = null;
            htmlElement.closeHtmlElement();
            poolReturn(htmlElement);
        }

        let htmlReady = function() {
            readyCb()
            htmlElement.container.style.visibility = 'visible';
            GuiAPI.setUiStatusHtmlElement(ENUMS.UiStates.INVENTORY, htmlElement)
            statusMap.id = actor.getStatus(ENUMS.ActorStatus.ACTOR_ID);
            statusMap.name = actor.getStatus(ENUMS.ActorStatus.NAME);

            setTimeout(function() {
                ThreeAPI.registerPrerenderCallback(update);
                setInitTransforms();
                actor.activateUiState(ENUMS.UiStates.INVENTORY);
            },1)
        }


        let activate = function(actr, btnDiv, onClose) {
            buttonDiv = btnDiv;
            console.log("Actor inventory", actr)
            DomUtils.addElementClass(buttonDiv, 'bar_button_active')
            adsrEnvelope = defaultAdsr;
            actor = actr;
            htmlElement = poolFetch('HtmlElement');
            rebuild = htmlElement.initHtmlElement('inventory', onClose, statusMap, 'inventory', htmlReady);
        }

        let release = function() {
            htmlElement.hideHtmlElement();
            if (buttonDiv !== null) {
                DomUtils.removeElementClass(buttonDiv, 'bar_button_active')
            }
            buttonDiv = null;
            setTimeout(function() {
                close();
            }, adsrEnvelope.release.duration*1000+200)
        }

        this.call = {
            close:close,
            activate:activate,
            release:release,
            handleItemDragEvent:handleItemDragEvent
        }
    }
}

export {DomInventory}