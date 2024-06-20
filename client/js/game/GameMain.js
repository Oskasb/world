import { ConfigData } from "../application/utils/ConfigData.js";
import { GameWorld } from "./gameworld/GameWorld.js";
import { PlayerMain } from "./Player/PlayerMain.js";
import { CharacterComposer } from "./Player/CharacterComposer.js";
import { Vector3 } from "../../libs/three/math/Vector3.js";
import { GameWalkGrid } from "./gameworld/GameWalkGrid.js";
import { PhysicalWorld } from "./gameworld/PhysicalWorld.js";
import {getPlayerStatus, setPlayerStatus} from "../application/utils/StatusUtils.js";
import {ENUMS} from "../application/ENUMS.js";
import {getUrlParam, isDev} from "../application/utils/DebugUtils.js";
import {DomNewPlayer} from "../application/ui/dom/DomNewPlayer.js";
import {
    getLocalAccount, getLocalAccountStatus, loadActorStatus, loadPlayerStatus,
    storeLocalAccountStatus,
    storePlayerActorStatus,
    storePlayerStatus
} from "../application/setup/Database.js";
import {initLoadedPlayerState, loadStoredPlayer} from "../application/utils/PlayerUtils.js";

let tempVec3 = new Vector3()
let gameWalkGrid = null
let worldLevels = {};

function worldLevelsUpdate(data) {
    for (let i = 0; i < data.levels.length; i++) {
        worldLevels[data.levels[i].id] = data.levels[i];
    }
}
setTimeout(function() {
    let worldLevelsConfig = new ConfigData("WORLD_SYSTEMS", "WORLD_LEVELS");
    worldLevelsConfig.addUpdateCallback(worldLevelsUpdate);
}, 1000)


function activateLoadedPlayer() {

    let loginCount = getLocalAccountStatus(ENUMS.AccountStatus.LOGIN_COUNT)
    storeLocalAccountStatus(ENUMS.AccountStatus.LOGIN_COUNT, loginCount+1);
    storePlayerStatus();

    setTimeout(function() {
        GuiAPI.activateMinimap();
        GameAPI.gameAdventureSystem.call.activateAdventures()
    }, 1000)

}

function activateNewPlayer() {
    console.log("activateNewPlayer:", GameAPI.getPlayerMain());

    let playerId = 'PLAYER_'+client.getStamp();
    setPlayerStatus(ENUMS.PlayerStatus.PLAYER_ID, playerId);
    storeLocalAccountStatus(ENUMS.PlayerStatus.PLAYER_ID, playerId);
    storeLocalAccountStatus(ENUMS.AccountStatus.INIT_TIME, new Date().getTime());
    storeLocalAccountStatus(ENUMS.AccountStatus.LOGIN_COUNT, 0);
    activateLoadedPlayer()

}

function startPlayerSession() {


    new DomNewPlayer(activateNewPlayer);
    // client.page = GuiAPI.activatePage('page_start')
    // GameAPI.gameAdventureSystem.call.activateAdventures()
}

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

        this.gameWorld = new GameWorld();
        this.phyiscalWorld = new PhysicalWorld();
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

    getWorldLevelConfig(id) {
        if (!id) {
            return worldLevels;
        }
        if (!worldLevels[id]) {
            console.log("No world level config for id: ", id, worldLevels);
        }
        return worldLevels[id];
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

        setPlayerStatus(ENUMS.PlayerStatus.EDIT_MODE, isDev());

        if (isDev()) {
            console.log("Player Main Status:", GameAPI.getPlayerMain().status.statusMap)
            client.page = GuiAPI.activatePage('page_start')
            GameAPI.gameAdventureSystem.call.activateAdventures()
            GuiAPI.activateMinimap()
        } else {



            let account = getLocalAccount();
            console.log("Local Account; ", account);

            let dataList = {};

            if (getUrlParam('new') === true) {

            } else {
                loadStoredPlayer(dataList)
            }

            setTimeout(function() {

                if (typeof (dataList[ENUMS.ActorStatus.CONFIG_ID]) !== 'string') {
                    dataList['NEW USER'] = 'INIT';
                    GuiAPI.activateDomTransition('WELCOME', null, startPlayerSession)
                } else {

                    function loadedPlayerReady() {
                        GuiAPI.activateDomTransition('WELCOME BACK', dataList, activateLoadedPlayer)
                    }

                    initLoadedPlayerState(dataList, loadedPlayerReady);
                }

            }, 200)

        }

        evt.on(ENUMS.Event.FRAME_READY, this.callbacks.updateGameFrame)

    }

    addGameUpdateCallback(callback) {
        if (this.onUpdateCallbacks.indexOf(callback) !== -1) {
        //    console.log("updateCb already added...")
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