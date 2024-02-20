import {HtmlElement} from "./HtmlElement.js";
import {DomWorldmap} from "./DomWorldmap.js";
import {Vector2} from "../../../../libs/three/math/Vector2.js";
import {EncounterStatus} from "../../../game/encounter/EncounterStatus.js";
import {filterForWalkableTiles} from "../../../game/gameworld/ScenarioUtils.js";

let tempVec2 = new Vector2()
let worldSize = 2048;
let tenMeterIndicators = [];
let actorIndicators = [];
let itemIndocators = [];
let gridTileIndicators = [];
let preCombatZoom = 0;
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

function updateMinimapCenter(htmlElement, minimapDiv, statusMap, centerPos, inCombat) {
    statusMap.posX = 'x:'+MATH.numberToDigits(centerPos.x, 1, 4);
    statusMap.posZ = 'z:'+MATH.numberToDigits(centerPos.z, 1, 4);

    let zoom = statusMap.zoom;
    minimapDiv.style.backgroundSize = zoom*100+'%';
    minimapDiv.style.backgroundPositionX = calcMapBackgroundOffset(zoom, centerPos.x, worldSize)+'%';
    minimapDiv.style.backgroundPositionY = calcMapBackgroundOffset(zoom, centerPos.z, worldSize)+'%';

    if (inCombat === true) {
        let gameTime = GameAPI.getGameTime();
        let flash = Math.sin(gameTime*8)*0.5 + 0.5;
        let shadowSize = flash*1.5+0.2
        minimapDiv.style.boxShadow = '0 0 '+shadowSize+'em rgba(255, 125, 75, 0.75)';
        minimapDiv.style.borderColor = "rgb(255, "+flash*180+20+", "+(flash)*100+5+")";
    }

}


function addGridTiles(htmlElement, minimapDiv, statusMap, centerPos, encounterGrid) {

    let tiles = filterForWalkableTiles(encounterGrid.gridTiles, 'walkable');
    let zoomFactor = calcMapMeterToDivPercent(statusMap.zoom, worldSize);
    while (tiles.length) {
        let tile = tiles.pop();
        let pos = tile.getPos();
        tempVec2.set((pos.x-centerPos.x)*zoomFactor, (pos.z-centerPos.z)*zoomFactor);
        let indicator = DomUtils.createDivElement(minimapDiv, 'tile'+tempVec2.x+"_"+tempVec2.y, '', 'indicator_tile')
        indicator.style.top = 50 + tempVec2.y + '%';
        indicator.style.left = 50 + tempVec2.x + '%';
        indicator.style.padding = zoomFactor*0.35+'%';
    //    indicator.style.transform = "translate("+zoomFactor*0.5+'%'+", "+zoomFactor*0.5+'%'+")";
        gridTileIndicators.push(indicator);
    }
}

function clearGridTiles() {
    while (gridTileIndicators.length) {
        DomUtils.removeDivElement(gridTileIndicators.pop())
    }
}

function switchCombatMode(htmlElement, minimapDiv, statusMap, centerPos, inCombat) {
    let closeDiv = htmlElement.call.getChildElement(htmlElement.id+'_close')
    let zoomInDiv = htmlElement.call.getChildElement('zoom_in')
    let zoomOutDiv = htmlElement.call.getChildElement('zoom_out')
    if (inCombat) {
        minimapDiv.style.borderRadius = 6 + '%';

        closeDiv.style.opacity = 0+"%";
        closeDiv.style.pointerEvents = "none";
        zoomInDiv.style.opacity = 0+"%";
        zoomInDiv.style.pointerEvents = "none";
        zoomOutDiv.style.opacity = 0+"%";
        zoomOutDiv.style.pointerEvents = "none";
        minimapDiv.style.pointerEvents = "none";
        addGridTiles( htmlElement, minimapDiv, statusMap, centerPos, GameAPI.getActiveEncounterGrid())
    } else {
        minimapDiv.style.borderRadius = 50+'%';
        minimapDiv.style.boxShadow = "0 0 0 0.2em rgba(0, 0, 0, 0.5)";
        minimapDiv.style.borderColor = "rgb(180, 180, 180)";
        closeDiv.style.opacity = 100+"%";
        closeDiv.style.pointerEvents = "auto";
        zoomInDiv.style.opacity = 100+"%";
        zoomInDiv.style.pointerEvents = "auto";
        zoomOutDiv.style.opacity = 100+"%";
        zoomOutDiv.style.pointerEvents = "auto";
        minimapDiv.style.pointerEvents = "auto";
        clearGridTiles()
    }
}

