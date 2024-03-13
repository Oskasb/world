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

        let readyCb = function() {

            headerDiv = htmlElement.call.getChildElement('header_container');
            topDiv = htmlElement.call.getChildElement('top_container');
            bottomDiv = htmlElement.call.getChildElement('bottom_container');
            let reloadDiv = htmlElement.call.getChildElement('reload');
            DomUtils.addClickFunction(reloadDiv, retrigger)
            DomUtils.addClickFunction(headerDiv, release)
            DomUtils.addClickFunction(topDiv, release)
            DomUtils.addClickFunction(bottomDiv, release)
        }

        let rebuild;

        let clearItemDivs = function() {
            while(itemDivs.length) {
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
                } else {
                    domItem.call.setTargetElement(target)
                }
            }
        }

        let close = function() {
            clearItemDivs();
            actor = null;
            ThreeAPI.unregisterPrerenderCallback(update);
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