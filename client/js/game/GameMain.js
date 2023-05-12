import { GameScenario }  from "./gameworld/GameScenario.js";
import { GameCamera } from "../3d/camera/GameCamera.js";
import { ConfigData } from "../application/utils/ConfigData.js";
import { GameWorld } from "./gameworld/GameWorld.js";
import { PlayerMain } from "./Player/PlayerMain.js";
import { CharacterComposer } from "./Player/CharacterComposer.js";
import { Vector3 } from "../../libs/three/math/Vector3.js";

let tempVec3 = new Vector3()


class GameMain {
    constructor() {

        let timeRemaining = function() {
            return this.turnStatus.turnProgress * this.turnStatus.turnTime;
        }.bind(this)

        this.turnStatus = {
            totalTime:0,
            turnTime:4,
            turnProgress:0,
            turn:0,
            timeRemaining:timeRemaining,
            autoPause:0,
            pauseRemaining:0,
            pauseProgress:0,
            pauseTurn:0
        }

        let togglePause = function(event) {

            if (this.turnStatus.autoPause === 0) {
                this.turnStatus.autoPause = event['pause_duration'];
                this.turnStatus.pauseTurn = this.turnStatus.turn;
            } else {
                this.turnStatus.autoPause = 0
            }


            console.log("Toggle pause", event, this.turnStatus);
        }.bind(this)

        evt.on(ENUMS.Event.TOGGLE_AUTO_TURN_PAUSE, togglePause)

        this.activeScenario = null;
        this.callbacks = {};
        this.gameTime = 0;
        this.configData = new ConfigData("WORLD_SYSTEMS", "GAME_SCENARIOS");
        this.navPointConfigData = new ConfigData("WORLD_SYSTEMS", "WORLD_NAV_POINTS");

        let updateNavpoint = function() {
            this.applyNavPoint();
        }.bind(this)

        this.navPointConfigData.addUpdateCallback(updateNavpoint);

        this.gameCamera = new GameCamera();
        this.gameWorld = new GameWorld();
        this.playerMain = new PlayerMain();
        this.onUpdateCallbacks = [];
        this.onTurnCallbacks = []
    }

    setupCallbacks = function () {
        let callbacks = this.callbacks;
        let _this = this;

        callbacks.updateGameFrame = function (frame) {
            _this.updateGameMain(frame)
        };
        callbacks.requestScenario = function (event) {
            _this.requestScenario(event)
        }

    };

    initGameMain() {
        this.setupCallbacks();
        let charReady = function(char) {
//            console.log("Player Char:", char)
            GameAPI.getPlayerMain().setPlayerCharacter(char);

            let initPlayerStash = function() {
                let itemCallback = function(gamePiece) {
                    GameAPI.getPlayerMain().playerStash.findPositionInStash(tempVec3);
                    gamePiece.getSpatial().setPosVec3(tempVec3);
                    GameAPI.getPlayerMain().callbacks.addToStash(gamePiece);
                }.bind(this);
                /*
                                GameAPI.createGamePiece({piece:"BELT_BRONZE"        }, itemCallback);
                                GameAPI.createGamePiece({piece:"HELMET_VIKING"      }, itemCallback);
                                GameAPI.createGamePiece({piece:"BELT_PLATE"         }, itemCallback);
                                GameAPI.createGamePiece({piece:"LEGS_CHAIN"         }, itemCallback);
                                GameAPI.createGamePiece({piece:"BOOTS_SCALE"        }, itemCallback);
                                GameAPI.createGamePiece({piece:"GLOVES_SCALE"       }, itemCallback);
                                GameAPI.createGamePiece({piece:"SHIRT_SCALE"        }, itemCallback);
                                GameAPI.createGamePiece({piece:"LEGS_SCALE"         }, itemCallback);
                                GameAPI.createGamePiece({piece:"LEGS_BRONZE"        }, itemCallback);
                                GameAPI.createGamePiece({piece:"BREASTPLATE_BRONZE" }, itemCallback);
                                GameAPI.createGamePiece({piece:"SHIRT_CHAIN"        }, itemCallback);
                */
            }

            initPlayerStash()
            evt.dispatch(ENUMS.Event.REQUEST_SCENARIO, {
                id:"home_scenario",
                dynamic:"encounter_front_yard_home_dynamic"
            });

        }.bind(this)

        GameAPI.composeCharacter("PLAYER_MAIN", charReady)
        evt.on(ENUMS.Event.REQUEST_SCENARIO, this.callbacks.requestScenario);
        evt.on(ENUMS.Event.FRAME_READY, this.callbacks.updateGameFrame)

    }

