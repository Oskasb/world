import {HtmlElement} from "./HtmlElement.js";

class DomInteract {
    constructor(worldEncounter, interactionOptions) {
        let htmlElement = new HtmlElement();
        let hostActor = worldEncounter.getHostActor()

        let encounterAlignment = hostActor.getStatus(ENUMS.ActorStatus.ALIGNMENT)

        let statusMap = {
            posX : 0,
            posZ : 0,
            zoom : 4
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

            let actFunc = function() {
                selectedActor.actorText.say('I will '+option['interaction'])
            }

            DomUtils.addClickFunction(optElem, actFunc)
        }

        let readyCb = function() {
            let optsContainer = htmlElement.call.getChildElement('interact_container')
            let header = htmlElement.call.getChildElement('header')
            header.innerHTML = hostActor.getStatus(ENUMS.ActorStatus.NAME)

            let alignment = htmlElement.call.getChildElement('alignment')
            alignment.innerHTML = ""+encounterAlignment;
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

        let rebuild = htmlElement.initHtmlElement('interact', closeCb, statusMap, 'full_screen', readyCb);

        let update = function() {

        }

        ThreeAPI.registerPrerenderCallback(update);

    }


}



export {DomInteract}