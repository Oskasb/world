import * as ScenarioUtils from "../gameworld/ScenarioUtils.js";
import { ConfigData } from "../../application/utils/ConfigData.js";
import { EncounterGrid } from "./EncounterGrid.js";
import { SpawnPattern } from "./SpawnPattern.js";
let camParams = {}
class EncounterDynamicScenario {
    constructor(dataId) {
        this.victoryConditionMet = false;
        this.dataId = dataId;
        this.pieces = GameAPI.getWorldItemPieces();
        this.characters = [];
        this.spawnPatterns = [];
        this.onUpdateCallbacks = []
        this.configData =  new ConfigData("DYNAMIC_SCENARIOS", "GAME_SCENARIOS",  'dynamic_view_init', 'data_key', 'config')
        this.isActive = false;

        this.encounterGrid = new EncounterGrid();


        GameAPI.getGameCamera().getDefaultCamParams(camParams)

        let applyCamParams = function(camConf) {
            GameAPI.getGameCamera().buildCameraParams(camConf, camParams)
        }

        let updateCamera = function() {
            GameAPI.getGameCamera().updatePlayerCamera(camParams)
        };

        let setConfig = function(config) {
            this.config = config;
        }.bind(this)

        let getConfig = function() {
            return this.config;
        }.bind(this)

        this.call = {
            applyCamParams:applyCamParams,
            updateCamera:updateCamera,
            setConfig:setConfig,
            getConfig:getConfig
        }

    }

    initEncounterDynamicScenario(onReady) {
        this.isActive = true;
        let onConfig = function(config, updateCount) {
            if (!this.isActive) return;
        //    console.log("Update Count: ", updateCount, config)
            if (updateCount) {
                GuiAPI.printDebugText("REFLOW DYNAMIC SCENARIO")
                this.exitScenario();
            } else {
                setTimeout(function() {
                    onReady(this);
                }, 0);
            }
            this.applyScenarioConfig(config, updateCount);
        }.bind(this)

        this.configData.parseConfig(this.dataId, onConfig)

    }



    activateEncDynScenario() {
    let config = this.config;

        let pageReady = function(page) {
    //        console.log("PAGE READY", page);
            if (config.INFO) {
                evt.dispatch(ENUMS.Event.SCENARIO_HEADER,  {value:config.INFO['header']});
                evt.dispatch(ENUMS.Event.SCENARIO_TEXT,    {value:config.INFO['text_box']});
            }
        }

        this.page = GuiAPI.activatePage(this.config['gui_page'], pageReady);

        if (config['camera']) {
   //         console.log("Set Camera mode: ", config.camera)
            let camParams = this.buildCameraParams();
            this.call.applyCamParams(camParams);
            let camFollow = this.call.updateCamera;
            setTimeout(function() {
                GameAPI.registerGameUpdateCallback(camFollow)
            }, 200)
        }
    }

    buildCameraParams = function() {

        let cConf = this.config.camera;
        let camParams = {}
        camParams.offsetPos = cConf['offset_pos'];
        camParams.offsetLookAt = cConf['offset_lookAt'];
        return camParams

    }

    applyScenarioConfig = function(config, isUpdate) {
        this.call.setConfig(config);
        this.config = config;
        if (config['grid']) {
            this.encounterGrid.initEncounterGrid(config.grid);
        }
        PipelineAPI.setCategoryData('ACTIVE_SCENARIO', config)

        let pageReady = function(page) {

        }

        if (!isUpdate) GuiAPI.activatePage(null, pageReady);

        evt.dispatch(ENUMS.Event.ADVANCE_ENVIRONMENT,  {envId:config['environment'], time:50});

        let pieces = this.pieces;
        let characters = this.characters;


        ScenarioUtils.resetScenarioCharacterPiece(GameAPI.getMainCharPiece());
        let companions = GameAPI.getMainCharPiece().companions
        for (let i = 0; i < companions.length; i++) {
            ScenarioUtils.resetScenarioCharacterPiece(companions[i]);
        }


        if (this.encounterGrid.gridTiles.length) {
            let tPos = this.encounterGrid.getPlayerStartTile().obj3d.position;
            let sPos = this.encounterGrid.getPlayerEntranceTile().obj3d.position;
            if (config['player']) ScenarioUtils.positionPlayer(config['player'], tPos, sPos);
        } else {
            if (config['player']) ScenarioUtils.positionPlayer(config['player']);
        }



        if (config['spawn_patterns']) {
            for (let i = 0; i < config['spawn_patterns'].length; i++) {
                let pattern = new SpawnPattern(config['spawn_patterns'][i])
                pattern.applySpawnPattern(this.encounterGrid, characters, pieces);
                this.spawnPatterns.push(pattern)
            }
        }

        if (config['characters']) {
            for (let i = 0; i < config.characters.length; i++) {
                let char =  config.characters[i];
                ScenarioUtils.buildScenarioCharacter(char['character'], characters, char)
            }
        }

        if(config.spawn) {

            for (let i = 0; i < config.spawn.length; i++) {
                let spawn = config.spawn[i];
                let pieceInstanceCallback = function(gamePiece) {
                    gamePiece.setStatusValue('isItem', 1)
                    pieces.push(gamePiece);
                    gamePiece.getSpatial().setPosXYZ(spawn.pos[0],spawn.pos[1], spawn.pos[2])
                    gamePiece.getSpatial().setRotXYZ(spawn.rot[0],spawn.rot[1], spawn.rot[2])
                    gamePiece.getSpatial().stickToObj3D(gamePiece.getSpatial().obj3d);
                    if (!gamePiece.modelInstance.originalModel.geometryInstancingSettings()) {
                        ThreeAPI.showModel(gamePiece.getSpatial().obj3d);
                    }
                    GameAPI.addPieceToWorld(gamePiece);
                };

                GameAPI.createGamePiece(spawn, pieceInstanceCallback)
            }
        }
    };

    getEncounterGrid() {
        return this.encounterGrid;
    }

    exitScenario() {
        GameAPI.unregisterGameUpdateCallback(this.call.updateCamera)
        evt.dispatch(ENUMS.Event.MAIN_CHAR_SELECT_TARGET, {piece:null, value:false });
        this.isActive = false;
        GuiAPI.guiPageSystem.closeGuiPage(this.page);
        while (this.pieces.length) {
            let piece = this.pieces.pop();
        //    if (!piece.pieceState.status.following) {
                piece.disbandGamePiece()
        //    }
        }

        while (this.characters.length) {
            let char = this.characters.pop();
            char.dismissCharacter();
        }
        this.encounterGrid.removeEncounterGrid();
    };

    tickScenario(tpf, scenarioTime) {
        if (this.victoryConditionMet === false) {
            let evilChars = 0;
            let deadEvilChars = 0;
            for (let i = 0; i < this.characters.length; i++) {
                let charPiece = this.characters[i].gamePiece;
                if (charPiece.getStatusByKey('faction') === 'EVIL') {
                    evilChars++;
                    if (charPiece.isDead === true) {
                        deadEvilChars++
                    }
                }
            }

            if (evilChars) {
                if (evilChars === deadEvilChars) {
                    GuiAPI.guiPageSystem.closeGuiPage(this.page);
                    let pageReady = function() {

                    }

                    let config = this.call.getConfig();
                    this.page = GuiAPI.activatePage(config['victory_page'], pageReady);
                    this.victoryConditionMet = true;
                }
            }
        }


    }

}

export {EncounterDynamicScenario}