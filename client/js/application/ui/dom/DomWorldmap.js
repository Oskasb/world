import {HtmlElement} from "./HtmlElement.js";
import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
let worldSize = 2048;
let tempObj = new Object3D();
function calcMapBackgroundOffset(zoom, axisCenter, worldSize) {
    let zoomOffset = 1 + (1 / zoom);
    return MATH.percentify(zoomOffset*MATH.decimalify(axisCenter, 5)+worldSize*0.5, worldSize, true);
}

function calcMapMeterToDivPercent(zoom, worldSize) {
    return MATH.percentify(zoom, worldSize, true);
}

function calcZoomForSize(size, worldSize)  {
    return worldSize/size;
}

function positionDiv(div, posVec, zoomFactor) {
    let mapPctX = posVec.x*zoomFactor
    let mapPctZ = posVec.z*zoomFactor

    div.style.top = 50 + mapPctZ + '%';
    div.style.left = 50 + mapPctX + '%';
}

class DomWorldmap {
    constructor(closeCb) {
        let htmlElement = new HtmlElement();
        let transition = null;
        let mapDiv = null;
        let cursorDiv = null;
        let cameraDiv = null;
        let statusMap = {
            posX : 0,
            posZ : 0,
            zoom : 4,
            layerX:"",
            layerY:"",
            pcntX:"",
            pcntY:"",
            x:"",
            y:"",
            z:""
        }

        let closeMapCb = function() {
            console.log("Close worldmap...")
            closeCb()
        }

        let zoomIn = function() {
            statusMap.zoom = Math.round(MATH.clamp(statusMap.zoom * 2,  1, 32));
        }

        let zoomOut = function() {
            statusMap.zoom = Math.round(MATH.clamp(statusMap.zoom * 0.5, 1, 32));
        }


        let elemECoords = function(e){
            let elem = e.target;
            let totWidth = elem.clientWidth;
            let totHeight = elem.clientHeight;
            let pctX = MATH.percentify(e.layerX, totWidth, true)
            let pctY = MATH.percentify(e.layerY, totHeight, true)
            statusMap['pcntX'] = MATH.decimalify(pctX, 10)+"%";
            statusMap['pcntY'] = MATH.decimalify(pctY, 10)+"%";
            let x = MATH.decimalify(MATH.calcFraction(0, totWidth, e.layerX)*worldSize - worldSize*0.5, 10);
            let z = MATH.decimalify(MATH.calcFraction(0, totHeight, e.layerY)*worldSize - worldSize*0.5, 10);
            statusMap['x'] = "x:"+x;
            statusMap['z'] = "z:"+z ;
            ThreeAPI.tempVec3.set(x, 0, z)
            ThreeAPI.tempVec3.y = MATH.decimalify(ThreeAPI.terrainAt(ThreeAPI.tempVec3), 10);
            statusMap['y'] = "y:"+ThreeAPI.tempVec3.y;

/*
            let zoom = statusMap.zoom;
            mapDiv.style.backgroundSize = zoom*100+'%';
            let zoomOffset = 1 + (1 / zoom);
            mapDiv.style.backgroundPositionX = -zoomOffset*0 + MATH.percentify(zoomOffset*MATH.decimalify(cursorPos.x, 5)+1024, 2048, true)+'%';
            mapDiv.style.backgroundPositionY =  zoomOffset*0 + MATH.percentify(zoomOffset*MATH.decimalify(cursorPos.z, 5)+1024, 2048, true)+'%';
  */
        }

        let onArrive = function(endPos, spatTrans) {
            poolReturn(spatTrans);
            let selectedActor = GameAPI.getGamePieceSystem().selectedActor;
            if (selectedActor) {
                selectedActor.setSpatialPosition(endPos)
                // selectedActor.transitionTo(endPos, 1);
            }
            transition = null;
        }


        let mapClick = function(e) {
            elemECoords(e);
            console.log("Map Click", ThreeAPI.tempVec3, e)

            if (transition !== null) {
                transition.cancelSpatialTransition()
            }

            transition = poolFetch('SpatialTransition')
            let distance = MATH.distanceBetween(ThreeAPI.getCameraCursor().getLookAroundPoint(), ThreeAPI.tempVec3)
            transition.initSpatialTransition(ThreeAPI.getCameraCursor().getLookAroundPoint() , ThreeAPI.tempVec3, 2, onArrive, MATH.curveSqrt(distance*0.4) + distance*0.1)
        //    ThreeAPI.getCameraCursor().getLookAroundPoint().copy(ThreeAPI.tempVec3);
        //    statusMap['layerX'] = e.layerX;
        //    statusMap['layerY'] = e.layerY;
        //    let elem = e.target;
        //    let totWidth = elem.clientWidth;
        //    let totHeight = elem.clientHeight;
        //    statusMap['pcntX'] = MATH.percentify(e.layerX, totWidth);
        //    statusMap['pcntY'] = MATH.percentify(e.layerY, totHeight);
        }

        let mapHover = function(e) {
        //    console.log("Map Hover", e)
            elemECoords(e);
        }

        let readyCb = function() {
            mapDiv = htmlElement.call.getChildElement('worldmap')
            cursorDiv = htmlElement.call.getChildElement('cursor')
            cameraDiv = htmlElement.call.getChildElement('camera')
            let reloadDiv = htmlElement.call.getChildElement('reload')

            let zoomInDiv = htmlElement.call.getChildElement('zoom_in')
            let zoomOutDiv = htmlElement.call.getChildElement('zoom_out')
            DomUtils.addClickFunction(mapDiv, mapClick)
            DomUtils.addMouseMoveFunction(mapDiv, mapHover)
            DomUtils.addClickFunction(reloadDiv, rebuild)
            DomUtils.addClickFunction(zoomInDiv, zoomIn)
            DomUtils.addClickFunction(zoomOutDiv, zoomOut)
        }

        let rebuild = htmlElement.initHtmlElement('worldmap', closeMapCb, statusMap, 'full_screen', readyCb);

        let update = function() {
            let cursorPos =  ThreeAPI.getCameraCursor().getLookAroundPoint();
            statusMap.posX = 'x:'+MATH.decimalify(cursorPos.x, 10);
            statusMap.posZ = 'z:'+MATH.decimalify(cursorPos.z, 10);



            if (mapDiv) {
                let cam = ThreeAPI.getCamera()
            //    console.log(minimapDiv);
                let zoom = statusMap.zoom;
                let zoomFactor = calcMapMeterToDivPercent(zoom, worldSize);
                mapDiv.style.backgroundSize = zoom*100+'%';
                let zoomOffset = 1 + (1 / zoom);
                mapDiv.style.backgroundPositionX = -zoomOffset*0 + MATH.percentify(zoomOffset*MATH.decimalify(cursorPos.x, 5)+1024, 2048, true)+'%';
                mapDiv.style.backgroundPositionY =  zoomOffset*0 + MATH.percentify(zoomOffset*MATH.decimalify(cursorPos.z, 5)+1024, 2048, true)+'%';
            //    DomUtils.setElementClass()

                let selectedActor = GameAPI.getGamePieceSystem().selectedActor;
                if (selectedActor) {
                    let angle = selectedActor.getStatus(ENUMS.ActorStatus.STATUS_ANGLE_EAST);

                    let headingDiv = htmlElement.call.getChildElement('heading');
                    if (headingDiv) {
                        headingDiv.style.rotate = -MATH.HALF_PI*0.5-angle+'rad';
                    }
                }

                positionDiv(cursorDiv, cursorPos, zoomFactor)
                positionDiv(cameraDiv, cam.position, zoomFactor)
            //    tempObj.position.copy(cam.position);
            //    tempObj.position.y = cursorPos.y;
            //    tempObj.lookAt(cursorPos)
            //    let angle = -MATH.eulerFromQuaternion(tempObj.quaternion).y //+ MATH.HALF_PI * 0.5 // Math.PI //;
            //    cameraDiv.style.rotate = MATH.angleInsideCircle(angle) + 'rad';




            }

        }

        ThreeAPI.registerPrerenderCallback(update);

    }


}



export {DomWorldmap}