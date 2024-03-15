import {HtmlElement} from "./HtmlElement.js";
import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";

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
        let invItems = {};
        let slottedItems = {};
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

        let clearItemDivs = function() {
            console.log("clearItemDivs")
            for (let key in invItems) {
                if (invItems[key] !== null) {
                    let domItem = invItems[key];
                    domItem.call.close();
                    poolReturn(domItem);
                    invItems[key] = null;
                }
            }
        }

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


            let items = actor.actorInventory.items;

            for (let key in slottedItems) {
                if (items[key].item === null) {
                    slottedItems[key] = null;
                }
            }

            for (let key in items) {
                let item = items[key].item;
                if (item !== null) {
                    if (!slottedItems[key]) {
                        slottedItems[key] = item;
                    }
                }
            }

            for (let key in slottedItems) {
                let item = slottedItems[key];

                if (typeof (invItems[key]) === 'object') {
                    if (invItems[key] !== null) {
                        if (invItems[key].call.getItem() !== item) {
                            invItems[key].call.close();
                            invItems[key] = null;
                        } else {
                            let slotId = item.getStatus(ENUMS.ItemStatus.EQUIPPED_SLOT);
                            let target = htmlElement.call.getChildElement(slotId);
                            invItems[key].call.setTargetElement(target, htmlElement.call.getRootElement())
                        }

                    }

                } else {
                    let domItem = poolFetch('DomItem');
                    domItem.call.setItem(item);
                    let target = htmlElement.call.getChildElement(key);
                    console.log("Target Elem: ", target)
                    domItem.call.setTargetElement(target, htmlElement.call.getRootElement())
                    invItems[key] = domItem;
                }
            }

        }

        let close = function() {
            ThreeAPI.unregisterPrerenderCallback(update);
            clearItemDivs();
            actor = null;
            htmlElement.closeHtmlElement();
            poolReturn(htmlElement);
        }

        let htmlReady = function() {
            readyCb()
            htmlElement.container.style.visibility = 'visible';
            statusMap.id = actor.getStatus(ENUMS.ActorStatus.ACTOR_ID);
            statusMap.name = actor.getStatus(ENUMS.ActorStatus.NAME);



            setTimeout(function() {
                ThreeAPI.registerPrerenderCallback(update);
                setInitTransforms();
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