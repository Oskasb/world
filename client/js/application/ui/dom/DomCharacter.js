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

class DomCharacter {
    constructor() {

        let dragItem = null;
        let sourceSlot
        let dragTargetSlot = null;

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

                if (dragItem !== null) {
                    let slotId = dragItem.getEquipSlotId();
                    let slot = htmlElement.call.getChildElement(slotId);

                    if (slot) {
                        slot.style.borderColor = ""
                        slot.style.boxShadow =  "";
                    }
                }

                if (dragTargetSlot !== null) {

                    let slotId = dragTargetSlot.id;
                    sourceSlot = dragItem.getStatus(ENUMS.ItemStatus.EQUIPPED_SLOT);
                    if (sourceSlot === slotId) {
                        console.log("Drag back to origin")
                        return;
                    }

                    console.log("Drag To Inv Slot", slotId, dragTargetSlot, dragItem);
                    requestItemSlotChange(actor, dragItem, slotId);
                }
            }
        }

        let actor = null;
        let htmlElement = new HtmlElement();
        let itemDivs = [];

        let adsrEnvelope;

        let statusMap = {
            NAME : ".."
        }

        let closeCb = function() {
            release();
            console.log("Close...")
        }

        let setInitTransforms = function() {
            headerDiv.style.transitionDuration = 0+"s";
            headerDiv.style.transform = "translate3d(130%, 0, 0)"
            topDiv.style.transitionDuration = 0+"s";
            topDiv.style.transform = "translate3d(0, -100%, 0)"
            bottomDiv.style.transitionDuration = 0+"s";
            bottomDiv.style.transform = "translate3d(0, 100%, 0)"
        }

        let retrigger = function() {
            close();
            setTimeout(function() {
                activate( GameAPI.getActorById(statusMap.id))
            }, 1500);
        }

        let headerDiv;
        let topDiv;
        let bottomDiv;
        let invDiv;


        let inv = null;

        let closeInv = function() {
            if (inv !== null) {
                inv.call.release()
                inv = null;
            }
        }

        let openInventory = function() {
            if (inv !== null) {
                closeInv();
            } else {
                inv = poolFetch('DomInventory');
                inv.call.activate(actor, invDiv, closeInv);
            }

        }


        function dragListener(e) {
            if (inv !== null) {
                inv.call.handleItemDragEvent(e);
            }
            handleItemDragEvent(e);
        }

        evt.on(ENUMS.Event.UI_ITEM_DRAG, dragListener)

        let readyCb = function() {
            invDiv = htmlElement.call.getChildElement('button_inventory');
            headerDiv = htmlElement.call.getChildElement('header_container');
            topDiv = htmlElement.call.getChildElement('top_container');
            bottomDiv = htmlElement.call.getChildElement('bottom_container');
            let reloadDiv = htmlElement.call.getChildElement('reload');
            DomUtils.addClickFunction(invDiv, openInventory)
            DomUtils.addClickFunction(reloadDiv, retrigger)
            DomUtils.addClickFunction(headerDiv, release)
            DomUtils.addClickFunction(topDiv, release)
            DomUtils.addClickFunction(bottomDiv, release)
        }

        let rebuild;


        let getDragOverSlot = function() {
            let dragX = dragEvent.x;
            let dragY = dragEvent.y;
            let item = dragEvent.item;
            let slotId = item.getEquipSlotId();
        //    for (let key in slotElements) {
                let slot = htmlElement.call.getChildElement(slotId);
                if (slot) {
                    let rect = DomUtils.getElementCenter(slot, htmlElement.call.getRootElement());
                    let inside = DomUtils.xyInsideRect(dragX, dragY, rect);
                    if (inside === true) {
                        return slot
                    } else {
                        slot.style.borderColor = "rgba(155, 200, 255, 0.95)"
                        slot.style.boxShadow =  "0 0 1.3em rgba(85, 200, 255, 1)";
                    }
                }

        //    }
            return null;
        }


        let update = function() {
            if (actor === null) {
                console.log("No actor")
                return;
            }

            statusMap.NAME = actor.getStatus(ENUMS.ActorStatus.NAME);
            statusMap.ACTOR_LEVEL = actor.getStatus(ENUMS.ActorStatus.ACTOR_LEVEL);
            statusMap.CONFIG_ID = actor.getStatus(ENUMS.ActorStatus.CONFIG_ID);
            statusMap.PLAYER_STAMP = actor.getStatus(ENUMS.ActorStatus.PLAYER_STAMP);
            statusMap.CLIENT_STAMP = actor.getStatus(ENUMS.ActorStatus.CLIENT_STAMP);
            statusMap.ALIGNMENT = actor.getStatus(ENUMS.ActorStatus.ALIGNMENT);
            statusMap.ACTIONS = actor.getStatus(ENUMS.ActorStatus.ACTIONS);
            statusMap.PASSIVE_ACTIONS = actor.getStatus(ENUMS.ActorStatus.PASSIVE_ACTIONS);
            statusMap.MOVEMENT_SPEED = actor.getStatus(ENUMS.ActorStatus.MOVEMENT_SPEED);
            statusMap.MAX_HP = actor.getStatus(ENUMS.ActorStatus.MAX_HP);
            statusMap.HP = actor.getStatus(ENUMS.ActorStatus.HP);
            statusMap.WORLD_LEVEL = actor.getStatus(ENUMS.ActorStatus.WORLD_LEVEL);
            statusMap.TRAVEL = actor.getStatus(ENUMS.ActorStatus.TRAVEL);
            statusMap.STRONGHOLD_ID = actor.getStatus(ENUMS.ActorStatus.STRONGHOLD_ID);

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
            actor.deactivateUiState(ENUMS.UiStates.CHARACTER);
            actor = null;
            htmlElement.closeHtmlElement();
            poolReturn(htmlElement);
        }

        let transformToCenter = function(div) {
            div.style.transform = "translate3d(0, 0, 0)"
        }

        let htmlReady = function() {
            readyCb()

            setInitTransforms();
            htmlElement.container.style.visibility = 'visible';
            statusMap.id = actor.getStatus(ENUMS.ActorStatus.ACTOR_ID);
            GuiAPI.setUiStatusHtmlElement(ENUMS.UiStates.CHARACTER, htmlElement)

            setTimeout(function() {
                headerDiv.style.transitionDuration = adsrEnvelope.attack.duration+"s";
                headerDiv.style.transitionTimingFunction = adsrEnvelope.attack.easing;
                topDiv.style.transitionDuration = 0.665*adsrEnvelope.attack.duration+"s";
                topDiv.style.transitionTimingFunction = adsrEnvelope.attack.easing;
                bottomDiv.style.transitionDuration = 0.475*adsrEnvelope.attack.duration+"s";
                bottomDiv.style.transitionTimingFunction = adsrEnvelope.attack.easing;
                transformToCenter(headerDiv);
                transformToCenter(topDiv);
                transformToCenter(bottomDiv)
                ThreeAPI.registerPrerenderCallback(update);
                actor.activateUiState(ENUMS.UiStates.CHARACTER);
            },1)
        }

        let activate = function(actr) {
            console.log("inspect Actor", actr)
            adsrEnvelope = defaultAdsr;
            actor = actr;
            htmlElement = poolFetch('HtmlElement');
            rebuild = htmlElement.initHtmlElement('character', closeCb, statusMap, 'full_screen', htmlReady);
        }

        let release = function() {
            if (inv !== null) {
                inv.call.release()
                inv = null;
            }
            //     centerDiv.style.transitionDuration = 0+"s";
            headerDiv.style.transitionDuration = adsrEnvelope.release.duration+"s";
            headerDiv.style.transitionTimingFunction = adsrEnvelope.release.easing;
            topDiv.style.transitionDuration = 0.775*adsrEnvelope.release.duration+"s";
            topDiv.style.transitionTimingFunction = adsrEnvelope.release.easing;
            bottomDiv.style.transitionDuration = 0.575*adsrEnvelope.release.duration+"s";
            bottomDiv.style.transitionTimingFunction = adsrEnvelope.release.easing;
            headerDiv.style.transform = "translate3d(-130%, 0, 0)"
            //     topDiv.style.transitionDuration = 0+"s";
            topDiv.style.transform = "translate3d(0, -100%, 0)"
            //     bottomDiv.style.transitionDuration = 0+"s";
            bottomDiv.style.transform = "translate3d(0, 100%, 0)"
            setTimeout(function() {
                close();
            }, adsrEnvelope.release.duration*1000+200)
        }

        this.call = {
            close:close,
            activate:activate,
            release:release
        }
    }
}

export {DomCharacter}