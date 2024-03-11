import {HtmlElement} from "./HtmlElement.js";

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
        let defaultData = [
            {label:'Mobile', value: window.isMobile},
            {label:'userAgent', value: client.env.userAgent},
            {label:'GL', value: window.SYSTEM_SETUP.glRenderer},
            {label:'vendor', value: window.SYSTEM_SETUP.vendor}
        ]
        console.log(defaultData, client.env);
        let adsrEnvelope;
        let callback;
        let statusMap = {
            name : "..",
            datalist: ""
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
            setInitTransforms();
            setTimeout(function() {
                activate( GameAPI.getActorById(statusMap.id))
            }, 1);
        }

        let headerDiv;
        let topDiv;
        let bottomDiv;

        let readyCb = function() {

            headerDiv = htmlElement.call.getChildElement('header_container');
            topDiv = htmlElement.call.getChildElement('top_container');
            bottomDiv = htmlElement.call.getChildElement('bottom_container');
            let reloadDiv = htmlElement.call.getChildElement('reload');
            let transitionDiv = htmlElement.call.getChildElement('transition');
            DomUtils.addClickFunction(reloadDiv, rebuild)
            DomUtils.addClickFunction(headerDiv, retrigger)
            DomUtils.addClickFunction(topDiv, release)
            DomUtils.addClickFunction(bottomDiv, release)
        }

        let rebuild;

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


        let htmlReady = function() {
            readyCb()

            setInitTransforms();
            htmlElement.container.style.visibility = 'visible';
            statusMap.id = actor.getStatus(ENUMS.ActorStatus.ACTOR_ID);
            statusMap.name = actor.getStatus(ENUMS.ActorStatus.NAME);

            setTimeout(function() {
                headerDiv.style.transitionDuration = adsrEnvelope.attack.duration+"s";
                headerDiv.style.transitionTimingFunction = adsrEnvelope.attack.easing;
                topDiv.style.transitionDuration = 0.675*adsrEnvelope.attack.duration+"s";
                topDiv.style.transitionTimingFunction = adsrEnvelope.attack.easing;
                bottomDiv.style.transitionDuration = 0.475*adsrEnvelope.attack.duration+"s";
                bottomDiv.style.transitionTimingFunction = adsrEnvelope.attack.easing;
                transformToCenter(headerDiv);
                transformToCenter(topDiv);
                transformToCenter(bottomDiv)
            },1)
        }

        let activate = function(actr) {
            console.log("inspect Actor", actr)
            adsrEnvelope = defaultAdsr;
            actor = actr;
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