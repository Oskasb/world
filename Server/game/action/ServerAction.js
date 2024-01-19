import {
    getServerConfig,
    getServerStamp,
    parseConfigData,
    registerGameServerUpdateCallback, unregisterGameServerUpdateCallback
} from "../utils/GameServerFunctions.js";
import {MATH} from "../../../client/js/application/MATH.js";
import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {Status} from "../status/Status.js";
import {SimpleUpdateMessage} from "../utils/SimpleUpdateMessage.js";
import {StatisticalAction} from "../../../client/js/game/actions/StatisticalAction.js";
import {applyServerAction} from "./ServerActionFunctions.js";

let attackStateMap = [];

attackStateMap[ENUMS.ActionState.DISABLED] =  {updateFunc:'updateProgress'}
attackStateMap[ENUMS.ActionState.SELECTED] =  {updateFunc:'updateActivate'}
attackStateMap[ENUMS.ActionState.PRECAST] =   {updateFunc:'updateProgress'}
attackStateMap[ENUMS.ActionState.ACTIVE] =    {updateFunc:'updateActive'}
attackStateMap[ENUMS.ActionState.APPLY_HIT] = {updateFunc:'updateProgress'}
attackStateMap[ENUMS.ActionState.POST_HIT] =  {updateFunc:'updateProgress'}
attackStateMap[ENUMS.ActionState.COMPLETED] = {updateFunc:'updateActionCompleted'}


let transitionMap = []

transitionMap[ENUMS.ActionState.DISABLED]  =  ENUMS.ActionState.SELECTED
transitionMap[ENUMS.ActionState.SELECTED]  =  ENUMS.ActionState.PRECAST;
transitionMap[ENUMS.ActionState.PRECAST]   =   ENUMS.ActionState.ACTIVE
transitionMap[ENUMS.ActionState.ACTIVE]    =    ENUMS.ActionState.APPLY_HIT
transitionMap[ENUMS.ActionState.APPLY_HIT] = ENUMS.ActionState.POST_HIT
transitionMap[ENUMS.ActionState.POST_HIT]  =  ENUMS.ActionState.COMPLETED
transitionMap[ENUMS.ActionState.COMPLETED] = ENUMS.ActionState.DISABLED

let castIndex = 0;

class ServerAction {
    constructor() {
        this.status = new Status();
        this.status.statusMap[ENUMS.ActionStatus.STATUS_MODIFIERS] = [];
        this.timeElapsed = 0;
        this.sequencing = null;
        this.statisticalActions = [];
        this.onCompletedCallbacks = [];
        this.updateMessage = new SimpleUpdateMessage();


        this.stepProgress = 0;
        let stepDuration = 0;


        let activateAttackStateTransition = function() {
    //        console.log("activateAttackStateTransition")
            this.stepProgress = 0;

            let actionState = this.status.getStatus(ENUMS.ActionStatus.ACTION_STATE)
            //     console.log("ACTION_STATE", actionState)

                this.actor.setStatusKey(ENUMS.ActorStatus.ACTION_STATE_KEY, actionState)

            let newActionState = transitionMap[actionState];
        //    let newButtonState = buttonStateMap[newActionState];
        //    this.status.setStatusKey(ENUMS.ActionStatus.BUTTON_STATE, newButtonState)

            let key = ENUMS.getKey('ActionState', newActionState);
            stepDuration = this.getStepDuration(key);
            //     console.log("New Action State", newActionState, "Key: ", key);
            this.status.setStatusKey(ENUMS.ActionStatus.ACTION_STATE, newActionState)
            this.status.setStatusKey(ENUMS.ActionStatus.STEP_START_TIME, 0)
            this.status.setStatusKey(ENUMS.ActionStatus.STEP_END_TIME, stepDuration)
            let funcName = attackStateMap[newActionState].updateFunc
            this.call[funcName]();

        }.bind(this)


        let updateActivate = function(tpf) {
        //    this.visualAction.activateVisualAction(this);
        //    console.log("updateActivate")
        }.bind(this)

        let updateProgress = function(tpf) {
        //    console.log("updateProgress")
            //             console.log("Progress status... ")
        }.bind(this)

        let applyHitConsequences = function() {
        //    console.log("applyHitConsequences")
            let target = this.getTarget();

            if (!target) {
                console.log("No target found for action", this)
                return;
            }

            let modifiers = this.call.getStatus(ENUMS.ActionStatus.STATUS_MODIFIERS);
            MATH.emptyArray(modifiers);

                for (let i = 0; i < this.statisticalActions.length; i++) {
                    this.statisticalActions[i].applyStatisticalActionToTarget(target, modifiers, true)
                }

            this.serverEncounter.sendActionStatusUpdate(this);
            MATH.emptyArray(modifiers);
            this.serverEncounter.sendActorStatusUpdate(target);
            target.setStatusKey(ENUMS.ActorStatus.DAMAGE_APPLIED, 0)
            target.setStatusKey(ENUMS.ActorStatus.HEALING_APPLIED, 0)
        }.bind(this);

        let applyHit = function() {

            applyHitConsequences()
            activateAttackStateTransition()
        }

        let updateActive = function(tpf) {
            if (this.stepProgress === 0) {
            //    this.visualAction.visualizeAttack(applyHit);
                setTimeout(applyHit, 800)
            }
        }.bind(this)

        let updateActionCompleted = function(tpf) {
        //    console.log("updateActionCompleted")
            this.attackCompleted()
        }.bind(this)

        let updateAttack = function(tpf) {
            this.stepProgress += tpf;
        //    console.log("updateAttack", stepDuration, this.stepProgress, tpf)
            if (stepDuration < this.stepProgress) {
                activateAttackStateTransition()
            }
            this.serverEncounter.sendActionStatusUpdate(this);
            this.serverEncounter.sendActorStatusUpdate(this.actor);
        }.bind(this);

        let closeAttack = function() {
        //    console.log("closeAttack")
            this.attackCompleted();
        }.bind(this)

        let getStatus = function(key) {
            return this.status.getStatus(key);
        }.bind(this);

        let setStatusKey = function(key, status) {
            this.status.setStatusKey(key, status);
        }.bind(this)

        this.call = {
            applyHitConsequences:applyHitConsequences,
            updateActivate:updateActivate,
            updateProgress:updateProgress,
            updateActive:updateActive,
            updateActionCompleted:updateActionCompleted,
            updateAttack:updateAttack,
            closeAttack:closeAttack,
            getStatus:getStatus,
            setStatusKey:setStatusKey
        }

    }

