import { Vector3} from "../../../libs/three/math/Vector3.js";
import { Vector2} from "../../../libs/three/math/Vector2.js";
import { Object3D } from "../../../libs/three/core/Object3D.js";
import { GridTile } from "../gamescenarios/GridTile.js";
import { DynamicTile } from "./DynamicTile.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";

let tempVec1 = new Vector3();
let tempVec2 = new Vector3();
let tempObj = new Object3D();
let tempVec2D = new Vector2;

let iconKeysAll = [
    "grass",
    "mud",
    "gravel",
    "sand_pink",
    "rock",
    "marsh",
    "rock_layers",
    "rock_purple",
    "rock_stripes",
    "rock_hard",
    "rock_rusty",
    "sand",
    "rock_grey",
    "rock_blue",
    "sand_cracked"
];
function positionPlayer(config, tPos, sPos) {
    let targetPos =tempVec1;
    let pos = config['pos'];
    let rot = config['rot'];
    let player = GameAPI.getMainCharPiece();

    let maxAllowedTravelDistance = 10;
    let travelTimeMax = 3;

    let playerMovement = player.getPieceMovement();
    let spatial = player.getSpatial();
    let sourcePos = tempVec2;

    if (tPos) {
        targetPos.copy(tPos);
    } else {
        MATH.vec3FromArray(targetPos, pos);
    }

    if (sPos) {
        sourcePos.copy(sPos);
        let travelDistance = MATH.distanceBetween(sourcePos, targetPos);
    //    travelTimeMax = travelTimeMax/(maxAllowedTravelDistance / travelDistance)
    } else {
        spatial.getSpatialPosition(sourcePos)
        sourcePos.sub(targetPos);
        let travelDistance = sourcePos.length();
        if (travelDistance > maxAllowedTravelDistance) {
            sourcePos.normalize();
            sourcePos.multiplyScalar( maxAllowedTravelDistance );
        } else {
            travelTimeMax = travelTimeMax/(maxAllowedTravelDistance / travelDistance)
        }
        sourcePos.add(targetPos);
    }
    spatial.setPosVec3(sourcePos);
    let arriveCallback = function() {
        spatial.setRotXYZ(rot[0], rot[1], rot[2])
    }

    playerMovement.moveToTargetAtTime('walk', sourcePos, targetPos, travelTimeMax, arriveCallback)

    let companions = player.companions;
    for (let i = 0; i < companions.length; i++) {
        companions[i].companionSystem.enterScenarioWithMaster();
    }


}

function resetScenarioCharacterPiece(charPiece) {

        let targPiece = charPiece.getStatusByKey('selectedTarget');
        if (targPiece) {
            targPiece.setStatusValue('selectedTarget', null);
            targPiece.setStatusValue('engagingTarget', null);
            targPiece.setStatusValue('combatTarget', null);
        }
        charPiece.movementPath.cancelMovementPath()
        charPiece.combatSystem.disengageTarget(charPiece.combatSystem.currentTarget);
        evt.dispatch(ENUMS.Event.MAIN_CHAR_SELECT_TARGET, {piece:null, value:false });
        evt.dispatch(ENUMS.Event.MAIN_CHAR_ENGAGE_TARGET, {piece:null, value:false });
        evt.dispatch(ENUMS.Event.SET_PLAYER_STATE, ENUMS.CharacterState.IDLE_HANDS);

        charPiece.setStatusValue('targState', ENUMS.CharacterState.IDLE_HANDS);
        charPiece.setStatusValue('charState', ENUMS.CharacterState.IDLE_HANDS);
        charPiece.setStatusValue('atkType', ENUMS.AttackType.NONE);
        charPiece.setStatusValue('trgAtkType', ENUMS.AttackType.NONE);
        charPiece.setStatusValue('disengageTarget', null);
        charPiece.setStatusValue('combatTarget', null);
        charPiece.setStatusValue('engagingTarget', null);
        charPiece.setStatusValue('selectedTarget', null);
        charPiece.pieceState.pieceStateProcessor.processTargetSelection(charPiece.pieceState.status);
        charPiece.pieceState.pieceStateProcessor.updatePieceTurn(charPiece.pieceState.status, charPiece.pieceState.config);
        charPiece.pieceState.pieceStateProcessor.processNewTurn(charPiece.pieceState.status, charPiece.pieceState.config);
        charPiece.combatSystem.disengageTarget(charPiece.combatSystem.currentTarget);
        evt.dispatch(ENUMS.Event.MAIN_CHAR_SELECT_TARGET, {piece:null, value:false });
        evt.dispatch(ENUMS.Event.MAIN_CHAR_ENGAGE_TARGET, {piece:null, value:false });
        evt.dispatch(ENUMS.Event.SET_PLAYER_STATE, ENUMS.CharacterState.IDLE_HANDS);
        charPiece.combatSystem.updateCombatTurnTick();
        charPiece.setStatusValue('disengageTarget', null);
        charPiece.setStatusValue('combatTarget', null);
        charPiece.setStatusValue('engagingTarget', null);
        charPiece.setStatusValue('selectedTarget', null);
        charPiece.pieceState.pieceStateProcessor.processTargetSelection(charPiece.pieceState.status);
        charPiece.pieceState.pieceStateProcessor.updatePieceTurn(charPiece.pieceState.status, charPiece.pieceState.config);
        charPiece.pieceState.pieceStateProcessor.processNewTurn(charPiece.pieceState.status, charPiece.pieceState.config);
        charPiece.combatSystem.updateCombatTurnTick();

}