function indicateTenMeterScale(tenMeterIndicators, htmlElement, minimapDiv, statusMap) {

    while (tenMeterIndicators.length < 4) {
        let indicator = DomUtils.createDivElement(minimapDiv, 'indicator_10m_'+tenMeterIndicators.length, '', 'indicator_10m')
        tenMeterIndicators.push(indicator);
    }

    let zoom = statusMap.zoom;
    let zoomFactor = calcMapMeterToDivPercent(zoom, worldSize);
    tenMeterIndicators[0].style.top = 49-(10*zoomFactor)+'%';
    tenMeterIndicators[1].style.top = 49+(10*zoomFactor)+'%';
    tenMeterIndicators[2].style.left = 49-(10*zoomFactor)+'%';
    tenMeterIndicators[3].style.left = 49+(10*zoomFactor)+'%';

}

function indicateActors(htmlElement, minimapDiv, statusMap, centerPos, inCombat) {
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
    let cursorPos = centerPos;

    let selectedActor = GameAPI.getGamePieceSystem().selectedActor

    for (let i = 0; i < actors.length; i++) {
        let actor = actors[i];
        let indicator = actorIndicators[i];
        let actorPos = actor.actorObj3d.position;

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

            if (inCombat === false) {
                if (distance*zoomFactor > 49) {
                    tempVec2.normalize();
                    tempVec2.multiplyScalar(49);
                    mapPctX = tempVec2.x;
                    mapPctZ = tempVec2.y;
                }
            }

            indicator.style.top = 47.5 + mapPctZ + '%';
            indicator.style.left = 47.5 + mapPctX + '%';


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

        let inCombat = false;

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
        let centerPos = null;
        let update = function() {

            let minimapDiv = htmlElement.call.getChildElement('minimap');
            if (minimapDiv) {

                let selectedActor = GameAPI.getGamePieceSystem().selectedActor;

                if (selectedActor) {

                    if (inCombat !== selectedActor.getStatus(ENUMS.ActorStatus.IN_COMBAT)) {
                        inCombat = selectedActor.getStatus(ENUMS.ActorStatus.IN_COMBAT)

                        if (inCombat) {
                            let encGrid = GameAPI.getActiveEncounterGrid()
                            centerPos = encGrid.getPos();
                            let gridWidth = encGrid.maxXYZ.x - encGrid.minXYZ.x;
                            let gridDepth= encGrid.maxXYZ.z - encGrid.minXYZ.z;

                            let size = gridWidth;
                            if (gridDepth > gridWidth) {
                                size = gridDepth;
                            }
                            preCombatZoom = statusMap.zoom;
                            statusMap.zoom = calcZoomForSize(size+1, worldSize);
                        } else {
                            statusMap.zoom = preCombatZoom
                        }

                        switchCombatMode(htmlElement, minimapDiv, statusMap, centerPos, inCombat);
                    }

                    if (inCombat) {
                        let encGrid = GameAPI.getActiveEncounterGrid()
                        centerPos = encGrid.getPos();
                    } else {
                        centerPos = selectedActor.getSpatialPosition()
                    }
                } else {
                    centerPos = ThreeAPI.getCameraCursor().getPos()

                }

                updateMinimapCenter(htmlElement, minimapDiv, statusMap, centerPos, inCombat);

                indicateTenMeterScale(tenMeterIndicators, htmlElement, minimapDiv, statusMap)
                indicateActors(htmlElement, minimapDiv, statusMap, centerPos, inCombat)

            }

        }

        ThreeAPI.registerPrerenderCallback(update);

    }


}



export {DomMinimap}