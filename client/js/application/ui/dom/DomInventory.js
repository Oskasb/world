import {HtmlElement} from "./HtmlElement.js";
import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";

let defaultAdsr = {
    attack: {duration:0.5, from:0, to: 1.2, easing:"cubic-bezier(0.7, 0.2, 0.85, 1.15)"},
    decay:  {duration:0.2, to: 1, easing:"ease-in-out"},
    sustain: {duration: 2, to: 1, easing:"ease-in-out"},
    release: {duration:0.4, to: 0, easing:"cubic-bezier(0.4, -0.2, 0.7, -0.2)"}
}

class DomInventory {
    constructor() {
        let actor = null;
        let htmlElement = new HtmlElement();
        let invItems = {};
        let slottedItems = {};
        let buttonDiv = null;
        let adsrEnvelope;

        let statusMap = {
            name : ".."
        }

        let setInitTransforms = function() {
            let rootElem = htmlElement.call.getRootElement();
            rootElem.style.transform = "translate3d(50%, -68%, 0)";
        }

        let retrigger = function() {
            close();
            setTimeout(function() {
                activate( GameAPI.getActorById(statusMap.id))
            }, 1500);
        }

        let readyCb = function() {
            let reloadDiv = htmlElement.call.getChildElement('reload');
            DomUtils.addClickFunction(reloadDiv, retrigger)
        }

        let rebuild;

        let clearItemDivs = function() {
            while(invItems.length) {
                console.log("Return DomItem")
                let domItem = invItems.pop();
                domItem.call.close();
                poolReturn(domItem);
            }
        }

        let update = function() {

            if (actor === null) {
                console.log("No actor")
                return;
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
                    if (invItems[key].call.getItem() !== item) {
                        invItems[key].call.close();
                        invItems[key] = null;
                    } else {

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
            release:release
        }
    }
}

export {DomInventory}