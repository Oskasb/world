import {HtmlElement} from "./HtmlElement.js";
import {DomWorldmap} from "./DomWorldmap.js";
import {Vector2} from "../../../../libs/three/math/Vector2.js";
import {EncounterStatus} from "../../../game/encounter/EncounterStatus.js";

let tempVec2 = new Vector2()
let worldSize = 2048;
let tenMeterIndicators = [];
let actorIndicators = [];
let itemIndocators = [];

function calcMapBackgroundOffset(zoom, axisCenter, worldSize) {
    let zoomOffset = 1 + (1 / zoom);
    return MATH.percentify(zoomOffset*MATH.decimalify(axisCenter, 5)+worldSize*0.5, worldSize, true);
}

function calcMapMeterToDivPercent(zoom, worldSize) {
    return MATH.percentify(zoom, worldSize, true);
}

function updateMinimapCenter(htmlElement, minimapDiv, statusMap) {
    let cursorPos =  ThreeAPI.getCameraCursor().getPos();
    statusMap.posX = 'x:'+MATH.decimalify(cursorPos.x, 10);
    statusMap.posZ = 'z:'+MATH.decimalify(cursorPos.z, 10);

    let zoom = statusMap.zoom;
    minimapDiv.style.backgroundSize = zoom*100+'%';
    minimapDiv.style.backgroundPositionX = calcMapBackgroundOffset(zoom, cursorPos.x, worldSize)+'%';
    minimapDiv.style.backgroundPositionY = calcMapBackgroundOffset(zoom, cursorPos.z, worldSize)+'%';

}

function indicateTenMeterScale(tenMeterIndicators, htmlElement, minimapDiv, statusMap) {

    while (tenMeterIndicators.length < 4) {
        let indicator = DomUtils.createDivElement(minimapDiv, 'indicator_10m_'+tenMeterIndicators.length, '', 'indicator_10m')
        tenMeterIndicators.push(indicator);
    }

    let zoom = statusMap.zoom;
    let zoomFactor = calcMapMeterToDivPercent(zoom, worldSize);
    tenMeterIndicators[0].style.top = 50-(10*zoomFactor)+'%';
    tenMeterIndicators[1].style.top = 50+(10*zoomFactor)+'%';
    tenMeterIndicators[2].style.left = 50-(10*zoomFactor)+'%';
    tenMeterIndicators[3].style.left = 50+(10*zoomFactor)+'%';

}

function indicateActors(htmlElement, minimapDiv, statusMap) {
    let actors = GameAPI.getGamePieceSystem().getActors()
    while (actors.length < actorIndicators.length) {
        DomUtils.removeDivElement(actorIndicators.pop())
    }
    while (actors.length > actorIndicators.length) {
        let indicator = DomUtils.createDivElement(minimapDiv, 'indicator_actor_'+actorIndicators.length, '', 'heading')
        actorIndicators.push(indicator);
    }

    let zoom = statusMap.zoom;
    let zoomFactor = calcMapMeterToDivPercent(zoom, worldSize);
    let cursorPos =  ThreeAPI.getCameraCursor().getPos();

    let selectedActor = GameAPI.getGamePieceSystem().selectedActor

    for (let i = 0; i < actors.length; i++) {
        let actor = actors[i];
        let indicator = actorIndicators[i];
        let actorPos = actor.getSpatialPosition();

        tempVec2.set(actorPos.x-cursorPos.x, actorPos.z-cursorPos.z);
        let distance = tempVec2.length(); // is in units m from cursor (Center of minimap)


        if (distance > 150) {
            indicator.style.display = 'none';
        } else {
            if (indicator.style.display === 'none') {
                indicator.style.display = 'block';
            }

            let mapPctX = tempVec2.x*zoomFactor
            let mapPctZ = tempVec2.y*zoomFactor

            if (distance*zoomFactor > 50) {
                tempVec2.normalize();
                tempVec2.multiplyScalar(50);
                mapPctX = tempVec2.x;
                mapPctZ = tempVec2.y;
            }

            indicator.style.top = 50 + mapPctZ + '%';
            indicator.style.left = 50 + mapPctX + '%';


            let angle = actor.getStatus(ENUMS.ActorStatus.STATUS_ANGLE_EAST);
            angle = -MATH.eulerFromQuaternion(actor.getSpatialQuaternion(actor.actorObj3d.quaternion)).y + MATH.HALF_PI * 0.5 // Math.PI //;

            //    let headingDiv = htmlElement.call.getChildElement('heading');
            //    if (headingDiv) {
            indicator.style.rotate = angle + 'rad';

            //    console.log(angle)

            if (actor === selectedActor) {
                indicator.style.borderColor = "rgba(255, 255, 255, 1)";
            } else if (actor.getStatus(ENUMS.ActorStatus.ALIGNMENT) === ENUMS.Alignment.FRIENDLY) {
                indicator.style.borderColor = "rgba(76, 255, 76, 1)";
            } else if (actor.getStatus(ENUMS.ActorStatus.ALIGNMENT) === ENUMS.Alignment.HOSTILE) {
                indicator.style.borderColor = "rgba(255, 76, 76, 1)";
            } else {
                indicator.style.borderColor = "rgba(255, 255, 0, 1)";
            }

            if (selectedActor) {
                if (actor.getStatus(ENUMS.ActorStatus.ACTOR_ID) === selectedActor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET)) {
                    indicator.style.backgroundColor = "rgba(128, 128, 78, 1)";
                    indicator.style.boxShadow = "0 0 5px rgba(255, 255, 175, 0.75)";
                } else {
                    indicator.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
                    indicator.style.boxShadow = "0 0 2px rgba(5, 0, 0, 0.75)";
                }
            }

        }

    }

}