function setupEncounterGrid(gridTiles, instances, gridConfig, posVec, forwardVec, minXYZ, maxXYZ) {
// console.log(scenarioGridConfig);
    let iconSprites = GuiAPI.getUiSprites("box_tiles_8x8");
    let iconKeys = gridConfig['grid_tiles'];
    let elevation = gridConfig['elevation'];
    let stepHeight = gridConfig['step_height'];
    let boxSize = gridConfig['box_size'] / 2;
    let grid = gridConfig['grid'];
    let gridWidth = grid.length;
    let gridDepth = grid[0].length;
    forwardVec.x *= gridWidth * 0.6;
    forwardVec.z *= gridDepth * 0.6;
    posVec.add(forwardVec);
  //  let pos = scenarioGridConfig['pos'];
    let pos = new Vector3(Math.round(posVec.x - gridWidth*0.5), Math.floor(posVec.y), Math.round(posVec.z  - gridDepth*0.5))


    tempObj.quaternion.set(0, 0, 0, 1);

    let defaultSprite = [7, 2]
    let exitSprite = [4, 7];
    let defaultSize = 0.88;
 //   console.log(gridConfig, gridWidth, gridDepth);

    minXYZ.x = pos.x -0.5;
    minXYZ.z = pos.z - 0.5;
    minXYZ.y = pos.y = 9999;

    maxXYZ.y = pos.y = -9999;
    tempObj.position.copy(pos)
    tempObj.position.x += gridWidth*0.5;
    tempObj.position.z += gridDepth*0.5;

    for (let i = 0; i < gridWidth; i++) {
        gridTiles.push([])
        for (let j = 0; j < gridDepth; j++) {

            let x = pos.x+i;
            let z = pos.z+j;

            let dynamicTile = poolFetch('DynamicTile');

            let direction = null;
            let isExit = false;
            if (i === 0 || i === gridWidth-1 || j === 0 || j === gridWidth-1) {
                isExit = true;

            }

            dynamicTile.activateTile(defaultSprite, defaultSize, null, null, null, false, isExit)
            dynamicTile.setTileIndex(x, z, i, j)
            gridTiles[i].push(dynamicTile);

            if (dynamicTile.getPos().y < minXYZ.y) {
                minXYZ.y = dynamicTile.getPos().y;
            }

            if (dynamicTile.getPos().y > maxXYZ.y) {
                maxXYZ.y = dynamicTile.getPos().y;
            }

            if (isExit) {
                if (dynamicTile.walkable) {
                    tempObj.position.y = dynamicTile.getPos().y;
                    tempObj.lookAt(dynamicTile.getPos());
                    dynamicTile.direction = MATH.compassAttitudeFromQuaternion(tempObj.quaternion);
                    dynamicTile.addExitVisuals()
                }
            }

            maxXYZ.x = x +0.5;
            maxXYZ.z = z +0.5;
        }
    }
    return gridTiles;
}

let tileStore = [];
function filterForWalkableTiles(gridTiles, key) {

    let tileKey = key || 'walkable'

    while (tileStore.length) {
        tileStore.pop();
    }

    for (let i = 0; i < gridTiles.length; i++) {

        for (let j = 0; j < gridTiles[i].length; j++) {
            let tile = gridTiles[i][j];
            if (tile[tileKey]) {
                if (key !== 'walkable') {
                    if (tile['walkable']) {
                        tileStore.push(tile);
                    }
                } else {
                    tileStore.push(tile);
                }

            }
        }
    }

    return tileStore
}

