import { PipelineAPI } from '../data_pipeline/PipelineAPI.js';
import { MATH } from "./MATH.js";

window.PipelineAPI = new PipelineAPI();
window.MATH = MATH;


import { evt } from './event/evt.js';
import { GameScreen } from './ui/GameScreen.js';
import { PointerAndTouchCursors } from './ui/input/PointerAndTouchCursors.js';
import { Setup } from './setup/Setup.js';
import * as THREE from '../../libs/three/Three.js';
import { ThreeController } from '../3d/ThreeController.js';
import { DynamicMain } from '../3d/DynamicMain.js';
import {initPools, registerPool} from "./utils/PoolUtils.js";


let frame = {
    tpf:0.01,
    gameTime:0.01,
    systemTime:0.01,
    elapsedTime:0.01,
    frame:0
};
class Client {

    constructor( devMode, env ) {


        window.THREE = THREE;
        this.type = 'Client';
        this.devMode = devMode;
        this.env = env;
        this.evt = evt;
        evt.setEventKeys(ENUMS.Event)
        window.evt = this.evt;
        this.threeController = new ThreeController();

        this.gameScreen = new GameScreen();
        this.dynamicMain = new DynamicMain();
        window.GameScreen = this.gameScreen;
        this.setup = new Setup();
        this.INPUT_STATE = null;
        this.stamp = -1;
    }

    setStamp(stamp) {
        this.stamp = stamp
        evt.dispatch(ENUMS.Event.CALL_SERVER, {request:ENUMS.ClientRequests.REGISTER_PLAYER, stamp:stamp})
    }

    getStamp() {
        return this.stamp;
    }

    activateGui() {
        client.createScene();
        this.pointerCursor = new PointerAndTouchCursors(window.PipelineAPI, this.gameScreen);
        this.INPUT_STATE =  this.pointerCursor.getInputState();


    }

    initUiSystem() {

        this.threeController.setupThreeRenderer();

        //     console.log(this.INPUT_STATE);

    }

    initClientSetup(dataPipelineOptions) {
        this.gameScreen.registerAppContainer(document.body);
        document.body
        let pipeWorkersReadyCB = function() {
            client.setup.initConfigCache(window.PipelineAPI, dataPipelineOptions);
            initPools()
            client.initUiSystem();
        };

        this.setup.initDataPipeline(pipeWorkersReadyCB)
        this.setup.initGlobalAPIs();
    };

    getFrame() {
        return frame;
    }

    terrainReady() {
        GameAPI.initGameWorldModels();
    }

    createScene() {


        client.gameEffects = [];

        let callback = function() {



            setTimeout(function() {

                client.setup.initDefaultUi();
                GameAPI.initGameMain();
                ThreeAPI.initThreeTerrain();
                client.page = GuiAPI.activatePage('page_start');
                }, 10)
        };

        client.setup.initUiSetup(callback);

        this.evt.on(ENUMS.Event.SET_CAMERA_MODE, ThreeAPI.getCameraCursor().call.setCamMode);
        this.evt.on(ENUMS.Event.SET_CAMERA_TARGET, GameAPI.getGameCamera().call.setCameraTargetPosInTime)
        this.evt.on(ENUMS.Event.TRAVEL_TO,         GameAPI.call.travelToPos)
        this.evt.on(ENUMS.Event.GAME_MODE_BATTLE,    GameAPI.call.activateBattleMode)
        this.evt.on(ENUMS.Event.EDIT_GROUND,        GameAPI.call.editGround)
        this.evt.on(ENUMS.Event.EDIT_PARAMETERS,    GameAPI.call.editParameters)
        this.evt.on(ENUMS.Event.SELECT_ADVENTURER,    GameAPI.call.selectAdventurer)
        const clock = new THREE.Clock(true);



        function triggerFrame() {
            frame.frame ++;
            frame.tpf = clock.getDelta();
            frame.avgTpf = ThreeAPI.getSetup().avgTpf;
            frame.elapsedTime = clock.elapsedTime;


            if (Math.random() < 0.04) {
            //    client.evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, {"msg":"random ping"})
            //    GuiAPI.screenText('ping', ENUMS.Message.SYSTEM, 1);
            //    GuiAPI.screenText('ping', ENUMS.Message.HINT, 2);
            }

            ThreeAPI.updateCamera();
            GuiAPI.updateGui(frame.tpf, frame.elapsedTime);
            ThreeAPI.requestFrameRender(frame)

            client.evt.dispatch(ENUMS.Event.FRAME_READY, frame);
            requestAnimationFrame( triggerFrame );

            GameAPI.getGameCamera().call.applyFrame(frame)
            frame.gameTime = GameAPI.getGameTime();
            frame.systemTime += frame.tpf;

            ThreeAPI.applyDynamicGlobalUniforms();

            ThreeAPI.updateAnimationMixers(frame.tpf);
            ThreeAPI.updateSceneMatrixWorld();
            client.dynamicMain.tickDynamicMain();
            //     renderer.render(scene, camera)
            EffectAPI.updateEffectAPI();

            window.PipelineAPI.tickPipelineAPI(frame.tpf)

        }

        triggerFrame();

    }

}

export { Client };
