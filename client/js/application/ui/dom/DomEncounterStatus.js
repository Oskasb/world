import {HtmlElement} from "./HtmlElement.js";
import {poolReturn} from "../../utils/PoolUtils.js";

import {ENUMS} from "../../ENUMS.js";


function clearDivArray(array) {
    while(array.length) {
        DomUtils.removeDivElement(array.pop());
    }
}

class DomEncounterStatus {
    constructor() {

        let closeTimeout = null;
        let htmlElement = new HtmlElement();
        let nodesContainer;
        let statusMap = {}
        let container;
        let rootElement = null;

        let closeAnchor;

            let readyCb = function () {

                statusMap.header = 'Encounter Status';
                htmlElement.showHtmlElement();
                rootElement = htmlElement.call.getRootElement()
                closeAnchor =  htmlElement.call.getChildElement('anchor_close')
                closeAnchor.style.display = "none";
                container = htmlElement.call.getChildElement('encounter_panel')
                nodesContainer = htmlElement.call.getChildElement('nodes_container')
            //    DomUtils.addElementClass(container, statusMap.rarity)
                let header = htmlElement.call.getChildElement('header')
                DomUtils.addClickFunction(container, rebuild)
                ThreeAPI.registerPrerenderCallback(update)
            }

            let rebuild;

            let activate = function() {
                rebuild = htmlElement.initHtmlElement('encounter_status', close, statusMap, 'encounter_status', readyCb);
            }

            let update = function () {
                let activeActor = GameAPI.getGamePieceSystem().selectedActor;
            }

        let clearIframe = function() {
            htmlElement.closeHtmlElement()
        }.bind(this)

        let close = function () {
            ThreeAPI.unregisterPrerenderCallback(update);
            htmlElement.hideHtmlElement()
            closeTimeout = setTimeout(clearIframe,1500)
        }.bind(this);

        this.call = {
            activate:activate,
            close: close
        }
    }


}

export { DomEncounterStatus }