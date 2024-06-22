import {HtmlElement} from "./HtmlElement.js";
import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {ENUMS} from "../../ENUMS.js";
import {
    getItemIconClass,
    getItemUiStateKey,
    getVisualConfigByVisualId,
    getVisualConfigIconClass
} from "../../utils/ItemUtils.js";
import {requestItemSlotChange} from "../../utils/EquipmentUtils.js";
import {getActiveUiStates} from "../../utils/ActorUtils.js";

let activeDomItems = [];

let slotInfo = {
    slot:null,
    htmlElement:null,
    uiState:''
}

function getTargetSlotElement(dragEvent, activeUiStates) {
    for (let key in activeUiStates) {
        let htmlElement = GuiAPI.getUiStatusHtmlElement(activeUiStates[key])
        let item = dragEvent.item;
        let slotId = item.getEquipSlotId();
        let slot = htmlElement.call.getChildElement(slotId);
        if (slot) {
            slotInfo.slot = slot;
            slotInfo.htmlElement = htmlElement;
            slotInfo.uiState = activeUiStates[key];
            return slotInfo;
        }
    }
    return null
}


function indicateTargetSlot(dragEvent, activeUiStates, on) {

        let sInfo = getTargetSlotElement(dragEvent, activeUiStates)
        if (sInfo !== null) {
            let slot = sInfo.slot;
            let htmlElement = sInfo.htmlElement;
            if (on === true) {
                slot.style.borderColor = "rgba(115, 230, 125, 0.95)"
            } else {
                slot.style.borderColor = ""
            }
        }

}

function getSlotsForUiState(uiState) {
    if (uiState === ENUMS.UiStates.CHARACTER) {
        return ENUMS.EquipmentSlots;
    } else if (uiState === ENUMS.UiStates.INVENTORY) {
        return ENUMS.InventorySlots;
    }  else {
        console.log("unsupported ui state slots", uiState);
    }

}

function getSlotAtDragEvent(dragEvent, activeUiStates) {
    for (let key in activeUiStates) {
        let htmlElement = GuiAPI.getUiStatusHtmlElement(activeUiStates[key])

        let slotEnums = getSlotsForUiState(activeUiStates[key])

        for (let key in slotEnums) {
            let slotDiv = htmlElement.call.getChildElement(key);
            let rect = DomUtils.getElementCenter(slotDiv, htmlElement.call.getRootElement());
            let inside = DomUtils.xyInsideRect(dragEvent.x, dragEvent.y, rect);
            if (inside === true) {

                return slotDiv
            }
        }
    }
    return null
}

function releaseDragOverIndicator(dragEvent, activeUiStates) {
    while (dragOverElements.length) {
        let releaseSlot = dragOverElements.pop()
        releaseSlot.style.borderColor = ""
        indicateTargetSlot(dragEvent, activeUiStates, true)
    }
}

function indicateCurrentSlotAtDragPoint(dragEvent, activeUiStates) {
    let slot = getSlotAtDragEvent(dragEvent, activeUiStates);
    if (slot === null) {
        releaseDragOverIndicator(dragEvent, activeUiStates)
    } else {
        let slotIndex = dragOverElements.indexOf(slot)
        if (slotIndex === -1) {
            releaseDragOverIndicator(dragEvent, activeUiStates)

            console.log("Target div: ", slot)

            let targetSlot = dragOverSlotIsTarget(dragEvent, activeUiStates);

            if (targetSlot === slot) {
                slot.style.borderColor = "rgba(199, 255, 225, 1)"
            } else {
                slot.style.borderColor = "rgba(75, 140, 185, 0.95)"
            }
            dragOverElements.push(slot);
        }
    }
}

function dragOverSlotIsTarget(dragEvent, activeUiStates) {
    let sInfo = getTargetSlotElement(dragEvent, activeUiStates)
    if (sInfo !== null) {
        let slot = sInfo.slot;
        let htmlElement = sInfo.htmlElement;
        let rect = DomUtils.getElementCenter(slot, htmlElement.call.getRootElement());
        let inside = DomUtils.xyInsideRect(dragEvent.x, dragEvent.y, rect);
        if (inside === true) {
            slot.style.boxShadow =  "0 0 1.3em rgba(185, 255, 215, 1)";
            return slot
        } else {
            slot.style.boxShadow =  "";
        }
    }
}

