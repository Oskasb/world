import { ThreeAPI } from '../../3d/three/ThreeAPI.js';
import { EffectAPI } from "../../3d/particles/EffectAPI.js";
import { GuiAPI} from "../ui/gui/GuiAPI.js";
import { UiSetup } from "../ui/gui/UiSetup.js";
import { InstanceAPI } from '../../3d/three/instancer/InstanceAPI.js';
import { DomUtils } from '../ui/dom/DomUtils.js';
import { DataLoader } from '../load/DataLoader.js';
import { GameAPI } from "../../game/GameAPI.js";
import { Connection} from "../../Transport/io/Connection.js";


class Setup {

    constructor() {
        //   window.GuiAPI = new GuiAPI()
        window.DomUtils = new DomUtils();
        this.dataLoader = new DataLoader();
        this.uiSetup = new UiSetup();
    }

    initDefaultUi = function() {

        this.uiSetup.setupDefaultUi()
        let connection = new Connection();

        let stamp = 0;

        let onConnected = function(event) {
            console.log("Connected Event:", event)
            if (stamp === 0) {
                stamp = MATH.decimalify(event.timeStamp*1000 + new Date().getTime(), 1);
                client.setStamp(stamp);
            //    let msg = {}
            //    msg[ENUMS.Send.CONNECTED] = stamp;
            //    client.evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, msg)
            }

            evt.on(ENUMS.Event.SEND_SOCKET_MESSAGE, connection.call.sendMessage)


        }

        let onError = function(event) {
            console.log("socket error: ", event)
        }

        let onDisconnect = function() {
            console.log("socket disconnected")
        }

        connection.setupSocket(onConnected, onError, onDisconnect)
    };

    initUiSetup(callback) {
        this.uiSetup.initUiSetup(callback)
    }

    initGlobalAPIs() {
        window.EffectAPI = new EffectAPI();

        window.InstanceAPI = new InstanceAPI();

        window.ThreeAPI = new ThreeAPI();
        window.GuiAPI = new GuiAPI();
        window.GameAPI = new GameAPI();
        window.evt = client.evt;
    }

    initDataPipeline(pipelineReadyCB) {
        let dataLoader = this.dataLoader;
        let ready = {
            JSON_PIPE:false,
            IMAGE_PIPE:false
        };

        let pipeReady = function(msg, pipeName) {
            //    console.log('pipeReady', msg, pipeName)
            ready[pipeName] = true;
            if (ready.JSON_PIPE && ready.IMAGE_PIPE) {
                pipelineReadyCB();
            }
        };

        let pipeMsgCB = function(src, channel, msg) {
        //    console.log(src, channel, msg)
        //    dataLoader.getLoadScreen().logMessage(msg, '#af8', channel);
        };

        PipelineAPI.initConfigCache(pipeReady, pipeMsgCB);

    };

    initConfigCache(pipelineAPI, dataPipelineSetup) {
        let dataLoader = this.dataLoader;
        let onErrorCallback = function(err) {
            console.log("Data Pipeline Error:", err);
        };

        let onPipelineReadyCallback = function(msg) {
        //    console.log("Pipeline:", msg)
            setTimeout(function() {
                dataLoader.notifyCompleted();


            }, 50);
        };

        dataLoader.loadData(dataPipelineSetup, onPipelineReadyCallback, onErrorCallback);
    }

}

export { Setup }
