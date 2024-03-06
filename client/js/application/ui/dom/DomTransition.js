import {HtmlElement} from "./HtmlElement.js";

class DomTransition {
    constructor() {
        let htmlElement = new HtmlElement();

        let statusMap = {
            transition : "",
        }

        let closeCb = function() {
            console.log("Close...")
        }

        let readyCb = function() {
            let reloadDiv = htmlElement.call.getChildElement('reload');
            DomUtils.addClickFunction(reloadDiv, rebuild)
        }

        let rebuild = htmlElement.initHtmlElement('transition', closeCb, statusMap, 'full_screen', readyCb);

        let update = function() {

        }

        ThreeAPI.registerPrerenderCallback(update);

        let close = function() {
            ThreeAPI.unregisterPrerenderCallback(update);
            htmlElement.closeHtmlElement()
        }

        let activate = function(label) {
            statusMap.transition = label;
        }

        this.call = {
            close:close,
            activate:activate
        }

    }


}



export {DomTransition}