let draggingDomItems = [];
let dragOverElements = [];
let dragTargetElements = [];

let handleItemDragEvent = function(dragEvent) {

    let item = dragEvent.item;
    let domItem = dragEvent.domItem;
    let activeUiStates = getActiveUiStates();
    let targetSlot = dragOverSlotIsTarget(dragEvent, activeUiStates)
    if (dragEvent.dragActive === true) {
        if (draggingDomItems.indexOf(domItem) === -1) {
            draggingDomItems.push(domItem);
            console.log("start drag active", dragEvent);
            indicateTargetSlot(dragEvent, activeUiStates, true)
        }
        indicateCurrentSlotAtDragPoint(dragEvent, activeUiStates);
    } else {
        if (targetSlot) {
            targetSlot.style.boxShadow =  "";
        }
        console.log("Drop DomItem event", dragEvent)
        indicateTargetSlot(dragEvent, activeUiStates, false)
        MATH.splice(draggingDomItems, domItem);
    }

    // do: Set a "start drag" state, map to inputPointer. Get coords, use coords to update pos etc, wait for stop drag to end it

}

function dragListener(e) {
    handleItemDragEvent(e);
}

let listener = null;

class DomItem {
    constructor() {

        if (listener === null) {
            listener = dragListener;
            evt.on(ENUMS.Event.UI_ITEM_DRAG, listener)
        }
        let dragEvent = {};
        let domItem = this;
        let htmlElement = new HtmlElement();
        let item = null;
        let targetElement = null;
        let targetRoot = null;
        let rootElement = null;
        let container = null;
        let statusMap = {

        }

        let closeCb = function() {
            console.log("Close...")
        }

        let update = function() {

            let slotId = item.getStatus(ENUMS.ItemStatus.EQUIPPED_SLOT);

            let uiStateKey = getItemUiStateKey(item);
            let slotHtmlElem =  GuiAPI.getUiStatusHtmlElement(uiStateKey);
            if (!slotHtmlElem) {
                return;
            }

            targetRoot = slotHtmlElem.call.getRootElement();
            targetElement = slotHtmlElem.call.getChildElement(slotId);
            if (!targetRoot) {
                return;
            }

            if (!targetElement) {
                return;
            }

            let rect = DomUtils.getElementCenter(targetElement, targetRoot)

            let pTop  = rect.y;
            let pLeft = rect.x;

                rootElement.style.fontSize = targetElement.style.fontSize;
                rootElement.style.width = rect.width+'px';
                rootElement.style.height = rect.height+'px';

                let dragScaleY = 1 // bodyRect.height / rootElement.offsetHeight;
                let dragScaleX = 1 // bodyRect.width / rootElement.offsetWidth;

                let targetY = dragScaleY*dragY+pTop+rect.height*0.5;
                let targetX = dragScaleX*dragX+pLeft+rect.width*0.5

                setTargetCoordinates(targetY, targetX);
                if (dragActive === true) {
                    dragEvent.x = targetX;
                    dragEvent.y = targetY;
                    dragEvent.item = getItem();
                    dragEvent.domItem = domItem;
                    dragEvent.dragActive = true;
                    evt.dispatch(ENUMS.Event.UI_ITEM_DRAG, dragEvent)
                }

        }

        let dragY = 0;
        let dragX = 0;
        let startDragX = 0;
        let startDragY = 0;
        let startOffsetTop = 0;
        let startOffsetLeft = 0;
        let dragDistanceY = 0;
        let dragDistanceX = 0;
        let moveX = 0;
        let moveY = 0;

        let rebuild = function() {
            clearIframe();
        //    setTimeout(function() {
                setItem(item);
                setTargetElement(targetElement, targetRoot);
         //   }, 500)
        }

        let itemCard = null;

        let closeItemCard = function() {
            if (itemCard !== null) {
                itemCard.call.close();
                poolReturn(itemCard);
                itemCard = null;
            }
        }

        let inspectItem = function() {

            if (Math.abs(dragDistanceY) + Math.abs(dragDistanceX) > 5) {
                dragDistanceY = 0;
                dragDistanceX = 0;
                return;
            }

            let newCard = poolFetch('DomItemCard');
            closeItemCard();
            itemCard = newCard;
            itemCard.call.setItem(getItem(), closeItemCard);
            itemCard.call.setTargetElement(container, htmlElement.call.getRootElement())
        }




        let mouseMove = function(e) {
            if (dragActive === true) {
            //    console.log("mouse Move", e.pageX, e.pageY);
                dragDistanceY = rootElement.offsetTop-startOffsetTop;
                dragDistanceX = rootElement.offsetLeft-startOffsetLeft

                if (e.touches) {
                    moveY = e.touches[0].pageY;
                    moveX = e.touches[0].pageX;
                } else {
                    moveY = e.pageY;
                    moveX = e.pageX;
                }

                dragY = moveY -startDragY + dragDistanceY;
                dragX = moveX -startDragX + dragDistanceX;
            }
        }

        let dragActive = false;

        let sourceTransition = null;

        let startDrag = function(e) {
            dragY = 0;
            dragX = 0;
            dragActive = true;
            if (e.touches) {
                startDragY = e.touches[0].pageY;
                startDragX = e.touches[0].pageX;
            } else {
                startDragY = e.pageY;
                startDragX = e.pageX;
            }

            startOffsetTop = rootElement.offsetTop;
            startOffsetLeft = rootElement.offsetLeft;
            console.log("Drag Item", e, client);
            rootElement.style.zIndex = 5000;
            sourceTransition = rootElement.style.transition;
            rootElement.style.transition = "";
        }

        let endDrag = function() {
            dragActive = false;
            rootElement.style.zIndex = '';
            rootElement.style.transition = sourceTransition;
            dragEvent.x = dragX;
            dragEvent.y = dragY;
            dragEvent.item = getItem();
            dragEvent.domItem = domItem;
            dragEvent.dragActive = false;
            evt.dispatch(ENUMS.Event.UI_ITEM_DRAG, dragEvent)
            dragY = 0;
            dragX = 0;
        }

        let readyCb = function() {
            rootElement = htmlElement.call.getRootElement();
            let bodyRect = DomUtils.getWindowBoundingRect();
            let width = bodyRect.width;
            let height = bodyRect.height;
            setTargetCoordinates(height*0.5,width *0.5)
            container = htmlElement.call.getChildElement('container')
            container.style.visibility = "visible";
            container.style.display = "";
            DomUtils.addClickFunction(container, inspectItem)
            DomUtils.addPressStartFunction(container, startDrag)
            DomUtils.addPressEndFunction(container, endDrag)
            DomUtils.addMouseMoveFunction(container, mouseMove)

        //    let slotId = item.getStatus(ENUMS.ItemStatus.EQUIPPED_SLOT);
            let backplate = htmlElement.call.getChildElement("backplate");

            let itemDiv = htmlElement.call.getChildElement("item_icon");

            let visualConfig = getVisualConfigByVisualId(item.config['visual_id'])

            let iconClass = getVisualConfigIconClass(visualConfig);

            if (!iconClass) {
                iconClass = 'NYI_ICON'
            }

            let rarity = item.getStatus(ENUMS.ItemStatus.RARITY);
            DomUtils.addElementClass(backplate, rarity);
            DomUtils.addElementClass(itemDiv, iconClass);

            ThreeAPI.registerPrerenderCallback(update);

        }

        let setItem = function(itm) {
            item = itm;
            statusMap['ITEM_ID'] = item.getStatus(ENUMS.ItemStatus.ITEM_ID);
            htmlElement.initHtmlElement('item', null, statusMap, 'item', readyCb);
        }

        let getItem = function() {
            return item;
        }

        let setTargetCoordinates = function(top, left) {
            rootElement.style.transform = "translate3d(-50%, -50%, 0)";
            rootElement.style.top = top+'px';
            rootElement.style.left = left+'px';
        }

        let setTargetElement = function(target, root) {
            targetElement = target;
            targetRoot = root;
        }

        let clearIframe = function() {
            htmlElement.closeHtmlElement();
            console.log("Clear DomItem ", htmlElement)
            let rootElem = htmlElement.call.getRootElement()
            if (rootElem) {
                DomUtils.removeDivElement(rootElem);
            }
        }

        let close = function() {
            item = null;
            ThreeAPI.unregisterPrerenderCallback(update);
            clearIframe();
            closeItemCard();
        }

        this.call = {
            setItem:setItem,
            getItem:getItem,
            setTargetElement:setTargetElement,
            close:close
        }

    }


}



export {DomItem}