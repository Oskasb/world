import {HtmlElement} from "./HtmlElement.js";
import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";

let activeDomItems = [];

class DomItem {
    constructor() {

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
            let bodyRect = DomUtils.getWindowBoundingRect();
            let rootRect = targetRoot.getBoundingClientRect();
            let elemRect = targetElement.getBoundingClientRect();
            let elemTraverse = targetElement;
            //    let offset   = elemRect.top - bodyRect.top;
            let width = elemRect.width;
            let height = elemRect.height;
            // console.log("")
            let pTop  = elemRect.top  + rootRect.top  - bodyRect.top;
            let pLeft = elemRect.left + rootRect.left - bodyRect.left;

            rootElement.style.fontSize = targetElement.style.fontSize;
            rootElement.style.width = width+'px';
            rootElement.style.height = height+'px';
/*
            while(elemTraverse !== null){
                pLeft += elemTraverse.offsetLeft;
                pTop += elemTraverse.offsetTop;
                elemTraverse = elemTraverse.offsetParent;
            }
*/
            setTargetCoordinates(pTop+height*0.5, pLeft+width*0.5)
        }

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
            let newCard = poolFetch('DomItemCard');
            closeItemCard();
            itemCard = newCard;
            itemCard.call.setItem(getItem(), closeItemCard);
            itemCard.call.setTargetElement(container, htmlElement.call.getRootElement())

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

        //    let slotId = item.getStatus(ENUMS.ItemStatus.EQUIPPED_SLOT);
            let backplate = htmlElement.call.getChildElement("backplate");

            let itemDiv = htmlElement.call.getChildElement("item_icon");
            let visualPiece=item.visualGamePiece;
            let visualConf = visualPiece.config;
            let iconClass = visualConf['icon_class'];

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