import {HtmlElement} from "./HtmlElement.js";

class DomMinimap {
    constructor() {
        let htmlElement = new HtmlElement();



        let statusMap = {
            posX : 0,
            posZ : 0,
            zoom : 60
        }

        let closeMapCb = function() {
            console.log("Close Minimap...")
        }

        htmlElement.initHtmlElement('minimap', closeMapCb, statusMap, 'minimap');

        let update = function() {
            let cursorPos =  ThreeAPI.getCameraCursor().getPos();
            statusMap.posX = MATH.decimalify(cursorPos.x, 10);
            statusMap.posZ = MATH.decimalify(cursorPos.z, 10);

            let minimapDiv = htmlElement.call.getChildElement('minimap');
            if (minimapDiv) {
            //    console.log(minimapDiv);
                let zoom = statusMap.zoom;
                minimapDiv.style.backgroundSize = zoom*100+'%';
                let zoomOffset = 1 + (1 / zoom);
                minimapDiv.style.backgroundPositionX = -zoomOffset*0 + MATH.percentify(zoomOffset*cursorPos.x+1024, 2048, true)+'%';
                minimapDiv.style.backgroundPositionY =  zoomOffset*0 + MATH.percentify(zoomOffset*cursorPos.z+1024, 2048, true)+'%';
            //    DomUtils.setElementClass()
            }


        }

        ThreeAPI.registerPrerenderCallback(update);

    }


}



export {DomMinimap}