class DomMinimap {
    constructor() {
        let htmlElement = new HtmlElement();

        let statusMap = {
            posX : 0,
            posZ : 0,
            zoom : 60
        }

        let closeMapCb = function() {
        //    while (tenMeterIndicators.length) {
        //        DomUtils.removeDivElement(tenMeterIndicators.pop())
        //    }
            rebuild()
            console.log("Close Minimap...")
        }

        let zoomIn = function() {
            statusMap.zoom = MATH.clamp(statusMap.zoom * 1.2, 10, 200);
        }

        let zoomOut = function() {
            statusMap.zoom = MATH.clamp(statusMap.zoom * 0.8, 10, 200);
        }

        let openWorldMap = function() {
            while (tenMeterIndicators.length) {
                DomUtils.removeDivElement(tenMeterIndicators.pop())
            }
            htmlElement.closeHtmlElement()
            new DomWorldmap(closeMapCb);
        }

        let readyCb = function() {
            let mapDiv = htmlElement.call.getChildElement('minimap')
            let closeDiv = htmlElement.call.getChildElement(htmlElement.id+'_close')
            let zoomInDiv = htmlElement.call.getChildElement('zoom_in')
            let zoomOutDiv = htmlElement.call.getChildElement('zoom_out')
            DomUtils.addClickFunction(mapDiv, openWorldMap)
            DomUtils.addClickFunction(closeDiv, rebuild)
            DomUtils.addClickFunction(zoomInDiv, zoomIn)
            DomUtils.addClickFunction(zoomOutDiv, zoomOut)
        }

        let rebuild = function() {

            htmlElement.closeHtmlElement()
            htmlElement.initHtmlElement('minimap', null, statusMap, 'minimap', readyCb);
            setTimeout(function() {
                while (actorIndicators.length) {
                    DomUtils.removeDivElement(actorIndicators.pop())
                }
                while (tenMeterIndicators.length) {
                    DomUtils.removeDivElement(tenMeterIndicators.pop())
                }

            }, 200);

            console.log("Close Minimap...")
        }

        htmlElement.initHtmlElement('minimap', null, statusMap, 'minimap', readyCb);

        let update = function() {

            let minimapDiv = htmlElement.call.getChildElement('minimap');
            if (minimapDiv) {
                updateMinimapCenter(htmlElement, minimapDiv, statusMap);
                indicateTenMeterScale(tenMeterIndicators, htmlElement, minimapDiv, statusMap)
                indicateActors(htmlElement, minimapDiv, statusMap)
            }

        }

        ThreeAPI.registerPrerenderCallback(update);

    }


}



export {DomMinimap}