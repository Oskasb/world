import {HtmlElement} from "./HtmlElement.js";

class DomInteract {
    constructor(worldEncounter, interactionOptions, text) {
        let closeTimeout = null;
        if (closeTimeout !== null) {
            clearTimeout(closeTimeout);
            closeTimeout = null;
        }
        let htmlElement = new HtmlElement();
        let hostActor = worldEncounter.getHostActor()

        let encounterAlignment = hostActor.getStatus(ENUMS.ActorStatus.ALIGNMENT)
        let encounterLevel = hostActor.getStatus(ENUMS.ActorStatus.ACTOR_LEVEL)

        let statusMap = {
            posX : 0,
            posZ : 0,
            zoom : 4,
            text : text || "Options"
        }

        let closeCb = function() {
            console.log("Close...")
        }

        let zoomIn = function() {
            statusMap.zoom = Math.round(MATH.clamp(statusMap.zoom * 2,  1, 32));
        }

        let zoomOut = function() {
            statusMap.zoom = Math.round(MATH.clamp(statusMap.zoom * 0.5, 1, 32));
        }

        let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();
        function attachInteractionOption(container, option) {
            let optElem = DomUtils.createDivElement(container, 'option_'+option['interaction'], option['text'], 'option_container '+option['interaction'])

            let addIcon = function() {
                let iconElem = DomUtils.createDivElement(optElem, 'icon_'+option['interaction'], '', 'interact_icon')
            }

            setTimeout(addIcon, 100)

            function triggerEvent(dispatch) {
                let eventId = dispatch.event;
                let value = dispatch.value;
                if (!value.pos) {
                    value.pos = hostActor.getSpatialPosition();
                }
                value.worldEncounter = worldEncounter;
                evt.dispatch(ENUMS.Event[eventId], value);
            }

            let actFunc = function() {
                if (option['dispatch']) {
                    let dispatch = option['dispatch'];
                    if (dispatch.length) {
                        for (let i = 0; i < dispatch.length; i++) {
                            triggerEvent(dispatch[i])
                        }
                    } else {
                        triggerEvent(dispatch)
                    }

                    close();
                } else {
                    selectedActor.actorText.say('No bound event '+option['interaction'])

                }
            }

            DomUtils.addClickFunction(optElem, actFunc)
        }

        let readyCb = function() {
            let optsContainer = htmlElement.call.getChildElement('interact_container')
            let header = htmlElement.call.getChildElement('header')
            header.innerHTML = hostActor.getStatus(ENUMS.ActorStatus.NAME)

            let alignment = htmlElement.call.getChildElement('alignment')
            statusMap.alignment = encounterAlignment;
            statusMap.level = "Level:"+encounterLevel
        //    alignment.innerHTML = ""+encounterAlignment;
            alignment.className ="alignment "+encounterAlignment;
            DomUtils.addClickFunction(header, rebuild)
            for (let i = 0; i < interactionOptions.length; i++) {
                attachInteractionOption(optsContainer, interactionOptions[i]);
            }

            /*
            DomUtils.addClickFunction(zoomInDiv, zoomIn)
            DomUtils.addClickFunction(zoomOutDiv, zoomOut)
            */
        }

        let rebuild = htmlElement.initHtmlElement('interact', closeCb, statusMap, 'interact_page', readyCb);

        let update = function() {
            let optsContainer = htmlElement.call.getChildElement('interact_container')
            if (optsContainer) {
                let gameTime = GameAPI.getGameTime();
                let flash = Math.sin(gameTime*2.7)*0.5 + 0.5;
                let shadowSize = flash*0.55+0.65
                let color = 'rgba(99, 255, 255, 0.7)';
                optsContainer.style.boxShadow = '0 0 '+shadowSize+'em '+color;
            }

        }

        ThreeAPI.registerPrerenderCallback(update);

        let clearIframe = function() {
            htmlElement.closeHtmlElement()
        }

        let close = function() {
            ThreeAPI.unregisterPrerenderCallback(update);
            htmlElement.hideHtmlElement()
            closeTimeout = setTimeout(clearIframe,1500)
        //    htmlElement.closeHtmlElement()
        }

        this.call = {
            close:close
        }

    }


}



export {DomInteract}