function getTileForPosition(gridTiles, posVec3) {
    let selectedTile = null;
    let nearestTileDist = MATH.bigSafeValue();

    for (let i = 0; i < gridTiles.length; i++) {

        for (let j = 0; j < gridTiles[i].length; j++) {
            let tile = gridTiles[i][j];
                tempVec2D.set(tile.obj3d.position.x - posVec3.x, tile.obj3d.position.z - posVec3.z);
                let lengthSq = tempVec2D.lengthSq();
                if (lengthSq < nearestTileDist) {
                    selectedTile = tile;
                    nearestTileDist = lengthSq;
                }
        }
    }

    return selectedTile
}


function getTileForScreenPosition(gridTiles, posVec3) {
    let selectedTile = null;
    let nearestTileDist = MATH.bigSafeValue();

    for (let i = 0; i < gridTiles.length; i++) {

        for (let j = 0; j < gridTiles[i].length; j++) {
            let tile = gridTiles[i][j];
            ThreeAPI.toScreenPosition(tile.obj3d.position, tempVec1);
            if (tempVec1.z === 0) {
                tempVec2D.set(tempVec1.x - posVec3.x, tempVec1.y - posVec3.y);
                let lengthSq = tempVec2D.lengthSq();
                if (lengthSq < nearestTileDist) {
                    selectedTile = tile;
                    nearestTileDist = lengthSq;
                }
            }

        }
    }

    return selectedTile
}

let walkCharToStart = function(charConf, character) {
    let charPiece = character.gamePiece;
    resetScenarioCharacterPiece(charPiece);
    MATH.vec3FromArray(ThreeAPI.tempVec3, charConf.pos);
    charPiece.getSpatial().setPosVec3(ThreeAPI.tempVec3);
    MATH.randomVector(ThreeAPI.tempVec3b);
    ThreeAPI.tempVec3b.y = 0;
    ThreeAPI.tempVec3b.multiplyScalar(2);
    ThreeAPI.tempVec3b.add(ThreeAPI.tempVec3);
    let moveCB = function (movedCharPiece) {
        movedCharPiece.getSpatial().setRotXYZ(charConf.rot[0],charConf.rot[1], charConf.rot[2])
        if (charConf.state) {
            movedCharPiece.setStatusValue('targState', charConf.state);
            movedCharPiece.setStatusValue('charState', charConf.state);
        }

    }
    charPiece.getPieceMovement().setTargetPosition(ThreeAPI.tempVec3);
    let tPos = charPiece.getPieceMovement().getTargetPosition();
    charPiece.getPieceMovement().moveToTargetAtTime('walk',ThreeAPI.tempVec3b, tPos, 2, moveCB)
}

function buildScenarioCharacter(charId, characters, charConf) {
    let charCB = function(character) {
        characters.push(character);
        let gamePiece = character.gamePiece;
        gamePiece.character = character;
        GameAPI.addPieceToWorld(gamePiece);
        resetScenarioCharacterPiece(gamePiece);
        gamePiece.setStatusValue('isCharacter', 1)
        if (typeof(charConf) === 'object') {
            setTimeout(function() {
                walkCharToStart(charConf, character)
            }, 10*(MATH.sillyRandom(characters.length)+0.5))
        }
    }

    GameAPI.composeCharacter(charId, charCB)
}

let indicatedTiles = [];

function processEncounterGridTilePath(tilePath, encounterGrid) {
    let pathTiles = tilePath.pathTiles;

    while (indicatedTiles.length) {
        let tile = indicatedTiles.pop()
        if (tile.visualTile) {
            tile.visualTile.clearExitSelection()
        }
    }

    for (let i = 0; i < pathTiles.length; i++) {

            let encounterTile = encounterGrid.getTileAtPosition(pathTiles[i].getPos());
            if (encounterTile.isExit) {

                if (indicatedTiles.indexOf(encounterTile) === -1) {
                    encounterTile.visualTile.indicateExitSelection();
                    indicatedTiles.push(encounterTile)
                }

        }

    }

}


export {
    positionPlayer,
    resetScenarioCharacterPiece,
    setupEncounterGrid,
    filterForWalkableTiles,
    getTileForPosition,
    getTileForScreenPosition,
    buildScenarioCharacter,
    processEncounterGridTilePath
}