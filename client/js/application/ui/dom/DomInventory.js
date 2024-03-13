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
        let itemDivs = [];

        let adsrEnvelope;

        let statusMap = {
            name : ".."
        }

        let closeCb = function() {
            release();
            console.log("Close...")
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
            while(itemDivs.length) {
                console.log("Return DomItem")
                let domItem = itemDivs.pop();
                domItem.call.close();
                poolReturn(domItem);
            }
        }

        let update = function() {
            return;

            if (actor === null) {
                console.log("No actor")
            }

            let items = actor.actorEquipment.items;

            if (itemDivs.length !== 0 && itemDivs.length !== items.length) {
                clearItemDivs()
            }

            if (itemDivs.length < items.length) {
                for (let i = 0; i < items.length; i++) {
                    let item = items[i]
                    let itemDiv = poolFetch('DomItem');
                    itemDiv.call.setItem(item);
                    itemDivs.push(itemDiv);
                }
            }

            for (let i = 0; i < itemDivs.length; i++) {
                let domItem = itemDivs[i];
                let item = domItem.call.getItem();
                let slotId = item.getStatus(ENUMS.ItemStatus.EQUIPPED_SLOT);
                let target = htmlElement.call.getChildElement(slotId);

                if (!target) {
                    console.log("No parent div for slot: ", slotId, item);
                } else {
                    domItem.call.setTargetElement(target)
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

        let activate = function(actr) {
            console.log("Actor inventory", actr)
            adsrEnvelope = defaultAdsr;
            actor = actr;
            htmlElement = poolFetch('HtmlElement');
            rebuild = htmlElement.initHtmlElement('inventory', closeCb, statusMap, 'inventory', htmlReady);
        }

        let release = function() {
            htmlElement.hideHtmlElement();
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