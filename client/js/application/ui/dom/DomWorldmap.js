import {HtmlElement} from "./HtmlElement.js";
import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {ENUMS} from "../../ENUMS.js";
let worldSize = 2048;
let tempObj = new Object3D();
let pointerVec3 = new Vector3();
let tempVec = new Vector3();
let tempVec2 = new Vector3();

let gridLinesX = [];
let gridLinesZ = [];
let actorIndicators = [];
let defaultWorldLevel = "20";
let activeWorldLevel = null;

let worldLevelDivs = [];

function calcMapBackgroundOffset(zoom, axisCenter, worldSize) {
    let zoomOffset = 1 + (1 / zoom);
    return MATH.percentify(zoomOffset*MATH.decimalify(axisCenter, 5)+worldSize*0.5, worldSize, true);
}


function indicateActors(htmlElement, minimapDiv, statusMap, centerPos) {
    let actors = GameAPI.getGamePieceSystem().getActors()
    while (actors.length < actorIndicators.length) {
        DomUtils.removeDivElement(actorIndicators.pop())
    }
    while (actors.length > actorIndicators.length) {
        let indicator = DomUtils.createDivElement(minimapDiv, 'indicator_actor_'+actorIndicators.length, '', 'actor')
        actorIndicators.push(indicator);
    }

    let zoom = statusMap.zoom;
    let cursorPos = centerPos;

    let selectedActor = GameAPI.getGamePieceSystem().selectedActor

    for (let i = 0; i < actors.length; i++) {
        let actor = actors[i];
        let indicator = actorIndicators[i];
        let actorPos = actor.actorObj3d.position;

        tempVec2.set(actorPos.x-cursorPos.x, actorPos.z-cursorPos.z);
        let distance = tempVec2.length(); // is in units m from cursor (Center of minimap)

        if (distance > 0.48*worldSize/zoom) {
            indicator.style.display = 'none';
        } else {
            if (indicator.style.display === 'none') {
                indicator.style.display = 'block';
            }

            worldPosDiv(actorPos, cursorPos, indicator, zoom);

            //    let angle = actor.getStatus(ENUMS.ActorStatus.STATUS_ANGLE_EAST);
            let angle = -MATH.eulerFromQuaternion(actor.getSpatialQuaternion(actor.actorObj3d.quaternion)).y + MATH.HALF_PI * 0.5 // Math.PI //;

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

function calcMapMeterToDivPercent(zoom, worldSize) {
    return MATH.percentify(zoom, worldSize, true);
}

function calcZoomForSize(size, worldSize)  {
    return worldSize/size;
}

function axisPosToPercent(axisPos) {
    let zoomFactor = calcMapMeterToDivPercent(1, worldSize);
    return axisPos*zoomFactor
}

function positionDiv(div, posVec) {
    let mapPctX = axisPosToPercent(posVec.x)
    let mapPctZ = axisPosToPercent(posVec.z)

    div.style.top = 50 + mapPctZ + '%';
    div.style.left = 50 + mapPctX + '%';
}

function alignDivToX(div, posX, zoom) {
    let zoomFactor = calcMapMeterToDivPercent(zoom, worldSize);
    let mapPctX = posX*zoomFactor
    div.style.left = mapPctX + '%';
}

function alignDivToZ(div, posZ, zoom) {
    let zoomFactor = calcMapMeterToDivPercent(zoom, worldSize);
    let mapPctZ = posZ*zoomFactor
    div.style.top = 50 + mapPctZ + '%';
}


function worldPosDiv(worldPos, cursorPos, div, zoom) {
    tempVec.copy(worldPos).sub(cursorPos)
    tempVec.multiplyScalar(zoom)
//    positionDiv(cameraDiv, tempVec, zoom);
    alignDivToX(div, tempVec.x+worldSize*0.5, 1)
    alignDivToZ(div, tempVec.z, 1)
}



function updateLineDivs(lineCount, mapDiv) {
    while (gridLinesX.length > lineCount) {
        DomUtils.removeDivElement(gridLinesX.pop())
    }
    while (gridLinesZ.length > lineCount) {
        DomUtils.removeDivElement(gridLinesZ.pop())
    }
    while (gridLinesX.length < lineCount) {
        let line = DomUtils.createDivElement(mapDiv, 'grid_x_'+gridLinesX.length, "", 'map_grid_line map_grid_line_x')
        gridLinesX.push(line);
    }
    while (gridLinesZ.length < lineCount) {
        let line = DomUtils.createDivElement(mapDiv, 'grid_z_'+gridLinesZ.length, "", 'map_grid_line')
        gridLinesZ.push(line);
    }
}



function positionLineDivs(mapDiv, cursorPos, lineSpacing, mapWidth, mapHeight, offsetX, offsetY, zoom) {
//    console.log(offsetX);
    let xLines = gridLinesX.length
    let xMin = cursorPos.x - mapWidth*0.5;
    let xMax = xMin+mapWidth;
    let zMin = cursorPos.z -mapHeight*0.5;
    let zMax = zMin+mapHeight;

    let rem = Math.floor(MATH.remainder(-cursorPos.x/lineSpacing)*lineSpacing);
    let midX = Math.ceil(cursorPos.x/lineSpacing)*lineSpacing;
    for (let i = 0; i < xLines; i++) {

        let lineX = Math.floor((i * lineSpacing -mapWidth*0.5)/lineSpacing)*lineSpacing
       let x =  rem + lineX //- mapWidth
        //   let x = Math.ceil((xMin/lineSpacing)*i)*lineSpacing;
    //    tempVec.set(x, 0, 0)
        alignDivToX(gridLinesX[i], x, zoom, offsetX)
        gridLinesX[i].innerHTML = Math.floor(midX + lineX);
    //    positionDiv(gridLinesX[i], tempVec)
    }

    rem = Math.floor(MATH.remainder(-cursorPos.z/lineSpacing)*lineSpacing);
    let midZ = Math.ceil(cursorPos.z/lineSpacing)*lineSpacing;
    let zLines = gridLinesZ.length
    for (let i = 0; i < zLines; i++) {
        let lineZ = Math.floor((i * lineSpacing  -mapWidth*0.5)/lineSpacing)*lineSpacing
        let z = rem + lineZ //- mapWidth
        alignDivToZ(gridLinesZ[i], z, zoom)
        gridLinesZ[i].innerHTML = Math.floor(midZ + lineZ);
    }

}

function updateGridLines(mapDiv, cursorPos, lineSpacing, mapWidth, mapHeight, offsetX, offsetY, zoom) {
    let lineCount = Math.ceil(mapWidth / lineSpacing);
    updateLineDivs(lineCount, mapDiv)
    positionLineDivs(mapDiv, cursorPos, lineSpacing, mapWidth, mapHeight, offsetX, offsetY, zoom)
}

function clearGridLines() {
    while (gridLinesX.length) {
        DomUtils.removeDivElement(gridLinesX.pop())
    }
    while (gridLinesZ.length) {
        DomUtils.removeDivElement(gridLinesZ.pop())
    }
}

function attachWorldLevelNavigation(container) {
   // let terrainSys = ThreeAPI.getTerrainSystem();
    let worldLevelConfigs = GameAPI.gameMain.getWorldLevelConfig();
    console.log("worldLevelConfigs",worldLevelConfigs)

    let levelList = [];

    for (let key in worldLevelConfigs) {
        levelList[parseInt(worldLevelConfigs[key].id)] = worldLevelConfigs[key]
    }

    while (levelList.length) {
        let levelConf = levelList.pop();

        if (levelConf) {
            function clickLevel() {
                defaultWorldLevel = levelConf.id;
                GameAPI.getPlayer().setStatusKey(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL, levelConf.id);

                let selectedActor = GameAPI.getGamePieceSystem().selectedActor;
                if (!selectedActor) {
                    GameAPI.leaveActiveGameWorld();
                    GameAPI.activateWorldLevel(levelConf.id);
                }

            }

            let div = DomUtils.createDivElement(container, "wls_"+levelConf.id, levelConf.id, "world_level_select")
            DomUtils.addClickFunction(div, clickLevel);
            worldLevelDivs.push(div);
        }
    }

}

class DomWorldmap {
    constructor(closeCb) {
        let htmlElement = new HtmlElement();
        let transition = null;
        let mapDiv = null;
        let mapImageDiv = null;
        let cursorDiv = null;
        let destinationDiv = null;
        let posDiv = null;
        let cameraDiv = null;
        let teleportDiv = null;
        let lineSpacing = 100;

        let offsetXDiv = null;
        let offsetZDiv = null;

        let statusMap = {
            width:0,
            height:0,
            offsetX:0,
            offsetY:0,
            posX : 0,
            posZ : 0,
            zoom : 4,
            layerX:"",
            layerY:"",
            pcntX:"",
            pcntY:"",
            x:"",
            y:"",
            z:"",
            dstX:0,
            dstY:0,
            dstZ:0,
            worldLevel:0
        }



        let closeMapCb = function() {
            console.log("Close worldmap...")
            ThreeAPI.unregisterPrerenderCallback(update);
            closeCb()
        }

        let zoomIn = function() {
            statusMap.zoom = Math.round(MATH.clamp(statusMap.zoom * 2,  1, 32));
        }

        let zoomOut = function() {
            statusMap.zoom = Math.round(MATH.clamp(statusMap.zoom * 0.5, 1, 32));
        }


        function getEventAxis(e, axis) {
            if (e['layer'+axis]) {
                return e['layer'+axis]
            }

            if (typeof(e.targetTouches)==='object') {
                if (e.targetTouches.length === 1) {
                    let touch = e.targetTouches[0];
                    return touch['client'+axis]
                }
            }
            return 0;

        }



        let elemECoords = function(e){
            let elem = e.target;
            let totWidth = elem.clientWidth;
            let totHeight = elem.clientHeight;

            let pointerX = getEventAxis(e,'X')
            let pointerY = getEventAxis(e,'Y')
            let pctX = MATH.percentify(pointerX, totWidth, true)
            let pctY = MATH.percentify(pointerY, totHeight, true)
            statusMap['pcntX'] = MATH.decimalify(pctX, 10)+"%";
            statusMap['pcntY'] = MATH.decimalify(pctY, 10)+"%";
            let x = MATH.decimalify(MATH.calcFraction(0, totWidth, pointerX)*worldSize - worldSize*0.5, 10);
            let z = MATH.decimalify(MATH.calcFraction(0, totHeight, pointerY)*worldSize - worldSize*0.5, 10);
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
        //        selectedActor.setSpatialPosition(endPos)
                // selectedActor.transitionTo(endPos, 1);
            }
            transition = null;
        }

        let teleport = function(e) {
            let selectedActor = GameAPI.getGamePieceSystem().selectedActor;
            if (selectedActor) {
                selectedActor.setSpatialPosition(ThreeAPI.getCameraCursor().getLookAroundPoint())
            }
        }


        let mapClick = function(e) {
            elemECoords(e);
            console.log("Map Click", ThreeAPI.tempVec3, e)
            positionDiv(destinationDiv, pointerVec3, statusMap.zoom);


            tempVec.copy(pointerVec3);
            tempVec.multiplyScalar(1/statusMap.zoom)
            tempVec.add(ThreeAPI.getCameraCursor().getLookAroundPoint())
            tempVec.y = ThreeAPI.terrainAt(tempVec);
            statusMap.dstX = tempVec.x;
            statusMap.dstY = tempVec.y;
            statusMap.dstZ = tempVec.z;
            destinationDiv.style.transition = "font-size 1.2s ease-out";
            destinationDiv.style.fontSize = "1em";
            //    positionDiv(cameraDiv, tempVec, zoom);
        //    alignDivToX(cameraDiv, tempVec.x+worldSize*0.5, 1, statusMap.os_x)
        //    alignDivToZ(cameraDiv, tempVec.z, 1, statusMap.os_z)

            if (transition !== null) {
                transition.cancelSpatialTransition()
            }

            transition = poolFetch('SpatialTransition')
            let distance = MATH.distanceBetween(ThreeAPI.getCameraCursor().getLookAroundPoint(), tempVec)
            transition.initSpatialTransition(ThreeAPI.getCameraCursor().getLookAroundPoint() , tempVec, 1, onArrive, MATH.curveSqrt(distance*0.4) + distance*0.1)

        }

        let frameDragX = 0;
        let frameDragY = 0;
        let lastDragX = 0
        let lastDragY = 0;

        function positionDestinationPointer() {
            tempVec.copy(pointerVec3);
            tempVec.multiplyScalar(1/statusMap.zoom)
            tempVec.add(ThreeAPI.getCameraCursor().getLookAroundPoint())
            statusMap.dstX = tempVec.x;
            statusMap.dstY = tempVec.y;
            statusMap.dstZ = tempVec.z;
        }

        let mapHover = function(e) {
        //    console.log("Map Hover",dragListen, e)
            elemECoords(e);
            pointerVec3.copy(ThreeAPI.tempVec3);



            if (dragListen === true) {
                /*
                if (transition !== null) {
                    transition.cancelSpatialTransition()
                }
                let dragDeltaX = ThreeAPI.tempVec3.x - startDragX;
                let dragDeltaY = ThreeAPI.tempVec3.z - startDragY;
                frameDragX = dragDeltaX-lastDragX;
                frameDragY = dragDeltaY-lastDragY;
                lastDragX = frameDragX;
                lastDragY = frameDragY;
                ThreeAPI.getCameraCursor().getLookAroundPoint().x = MATH.clamp(ThreeAPI.getCameraCursor().getLookAroundPoint().x -frameDragX*0.02/statusMap.zoom, -worldSize*0.5, worldSize*0.5);
                ThreeAPI.getCameraCursor().getLookAroundPoint().z = MATH.clamp( ThreeAPI.getCameraCursor().getLookAroundPoint().z -frameDragY*0.02/statusMap.zoom, -worldSize*0.5, worldSize*0.5);
                ThreeAPI.getCameraCursor().getLookAroundPoint().y = ThreeAPI.terrainAt(ThreeAPI.getCameraCursor().getLookAroundPoint())
            */
                positionDestinationPointer()

            } else {

                update();
            }
            
        }

        let startDragX = 0;
        let startDragY = 0;
        let dragListen = false;



        let mapPressStart = function(e) {
            elemECoords(e);
            frameDragX = 0;
            frameDragY = 0;
            lastDragX = 0
            lastDragY = 0;
            startDragX = ThreeAPI.tempVec3.x;
            startDragY = ThreeAPI.tempVec3.z;
            destinationDiv.style.transition = "font-size 0.1s ease-in";
            destinationDiv.style.fontSize = "2em";
            dragListen = true;
            positionDestinationPointer()
        }

        let mapPressEnd = function(e) {
            elemECoords(e);
            startDragX = ThreeAPI.tempVec3.x;
            startDragY = ThreeAPI.tempVec3.y;
            dragListen = false;
        }

        let readyCb = function() {
            clearGridLines()
            activeWorldLevel = null;

            while (worldLevelDivs.length) {
                DomUtils.removeDivElement(worldLevelDivs.pop())
            }

            while (actorIndicators.length) {
                DomUtils.removeDivElement(actorIndicators.pop())
            }

            mapDiv = htmlElement.call.getChildElement('map_frame')



            mapImageDiv = htmlElement.call.getChildElement('map_image')
            destinationDiv = htmlElement.call.getChildElement('destination')
            cursorDiv = htmlElement.call.getChildElement('cursor')
            posDiv = htmlElement.call.getChildElement('position')
            cameraDiv = htmlElement.call.getChildElement('camera')

            offsetXDiv = htmlElement.call.getChildElement('offset_x')
            offsetZDiv = htmlElement.call.getChildElement('offset_z')
            teleportDiv = htmlElement.call.getChildElement('teleport')
            let levelsContainer = htmlElement.call.getChildElement('levels_container')
            let reloadDiv = htmlElement.call.getChildElement('reload')
            let zoomInDiv = htmlElement.call.getChildElement('zoom_in')
            let zoomOutDiv = htmlElement.call.getChildElement('zoom_out')
            DomUtils.addClickFunction(mapDiv, mapClick)
            DomUtils.addMouseMoveFunction(mapDiv, mapHover)
            DomUtils.addPressStartFunction(mapDiv, mapPressStart)
            DomUtils.addPressEndFunction(mapDiv, mapPressEnd)
            DomUtils.addClickFunction(reloadDiv, rebuild)
            DomUtils.addClickFunction(zoomInDiv, zoomIn)
            DomUtils.addClickFunction(zoomOutDiv, zoomOut)
            DomUtils.addClickFunction(teleportDiv, teleport)
            attachWorldLevelNavigation(levelsContainer);
            ThreeAPI.unregisterPrerenderCallback(update);
            ThreeAPI.registerPrerenderCallback(update);
        }

        let rebuild = htmlElement.initHtmlElement('worldmap', closeMapCb, statusMap, 'full_screen', readyCb);

        let mapHeight = worldSize;
        let mapWidth = worldSize;

        let update = function() {
            let cursorPos =  ThreeAPI.getCameraCursor().getLookAroundPoint();
            statusMap.posX = 'x:'+MATH.decimalify(cursorPos.x, 100);
            statusMap.posZ = 'z:'+MATH.decimalify(cursorPos.z, 100);

            if (mapDiv) {
                let worldLevel = activeWorldLevel;


                let cam = ThreeAPI.getCamera()
            //    console.log(minimapDiv);
                let zoom = statusMap.zoom;
                mapImageDiv.style.scale = zoom;
                mapHeight = worldSize / zoom;
                mapWidth = worldSize / zoom;
                statusMap['height'] = mapHeight+'m';
                statusMap['width'] = mapWidth+'m';



                mapDiv.style.backgroundSize = zoom*100+'%';
                let zoomOffset = 1 + (1 / zoom);
                statusMap.offsetX = MATH.decimalify( MATH.percentify(zoomOffset*MATH.decimalify(cursorPos.x, 5)+worldSize*0.5, worldSize, true), 100);;
                statusMap.offsetY = MATH.decimalify( MATH.percentify(zoomOffset*MATH.decimalify(cursorPos.z, 5)+worldSize*0.5, worldSize, true), 100);;

                let xPcnt = MATH.percentify(-cursorPos.x, worldSize, true)
                let zPcnt = MATH.percentify(-cursorPos.z, worldSize, true)

                statusMap.os_x = (statusMap.offsetX-50)*0.005*worldSize;
                statusMap.os_z = (statusMap.offsetY-50)*0.005*worldSize;
                alignDivToX(offsetXDiv, 0, zoom, statusMap.os_x)
                alignDivToZ(offsetZDiv, 0, zoom, statusMap.os_z)
                offsetXDiv.innerHTML = "x:"+MATH.numberToDigits(cursorPos.x, 0, 2);
                offsetZDiv.innerHTML = "z:"+MATH.numberToDigits(cursorPos.z, 0, 2);

                mapImageDiv.style.transform = "translate("+xPcnt+"%, "+zPcnt+"%)"; // xPcnt+"%";
            //    mapImageDiv.style.left = xPcnt+"%";
            //    mapImageDiv.style.bottom = zPcnt+"%";  // statusMap.offsetX+'%';

                updateGridLines(mapDiv, cursorPos, lineSpacing, mapWidth, mapHeight, statusMap.offsetX, statusMap.offsetY, zoom)
            //    DomUtils.setElementClass()

                let selectedActor = GameAPI.getGamePieceSystem().selectedActor;
                if (selectedActor) {
                    teleportDiv.style.visibility = 'visible'
                    let angle = selectedActor.getStatus(ENUMS.ActorStatus.STATUS_ANGLE_EAST);
                    let headingDiv = htmlElement.call.getChildElement('heading');
                    if (headingDiv) {
                        headingDiv.style.rotate = -MATH.HALF_PI*0.5-angle+'rad';
                    }
                } else {
                    teleportDiv.style.visibility = 'hidden'
                }

                worldLevel = GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)

                if (worldLevel !== activeWorldLevel) {
                    statusMap.worldLevel = GameAPI.gameMain.getWorldLevelConfig(worldLevel).name;

                    if (activeWorldLevel !== null) {
                        DomUtils.removeElementClass(mapImageDiv, 'level_'+activeWorldLevel)
                    }
                    DomUtils.addElementClass(mapImageDiv, 'level_'+worldLevel)
                    activeWorldLevel = worldLevel;
                }

            //    positionDiv(posDiv, cursorPos, zoom);
                alignDivToX(posDiv, worldSize*0.5, 1, statusMap.os_x)
                alignDivToZ(posDiv, 0, 1, statusMap.os_z)
                positionDiv(cursorDiv, pointerVec3, zoom);

                worldPosDiv(cam.position, cursorPos, cameraDiv, zoom)
                tempVec.set(statusMap.dstX, statusMap.dstY, statusMap.dstZ);
                worldPosDiv(tempVec, cursorPos, destinationDiv, zoom)
                indicateActors(htmlElement, mapDiv, statusMap, cursorPos)



            }

        }



    }

}



export {DomWorldmap}