import { ConfigData } from "../application/utils/ConfigData.js";
import { GameWorld } from "./gameworld/GameWorld.js";
import { PlayerMain } from "./Player/PlayerMain.js";
import { CharacterComposer } from "./Player/CharacterComposer.js";
import { Vector3 } from "../../libs/three/math/Vector3.js";
import { GameWalkGrid } from "./gameworld/GameWalkGrid.js";

let tempVec3 = new Vector3()
let gameWalkGrid = null

class GameMain {
    constructor() {
        gameWalkGrid = new GameWalkGrid();
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

        this.gameWorld = new GameWorld();
        this.playerMain = new PlayerMain();
        this.onUpdateCallbacks = [];
        this.onTurnCallbacks = []

        let navPointGroup = null;

        let setActiveNavPointGroup = function(navPG) {
            navPointGroup = navPG;
            console.log("Activate Nav points", navPointGroup);
        }

        let renderActiveNavPointGroup = function() {
            let camLookPos = gameCamera.call.getLookAtPoint();
            for (let key in navPointGroup) {
                MATH.vec3FromArray(tempVec3, navPointGroup[key].camera.lookAt)
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:camLookPos, to:tempVec3, color:'AQUA'});
            }


        }.bind(this)


        this.call = {
            setActiveNavPointGroup:setActiveNavPointGroup,
            renderActiveNavPointGroup:renderActiveNavPointGroup
        }
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

    //    GameAPI.composeCharacter("PLAYER_MAIN", charReady)
    //    evt.on(ENUMS.Event.REQUEST_SCENARIO, this.callbacks.requestScenario);
        evt.on(ENUMS.Event.FRAME_READY, this.callbacks.updateGameFrame)

    }

    addGameUpdateCallback(callback) {
        if (this.onUpdateCallbacks.indexOf(callback) !== -1) {
        //    console.log("updateCb already added...")
            return;
        }
        this.onUpdateCallbacks.push(callback);
    }

    applyDynamicPathToObj3d( obj3d) {
        return gameWalkGrid.walkAlongPath(obj3d)
    }

    getGridTileAtPos(posVec) {
        return gameWalkGrid.getTileAtPosition(posVec)
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


    addGameTurnCallback(callback) {
        if (this.onTurnCallbacks.indexOf(callback) !== -1) {
        //    console.log("updateCb already added...")
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


    renderNavPoints = function(dataId) {

    }

    activateGameNavPoints = function(event) {
        console.log("Activate Nav Points", event)

        let navPointData = this.navPointConfigData.parseConfigData()[event['data_id']];
        let navConf = navPointData.config;

        this.call.setActiveNavPointGroup(navConf);

        if (this.onUpdateCallbacks.indexOf(this.call.renderActiveNavPointGroup) === -1) {
            GameAPI.registerGameUpdateCallback(this.call.renderActiveNavPointGroup)
        } else {
            GameAPI.unregisterGameUpdateCallback(this.call.renderActiveNavPointGroup)
        }

    //    let navPoint = navConf[this.dynamicId]['camera'];

    }

    updateGameMain(frame) {

        this.frameStart = performance.now();

        this.updateMainGameTurn(frame);
        this.gameTime = this.turnStatus.totalTime;

        if (this.activeScenario) {
            this.activeScenario.tickGameScenario(frame);
        }

        for (let i = 0; i < this.onUpdateCallbacks.length; i++) {
            this.onUpdateCallbacks[i](frame.tpf, this.gameTime)
        }

        this.frameEnd = performance.now();
    }

}

export {GameMain};