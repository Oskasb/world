import {HtmlElement} from "./HtmlElement.js";
import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";

let defaultAdsr = {
    attack: {duration:0.5, from:0, to: 1.2, easing:"cubic-bezier(0.7, 0.2, 0.85, 1.15)"},
    decay:  {duration:0.2, to: 1, easing:"ease-in-out"},
    sustain: {duration: 2, to: 1, easing:"ease-in-out"},
    release: {duration:0.4, to: 0, easing:"cubic-bezier(0.4, -0.2, 0.7, -0.2)"}
}

class DomCharacter {
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

        let clearItemDivs = function() {
            while(itemDivs.length) {
                console.log("Return DomItem")
                let domItem = itemDivs.pop();
                domItem.call.close();
                poolReturn(domItem);
            }
        }

        let update = function() {
            if (actor === null) {
                console.log("No actor")
                return;
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
            //        MATH.splice(itemDivs, itemDivs[i]);
            //        i--;
                //    clearItemDivs()
                } else {
                    domItem.call.setTargetElement(target, htmlElement.call.getRootElement())
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

        let transformToCenter = function(div) {
            div.style.transform = "translate3d(0, 0, 0)"
        }

        let htmlReady = function() {
            readyCb()

            setInitTransforms();
            htmlElement.container.style.visibility = 'visible';
            statusMap.id = actor.getStatus(ENUMS.ActorStatus.ACTOR_ID);
            statusMap.name = actor.getStatus(ENUMS.ActorStatus.NAME);

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