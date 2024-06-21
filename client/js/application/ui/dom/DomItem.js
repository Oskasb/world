import {HtmlElement} from "./HtmlElement.js";
import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {ENUMS} from "../../ENUMS.js";
import {getItemIconClass, getVisualConfigByVisualId, getVisualConfigIconClass} from "../../utils/ItemUtils.js";

let activeDomItems = [];
let dragEvent = {};

class DomItem {
    constructor() {

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
            if (targetRoot === null) {
                return;
            }

            if (targetElement === null) {
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
            evt.dispatch(ENUMS.Event.UI_ITEM_DRAG, null)
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