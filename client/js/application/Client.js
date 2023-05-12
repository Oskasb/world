import { PipelineAPI } from '../data_pipeline/PipelineAPI.js';
import { evt } from './event/evt.js';
import { GameScreen } from './ui/GameScreen.js';
import { PointerAndTouchCursors } from './ui/input/PointerAndTouchCursors.js';
import { Setup } from './setup/Setup.js';
import * as THREE from '../../libs/three/Three.js';
import { ThreeController } from '../3d/ThreeController.js';
import { DynamicMain } from '../3d/DynamicMain.js';

let frame = {
    tpf:0.01,
    gameTime:0.01,
    systemTime:0.01,
    elapsedTime:0.01
};
class Client {

    constructor( devMode, env ) {
        window.THREE = THREE;
        this.type = 'Client';
        this.devMode = devMode;
        this.env = env;
        this.evt = new evt(ENUMS.Event);
        window.evt = this.evt;
        this.threeController = new ThreeController();
        window.PipelineAPI = new PipelineAPI();
        this.gameScreen = new GameScreen();
        this.dynamicMain = new DynamicMain();
        window.GameScreen = this.gameScreen;
        this.setup = new Setup();
        this.INPUT_STATE = null;
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
            client.initUiSystem();
        };

        this.setup.initDataPipeline(pipeWorkersReadyCB)
        this.setup.initGlobalAPIs();
    };

    getFrame() {
        return frame;
    }
    createScene() {


        client.gameEffects = [];

        let callback = function() {
            setTimeout(function() {

                client.setup.initDefaultUi();
                GameAPI.initGameMain();
                }, 10)


        };

        client.setup.initUiSetup(callback);


        const clock = new THREE.Clock(true);



        function triggerFrame() {
            frame.tpf = clock.getDelta();

            frame.elapsedTime = clock.elapsedTime;


            ThreeAPI.updateCamera();
            GuiAPI.updateGui(frame.tpf, frame.elapsedTime);
            ThreeAPI.requestFrameRender(frame)
            requestAnimationFrame( triggerFrame );

            client.evt.dispatch(ENUMS.Event.FRAME_READY, frame);

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
