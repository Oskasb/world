import { CharacterComposer } from "./Player/CharacterComposer.js";
import { GameCharacter } from "./character/GameCharacter.js";
import { GamePiece } from "./gamepieces/GamePiece.js";
import { GameMain } from "./GameMain.js";
import { GameWorldPointer } from "../application/ui/input/GameWorldPointer.js";
import { GameCamera } from "../3d/camera/GameCamera.js";
import { WorldModels } from "./gameworld/WorldModels.js";
import { GamePieceSystem } from "./GamePieceSystem.js";
import { GameEncounterSystem } from "./GameEncounterSystem.js";

let gamePieceSystem = new GamePieceSystem();
let gameEncounterSystem = new GameEncounterSystem()
let gameCamera = new GameCamera();

class GameAPI {
    constructor() {
        this.activePlayerCharacter = null;
        this.characterComposer = new CharacterComposer();
        this.gameWorldPointer = new GameWorldPointer();
        this.gameMain = new GameMain();

        let activateWalkGrid = function() {
            let walkGrid = this.gameMain.call.activateGameWalkGrid(ThreeAPI.getCameraCursor().getCursorObj3d())
        }.bind(this);

        let activateBattleMode = function(event) {
            gameEncounterSystem.activateEncounter(event);
            this.gameMain.call.activateGameBattleMode(event)
        }.bind(this);

        let travelToPos = function(event) {
            let selectedActor = gamePieceSystem.getSelectedGameActor();

            if (selectedActor) {
                MATH.vec3FromArray(selectedActor.getPos(), event.pos)
            }

            MATH.vec3FromArray(ThreeAPI.getCameraCursor().getPos(), event.pos)

        }

        this.call = {
            activateWalkGrid:activateWalkGrid,
            activateBattleMode:activateBattleMode,
            travelToPos:travelToPos
        }

    }

    getTilePath(fromVec3, toVec3) {
        return this.gameMain.generateDynamicPath(fromVec3, toVec3);
    }

    processTilePath(tilePath, cursorObj3d) {
        this.gameMain.applyDynamicPathToObj3d(tilePath, cursorObj3d);
    }

    initGameMain() {
        gamePieceSystem.initGamePieceSystem()
        this.gameMain.initGameMain();
    }

    getGamePieceSystem() {
        return gamePieceSystem;
    }

    initGameWorldModels() {
        this.worldModels = new WorldModels();
    }

    getWorldModelHeightAtPos(posVec3, boxHeight) {
        return this.worldModels.queryWorldModelHeight(posVec3, boxHeight)
    }

    getPlayerMain() {
        return this.gameMain.playerMain;
    }

    createGameCharacter(config) {
        return new GameCharacter(config);
    };

    getGameCamera() {
        return gameCamera;
    }

    composeCharacter(gameCharConfigId, callback) {
        this.characterComposer.composeCharacter(gameCharConfigId, callback)
    }
    createGamePiece(pieceConfig, callback) {
        return new GamePiece(pieceConfig, callback)
    }

    addItemToPlayerInventory(itemPiece, transitionTime) {
        this.getActivePlayerCharacter().pickupItem(itemPiece, transitionTime)
    }

    getWorldItemPieces() {
        return this.gameMain.gameWorld.itemPieces
    }

    addPieceToWorld(piece) {
        this.gameMain.gameWorld.gameWorldRegisterPiece(piece)
    }

    takePieceFromWorld(piece) {
        return this.gameMain.gameWorld.gameWorldReleasePiece(piece)
    }

    inactivateWorldPiece(piece) {
        this.gameMain.gameWorld.gameWorldInactivatePiece(piece)
    }

    getGameTime = function() {
        if (!this.gameMain) {
            return 0
        }
        let time = client.getFrame().systemTime;

        return time;
    }

    getFrame = function() {
        return client.getFrame();
    }

    getTurnStatus() {
        return this.gameMain.turnStatus;
    }

    setActivePlayerCharacter(character) {
        this.activePlayerCharacter = character;
    }

    getActivePlayerCharacter() {
        return this.gameMain.getPlayerCharacter();
    }

    pieceIsMainChar(gamePiece) {
        return gamePiece === this.getMainCharPiece()
    }

    getMainCharPiece = function() {
        return this.gameMain.getPlayerCharacter().gamePiece
    }

    getActiveDynamicScenario() {
        let activeScenario = this.gameMain.activeScenario;
        let loadedScenarios = activeScenario.dynamicScenario
        if (loadedScenarios) {
            if (loadedScenarios.loadedDynamicScenarios.length) {
                return loadedScenarios.loadedDynamicScenarios[0];
            }
        }
    }
    getActiveScenarioCharacters() {
        let activeScen = this.getActiveDynamicScenario()
        if (activeScen)
        return activeScen.characters;
    };

    getActiveEncounterGrid() {
        let dynScen = this.getActiveDynamicScenario()
        if (typeof (dynScen) !== 'object') {
        //    console.log("bad scenario logic, fix!")
            return;
        }
        if (dynScen) {
            let grid = dynScen.encounterGrid;
            if (typeof (grid) === 'undefined') {
                console.log("Bad encounter grid logic... fix!")
                return null;
            }
            return grid;
        }
    }
    handleWorldSpacePointerUpdate(pointer, start, release) {

        if (release) {
            this.gameWorldPointer.worldPointerReleased(pointer);
        } else {
            this.gameWorldPointer.updateWorldPointer(pointer, start);
        }

    }

    getSelectedCompanion() {
        return this.gameMain.playerMain.partyLeaderSystem.getSelectedCompanion();
    }

    deactivateWorldSpacePointer(pointer) {
        this.gameWorldPointer.worldPointerDeactivate(pointer);
    }

    registerGameUpdateCallback(callback) {
        this.gameMain.addGameUpdateCallback(callback);
    }

    unregisterGameUpdateCallback(callback) {
        return this.gameMain.removeGameUpdateCallback(callback);
    }

    registerGameTurnCallback(callback) {
        this.gameMain.addGameTurnCallback(callback);
    }

    unregisterGameTurnCallback(callback) {
        return this.gameMain.removeGameTurnCallback(callback);
    }
}

export { GameAPI }