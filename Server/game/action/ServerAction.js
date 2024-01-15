import {getServerConfig, getServerStamp, parseConfigData} from "../utils/GameServerFunctions.js";
import {MATH} from "../../../client/js/application/MATH.js";
import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {Status} from "../status/Status.js";
import {SimpleUpdateMessage} from "../utils/SimpleUpdateMessage.js";

let castIndex = 0;

class ServerAction {
    constructor() {
        this.status = new Status();
        this.timeElapsed = 0;
        this.sequencing = null;
        this.statisticalActions = [];
        this.onActivateCallbacks = [];
        this.onCompletedCallbacks = [];
        this.updateMessage = new SimpleUpdateMessage();
    }

    buildActionMessage() {
        let msg = this.updateMessage.call.buildMessage(ENUMS.ActionStatus.ACTION_ID, this.status.statusMap, ENUMS.ClientRequests.APPLY_ACTION_STATUS, true)
            msg.command = ENUMS.ServerCommands.ACTION_UPDATE;
            msg.stamp = 'server';
            return msg;
    }

    initNewActionStatus(actionId, actor) {
        castIndex++;
        let statusMap = this.status.statusMap;
        statusMap[ENUMS.ActionStatus.ACTOR_ID] = actor.getStatus(ENUMS.ActorStatus.ACTOR_ID);
        statusMap[ENUMS.ActionStatus.ACTION_ID] = "action_"+castIndex+"_"+actionId;
        statusMap[ENUMS.ActionStatus.ACTION_KEY] = actionId;
        statusMap[ENUMS.ActionStatus.BUTTON_STATE] = ENUMS.ButtonState.UNAVAILABLE;
        statusMap[ENUMS.ActionStatus.ACTION_STATE] = ENUMS.ActionState.SELECTED;
        statusMap[ENUMS.ActionStatus.SELECTED] = true;
        statusMap[ENUMS.ActionStatus.TARGET_ID] = actor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET);
        statusMap[ENUMS.ActionStatus.STEP_START_TIME] = 0;
        statusMap[ENUMS.ActionStatus.STEP_END_TIME] = 0;
    }

    activateServerActionId(actionId, actor) {
        this.initNewActionStatus(actionId, actor);
        console.log("activateServerActionId", actionId, actor)
        this.timeElapsed = 0;
        let actionConfigs = getServerConfig("GAME_ACTORS")['ACTIONS'];
        let conf = parseConfigData(actionConfigs, actionId)
        this.sequencing = conf['sequencing'];
        let statActions = conf['statistical_actions'];

        let statConfigs = getServerConfig("GAME_ACTIONS")['STATISTICAL_ACTIONS'];

        MATH.emptyArray(this.statisticalActions);

        for (let i = 0; i < statActions.length; i++) {
            let statId = statActions[i];
            let statsConf = parseConfigData(statConfigs, statId);
            this.statisticalActions.push(statsConf)
            console.log("statsConf ", statsConf);
        }

        console.log("Action config ", conf);
    }

    updateServerAction(tpf) {

    }



}

export { ServerAction }