    buildActionMessage() {
        let msg = this.updateMessage.call.buildMessage(ENUMS.ActionStatus.ACTION_ID, this.status.statusMap, ENUMS.ClientRequests.APPLY_ACTION_STATUS, true)
         if (msg) {
             msg.command = ENUMS.ServerCommands.ACTION_UPDATE;
             msg.stamp = 'server';
             return msg;
         }
    }

    getActor() {
        return this.actor;
    }

    getStepDuration(step) {
        if (!this.sequencing) {
            return 1;
        }

        if (typeof this.sequencing[step] === 'object') {
            return this.sequencing[step].time || 1;
        } else {
            return 1;
        }
    }

    getActionKey() {
        return this.call.getStatus(ENUMS.ActionStatus.ACTION_KEY)
    }

    initNewActionStatus(actionId, actor) {
        this.actor = actor;
        castIndex++;
        let statusMap = this.status.statusMap;
        statusMap[ENUMS.ActionStatus.ACTOR_ID] = actor.getStatus(ENUMS.ActorStatus.ACTOR_ID);
        statusMap[ENUMS.ActionStatus.ACTION_ID] = "action_"+castIndex+"_"+actionId;
        statusMap[ENUMS.ActionStatus.ACTION_KEY] = actionId;
        statusMap[ENUMS.ActionStatus.BUTTON_STATE] = ENUMS.ButtonState.UNAVAILABLE;
        statusMap[ENUMS.ActionStatus.ACTION_STATE] = ENUMS.ActionState.DISABLED;
        statusMap[ENUMS.ActionStatus.SELECTED] = true;
        statusMap[ENUMS.ActionStatus.TARGET_ID] = actor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET);
        statusMap[ENUMS.ActionStatus.STEP_START_TIME] = 0;
        statusMap[ENUMS.ActionStatus.STEP_END_TIME] = 0;
        MATH.emptyArray(statusMap[ENUMS.ActionStatus.STATUS_MODIFIERS]);

        actor.setStatusKey(ENUMS.ActorStatus.ACTION_STATE_KEY, this.status.getStatus(ENUMS.ActionStatus.ACTION_STATE))
        actor.setStatusKey(ENUMS.ActorStatus.SELECTED_ACTION, this.status.getStatus(ENUMS.ActionStatus.ACTION_KEY));

    }

    getTarget() {
        return this.targetActor;
    }

    processActionStatusModifiers(modifiers, targetActor) {

        if (targetActor !== this.targetActor) {
            this.targetActor = targetActor;
        }

        for (let i = 0; i < modifiers.length;i++) {
            let modifier = modifiers[i];
            i++;
            let amount = modifiers[i];
            console.log("processActionStatusModifiers", modifier, amount, targetActor.getStatus(ENUMS.ActorStatus.ACTOR_ID));
            applyServerAction(targetActor, modifier, amount)
        }

    }

    activateServerActionId(actionId, actor, target, serverEncounter) {
        this.serverEncounter = serverEncounter;
        this.targetActor = target;
        this.initNewActionStatus(actionId, actor);
    //    console.log("activateServerActionId", actionId, actor)
        this.timeElapsed = 0;
        let actionConfigs = getServerConfig("GAME_ACTORS")['ACTIONS'];
        let conf = parseConfigData(actionConfigs, actionId)
        this.config = conf;
        this.sequencing = conf['sequencing'];
        let statActions = conf['statistical_actions'];

        let statConfigs = getServerConfig("GAME_ACTIONS")['STATISTICAL_ACTIONS'];

        MATH.emptyArray(this.statisticalActions);

        for (let i = 0; i < statActions.length; i++) {
            let statId = statActions[i];
            let statsConf = parseConfigData(statConfigs, statId);
            let statAction = new StatisticalAction();
            statAction.initStatisticalActionConfig(statsConf);
            this.statisticalActions.push(statAction)
         //   console.log("statAction ", statAction);
        }

    //    console.log("Action config ", conf);
        registerGameServerUpdateCallback(this.call.updateAttack)
    }


    attackCompleted() {
    //    console.log("attackCompleted", this)

        this.actor.setStatusKey(ENUMS.ActorStatus.SELECTED_ACTION, '');

        this.call.setStatusKey(ENUMS.ActionStatus.ACTOR_ID, "none")
        this.call.setStatusKey(ENUMS.ActionStatus.ACTION_KEY, "none")

        unregisterGameServerUpdateCallback(this.call.updateAttack);
        MATH.callAll(this.onCompletedCallbacks, this.actor, this);
        MATH.emptyArray(this.onCompletedCallbacks);

    }


}

export { ServerAction }