    addGameUpdateCallback(callback) {
        if (this.onUpdateCallbacks.indexOf(callback) !== -1) {
            console.log("updateCb already added...")
            return;
        }
        this.onUpdateCallbacks.push(callback);
    }

    getPlayerCharacter() {
        return this.playerMain.playerCharacter
    }
    removeGameUpdateCallback(callback) {
        return MATH.quickSplice(this.onUpdateCallbacks, callback);
    }


    applyNavPoint() {

        if (!this.dynamicId) return;

        let navPointData = this.navPointConfigData.parseConfigData()['world_dynamic_navpoints'];
        let navConf = navPointData.config;
        let navPoint = navConf[this.dynamicId]['camera'];

        let camCallback = function() {
            if (this.activeScenario) {
                if (this.activeScenario.activateDynamicScenario) {
                    this.activeScenario.activateDynamicScenario()
                }
            }
        }.bind(this);
        navPoint.callback = camCallback;

        evt.dispatch(ENUMS.Event.SET_CAMERA_TARGET, navPoint);
    }

    requestScenario(scenarioEvent) {
        evt.dispatch(ENUMS.Event.MAIN_CHAR_SELECT_TARGET, {piece:null, value:false });
        let scenarioId = scenarioEvent['id']
        let dynamicId = scenarioEvent['dynamic']
        this.dynamicId = dynamicId;
        let data = this.configData.parseConfigData()[scenarioId];
        let config = data.config;
        let staticId = config['scenario_static'];
        this.applyNavPoint();

        let dynamicReady = function(dynScen) {

        }

        let staticReadyCB = function() {
            this.activeScenario.initGameDynamicScenario(dynamicId, dynamicReady)
        }.bind(this)

        if (this.activeScenario) {
            if (this.activeScenario.scenarioId === scenarioId) {

                staticReadyCB();
                return;
            }
        }
        this.closeGameScenario();
        this.initGameScenario(scenarioId, staticId, staticReadyCB)

    }

    initGameScenario(scenarioId, staticId, staticReadyCB) {
        if (this.activeScenario) {
            if (this.activeScenario.scenarioId !== scenarioId) {
                console.log("Game Scenario already active... cancelling change")
                return;
            } else {
                this.closeGameScenario();
            }
        }

        let scenario = new GameScenario(scenarioId);
        this.activeScenario = scenario;
        scenario.initGameStaticScenario(staticId, staticReadyCB);
    }

    closeGameScenario() {
        if (!this.activeScenario) {
            //    console.log("No Game Scenario active... cancelling")
        } else {
            let scenario = this.activeScenario;
            this.activeScenario = null;
            scenario.exitGameScenario();
        }


    }

    addGameTurnCallback(callback) {
        if (this.onTurnCallbacks.indexOf(callback) !== -1) {
            console.log("updateCb already added...")
            return;
        }
        this.onTurnCallbacks.push(callback);
    }

    removeGameTurnCallback(callback) {
        return MATH.quickSplice(this.onTurnCallbacks, callback);
    }

    updateMainGameTurn(frame) {


        this.turnStatus.pauseRemaining -= frame.tpf;
        let pProg = this.turnStatus.pauseRemaining / this.turnStatus.autoPause;
        this.turnStatus.pauseProgress = MATH.clamp(pProg, 0, 1);
        if (this.turnStatus.pauseProgress !== 0) {
            frame.tpf = 0;
            return;
        }

        if (typeof (frame.tpf) !== 'number') {
            console.log("Tpf not number... investigate!")
            return;
        }

        this.turnStatus.totalTime += frame.tpf;
        let turnTime = this.turnStatus.turnTime;
        this.turnStatus.turnProgress -= frame.tpf / turnTime;
        if (this.turnStatus.turnProgress < 0) {

            this.turnStatus.turn++;
            this.turnStatus.turnProgress++;

            if (this.turnStatus.autoPause !== 0) {
                this.turnStatus.pauseTurn = this.turnStatus.turn
                if (GameAPI.getMainCharPiece().getStatusByKey('charState') !== ENUMS.CharacterState.IDLE_HANDS) {
                    this.turnStatus.pauseRemaining = this.turnStatus.autoPause;
                }
            }

            MATH.callAll(this.onTurnCallbacks, this.turnStatus)

        }
    }

    updateGameMain(frame) {

        this.updateMainGameTurn(frame);
        this.gameTime = this.turnStatus.totalTime;

        if (this.activeScenario) {
            this.activeScenario.tickGameScenario(frame);
        }

        for (let i = 0; i < this.onUpdateCallbacks.length; i++) {
            this.onUpdateCallbacks[i](frame.tpf, this.gameTime)
        }

    }

}

export {GameMain};