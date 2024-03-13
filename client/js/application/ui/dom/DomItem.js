import {HtmlElement} from "./HtmlElement.js";

let activeDomItems = [];

class DomItem {
    constructor() {

        let htmlElement = new HtmlElement();
        let item = null;
        let targetElement = null;
        let rootElement = null;

        let statusMap = {

        }

        let closeCb = function() {
            console.log("Close...")
        }

        let update = function() {
            let bodyRect = document.body.getBoundingClientRect();
            let elemRect = targetElement.getBoundingClientRect();
            //    let offset   = elemRect.top - bodyRect.top;
            let width = elemRect.width;
            let height = elemRect.height;
            // console.log("")
            let pTop = elemRect.top - bodyRect.top;
            let pLeft = elemRect.left - bodyRect.left;

            rootElement.style.fontSize = targetElement.style.fontSize;
            rootElement.style.width = width+'px';
            rootElement.style.height = height+'px';
            setTargetCoordinates(pTop+height*0.5, pLeft+width*0.5)
        }

        let rebuild = function() {
            clearIframe();
        //    setTimeout(function() {
                setItem(item);
                setTargetElement(targetElement);
         //   }, 500)
        }

        let readyCb = function() {
            let bodyRect = document.body.getBoundingClientRect();
            let width = bodyRect.width;
            let height = bodyRect.height;
            rootElement = htmlElement.call.getRootElement();
            setTargetCoordinates(height*0.5,width *0.5)
            let container = htmlElement.call.getChildElement('container')
            DomUtils.addClickFunction(container, rebuild)

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
            htmlElement.initHtmlElement('item', closeCb, statusMap, 'item', readyCb);
        }

        let getItem = function() {
            return item;
        }


        let setTargetCoordinates = function(top, left) {
            rootElement.style.transform = "translate3d(-50%, -50%, 0)";
            rootElement.style.top = top+'px';
            rootElement.style.left = left+'px';
        }

        let setTargetElement = function(target) {
            targetElement = target;


        }

        let clearIframe = function() {
            htmlElement.closeHtmlElement()
        }

        let close = function() {
            item = null;
            ThreeAPI.unregisterPrerenderCallback(update);
            clearIframe();
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