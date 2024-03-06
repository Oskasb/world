import {HtmlElement} from "./HtmlElement.js";

let defaultAdsr = {
    attack: {duration:0.7, from:0, to: 1.2, easing:"cubic-bezier(0.1, 0.3, 0.07, 1.15)"},
    decay:  {duration:0.2, to: 1, easing:"ease-in-out"},
    sustain: {duration: 2, to: 1, easing:"ease-in-out"},
    release: {duration:1.1, to: 0, easing:"cubic-bezier(0.3, -0.2, 0.4, 0.5)"}
}

class DomTransition {
    constructor() {
        let htmlElement = new HtmlElement();

        let adsrEnvelope;
        let callback;
        let statusMap = {
            transition : "",
        }

        let closeCb = function() {
            console.log("Close...")
        }

        let retrigger = function() {
            centerDiv.style.transitionDuration = 0+"s";
            centerDiv.style.transform = "translate3d(130%, 0, 0)"
            topDiv.style.transitionDuration = 0+"s";
            topDiv.style.transform = "translate3d(0, -100%, 0)"
            bottomDiv.style.transitionDuration = 0+"s";
            bottomDiv.style.transform = "translate3d(0, 100%, 0)"
            setTimeout(function() {
                activate(statusMap.transition, callback, adsrEnvelope)
            }, 1);
        }

        let centerDiv;
        let topDiv;
        let bottomDiv;

        let readyCb = function() {

            centerDiv = htmlElement.call.getChildElement('center_container');
            topDiv = htmlElement.call.getChildElement('top_container');
            bottomDiv = htmlElement.call.getChildElement('bottom_container');
            let reloadDiv = htmlElement.call.getChildElement('reload');
            let transitionDiv = htmlElement.call.getChildElement('transition');
            DomUtils.addClickFunction(reloadDiv, rebuild)
            DomUtils.addClickFunction(centerDiv, retrigger)
            DomUtils.addClickFunction(topDiv, release)
            DomUtils.addClickFunction(bottomDiv, release)
            retrigger();
        }

        let rebuild = htmlElement.initHtmlElement('transition', closeCb, statusMap, 'full_screen', readyCb);

        let update = function() {

        }

        ThreeAPI.registerPrerenderCallback(update);

        let close = function() {
            ThreeAPI.unregisterPrerenderCallback(update);
            htmlElement.closeHtmlElement()
        }


        let transformToCenter = function(div) {
            div.style.transform = "translate3d(0, 0, 0)"
        }

        let activate = function(label, callback, adsr) {
            htmlElement.container.style.visibility = 'visible';
            statusMap.transition = label || "TRANSITION";
            adsrEnvelope = adsr || defaultAdsr;
            centerDiv.style.transitionDuration = adsrEnvelope.attack.duration+"s";
            centerDiv.style.transitionTimingFunction = adsrEnvelope.attack.easing;
            topDiv.style.transitionDuration = 1.575*adsrEnvelope.attack.duration+"s";
            topDiv.style.transitionTimingFunction = adsrEnvelope.attack.easing;
            bottomDiv.style.transitionDuration = 1.275*adsrEnvelope.attack.duration+"s";
            bottomDiv.style.transitionTimingFunction = adsrEnvelope.attack.easing;

            setTimeout(function() {
                transformToCenter(centerDiv);
                transformToCenter(topDiv);
                transformToCenter(bottomDiv)
            },1)

        }

        let release = function() {
       //     centerDiv.style.transitionDuration = 0+"s";
            centerDiv.style.transitionDuration = adsrEnvelope.release.duration+"s";
            centerDiv.style.transitionTimingFunction = adsrEnvelope.release.easing;
            topDiv.style.transitionDuration = 0.775*adsrEnvelope.release.duration+"s";
            topDiv.style.transitionTimingFunction = adsrEnvelope.release.easing;
            bottomDiv.style.transitionDuration = 0.575*adsrEnvelope.release.duration+"s";
            bottomDiv.style.transitionTimingFunction = adsrEnvelope.release.easing;
            centerDiv.style.transform = "translate3d(-130%, 0, 0)"
       //     topDiv.style.transitionDuration = 0+"s";
            topDiv.style.transform = "translate3d(0, -100%, 0)"
       //     bottomDiv.style.transitionDuration = 0+"s";
            bottomDiv.style.transform = "translate3d(0, 100%, 0)"
            setTimeout(function() {
                htmlElement.container.style.visibility = 'hidden';
            }, adsrEnvelope.release.duration+500)
        }

        this.call = {
            close:close,
            activate:activate,
            release:release
        }

    }


}



export {DomTransition}