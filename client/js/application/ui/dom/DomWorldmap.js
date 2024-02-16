import {HtmlElement} from "./HtmlElement.js";

class DomWorldmap {
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

        let zoomIn = function() {
            statusMap.zoom = MATH.clamp(statusMap.zoom * 1.2, 10, 200);
        }

        let zoomOut = function() {
            statusMap.zoom = MATH.clamp(statusMap.zoom * 0.8, 10, 200);
        }

        let readyCb = function() {
            let mapDiv = htmlElement.call.getChildElement('minimap')

            let zoomInDiv = htmlElement.call.getChildElement('zoom_in')
            let zoomOutDiv = htmlElement.call.getChildElement('zoom_out')
            DomUtils.addClickFunction(mapDiv, rebuild)
            DomUtils.addClickFunction(zoomInDiv, zoomIn)
            DomUtils.addClickFunction(zoomOutDiv, zoomOut)
        }


        let rebuild = htmlElement.initHtmlElement('minimap', closeMapCb, statusMap, 'minimap', readyCb);

        let update = function() {
            let cursorPos =  ThreeAPI.getCameraCursor().getPos();
            statusMap.posX = 'x:'+MATH.decimalify(cursorPos.x, 10);
            statusMap.posZ = 'z:'+MATH.decimalify(cursorPos.z, 10);

            let minimapDiv = htmlElement.call.getChildElement('minimap');
            if (minimapDiv) {
            //    console.log(minimapDiv);
                let zoom = statusMap.zoom;
                minimapDiv.style.backgroundSize = zoom*100+'%';
                let zoomOffset = 1 + (1 / zoom);
                minimapDiv.style.backgroundPositionX = -zoomOffset*0 + MATH.percentify(zoomOffset*MATH.decimalify(cursorPos.x, 5)+1024, 2048, true)+'%';
                minimapDiv.style.backgroundPositionY =  zoomOffset*0 + MATH.percentify(zoomOffset*MATH.decimalify(cursorPos.z, 5)+1024, 2048, true)+'%';
            //    DomUtils.setElementClass()

                let selectedActor = GameAPI.getGamePieceSystem().selectedActor;
                if (selectedActor) {
                    let angle = selectedActor.getStatus(ENUMS.ActorStatus.STATUS_ANGLE_EAST);

                    let headingDiv = htmlElement.call.getChildElement('heading');
                    if (headingDiv) {
                        headingDiv.style.rotate = -MATH.HALF_PI*0.5-angle+'rad';
                    }
                }


            }


        }

        ThreeAPI.registerPrerenderCallback(update);

    }


}



export {DomWorldmap}