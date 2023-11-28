import { CharacterComposer } from "./Player/CharacterComposer.js";
import { GameCharacter } from "./character/GameCharacter.js";
import { GamePiece } from "./gamepieces/GamePiece.js";
import { GameMain } from "./GameMain.js";
import { GameWorldPointer } from "../application/ui/input/GameWorldPointer.js";
import { GameCamera } from "../3d/camera/GameCamera.js";
import { WorldModels } from "./gameworld/WorldModels.js";
import { GamePieceSystem } from "./GamePieceSystem.js";
import { GameEncounterSystem } from "./GameEncounterSystem.js";
import { VisualEffectSystem } from "./visuals/VisualEffectSystem.js";
import { GameAdventureSystem } from "./gamescenarios/GameAdventureSystem.js";

let cache = {};
let debugStats = {
    gameCBs:0,
    procTime: 0,
    boxes: 0,
    models: 0,
    tModels: 0,
    lodInfos: 0
};


let setupDebug = function(gameApi) {

    let gameMain = gameApi.gameMain

    let worldModels = gameApi.worldModels;
    let threeTerrain = ThreeAPI.getTerrainSystem().getTerrain();

    if (!cache['DEBUG']) {
        cache = PipelineAPI.getCachedConfigs();
        if (!cache['DEBUG']) {
            cache.DEBUG = {};
        }
    }

    if (!cache['DEBUG']['WORLD']) {
        cache.DEBUG.WORLD = debugStats;
    }


    let getTerrainModelCount = function() {
        let terrainGeos = threeTerrain.call.getTerrainGeos();
        let geo = terrainGeos[0][0];
        return geo.terrainElementModels.getModelCount();
    }

    let getTerrainInforsCount = function() {
        let terrainGeos = threeTerrain.call.getTerrainGeos();
        for (let i = 0; i < terrainGeos.length; i++) {
            for (let j = 0; j < terrainGeos[i].length; j++) {
                let geo = terrainGeos[i][j];
                let sectionInfo = geo.terrainSectionInfo;
                let infoLevels = sectionInfo.lodLevels;
                for (let l in infoLevels) {
                    if (infoLevels[l].length) {
                        return infoLevels[l][0].getCount();
                    }

                }
            }
        }
    }

    let collectDebugStats = function() {

        debugStats.gameCBs = gameMain.onUpdateCallbacks.length;
        debugStats.visGeos = ThreeAPI.getTerrainSystem().getTerrain().call.getTerrainBigGeo().getVisibleCount();
        debugStats.procTime = (gameMain.frameEnd - gameMain.frameStart) * 1000;
        debugStats.model = worldModels.getWorldModelCount();
        debugStats.boxes = worldModels.getWorldBoxCount()


        debugStats.tModels = getTerrainModelCount();
        debugStats.lodInfos = getTerrainInforsCount();




    }

    evt.on(ENUMS.Event.COLLECT_DEBUG_STATS, collectDebugStats)
}

let gamePieceSystem = new GamePieceSystem();
let gameEncounterSystem = new GameEncounterSystem()

let gameCamera = new GameCamera();

let parameters = {
    brush_size : 2,
    dig_strength: 2,
}

function getPartySelection() {
    return gamePieceSystem.getPlayerParty().getPartySelection();
}

function getSequencerSelection() {
    return gameEncounterSystem.getEncounterTurnSequencer().getSequencerSelection()
}

function getTurnActiveSequencerActor() {
    return gameEncounterSystem.getEncounterTurnSequencer().getActiveSequencerActor()
}

class GameAPI {
    constructor() {
        this.activePlayerCharacter = null;
        this.gameAdventureSystem = new GameAdventureSystem();
        this.characterComposer = new CharacterComposer();
        this.gameWorldPointer = new GameWorldPointer();
        this.gameMain = new GameMain();
        let visualEffectSystem = new VisualEffectSystem()


        let activateBattleMode = function(event) {
            gameEncounterSystem.activateEncounter(event);
            GuiAPI.getWorldInteractionUi().closeWorldInteractUi();
            this.worldModels.deactivateEncounters();
        }.bind(this);

        let getActiveEncounter = function() {
            return gameEncounterSystem.call.getActiveEncounterGrid();
        }

        let getDynamicEncounter = function() {
            return gameEncounterSystem.call.getActiveDynamicEncounter();
        }

        let spawnWorldEncounters = function() {
            this.worldModels.activateEncounters();
        }.bind(this);

        let travelToPos = function(event) {
            let selectedActor = gamePieceSystem.getSelectedGameActor();

            if (selectedActor) {
                MATH.vec3FromArray(selectedActor.getSpatialPosition(), event.pos)
            }

            MATH.vec3FromArray(ThreeAPI.getCameraCursor().getPos(), event.pos)

        }

        let editGround = function(event) {
            let change = event.delta
            if (typeof (event.delta) === 'undefined') {
                change = -1;
            }
            change*=parameters['dig_strength']

            let size = event.size + parameters['brush_size'];
            if (event.pos) {
                ThreeAPI.digIntoGroundAt(event.pos, 5, - 2)
            } else {
                ThreeAPI.digIntoGroundAt(ThreeAPI.getCameraCursor().getPos(), size, change)
            }

        }

        let editParameters = function(event) {

            for (let key in event.params) {
                parameters[key] += event.params[key];
            }

        }

        let getGameEncounterSystem = function() {
            return gameEncounterSystem;
        }

        let selectAdventurer = function(event) {
            console.log("Select Adventurer:", event);
            this.gameAdventureSystem.selectAdventure(event);
        }.bind(this);

        this.call = {
            getTurnActiveSequencerActor:getTurnActiveSequencerActor,
            getGameEncounterSystem:getGameEncounterSystem,
            activateBattleMode:activateBattleMode,
            spawnWorldEncounters:spawnWorldEncounters,
            getActiveEncounter:getActiveEncounter,
            getDynamicEncounter:getDynamicEncounter,
            travelToPos:travelToPos,
            editGround:editGround,
            editParameters:editParameters,
            getSequencerSelection:getSequencerSelection,
            getPartySelection:getPartySelection,
            selectAdventurer:selectAdventurer
        }

    }


    getWorldEncounterByHost(id) {
        return this.worldModels.getEncounterByHostActorId(id);
    }

    getWorldEncounterByEncounterId(id) {
        return this.worldModels.getEncounterById(id);
    }

    getActorById(actorId) {
        let actors = gamePieceSystem.getActors();
        for (let i = 0; i < actors.length; i++) {
            let actor = actors[i];
            if (actor.id === actorId) {
                return actor
            }
        }
        //    console.log("No actor by index; ", index, actors);

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
        setupDebug(this);
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