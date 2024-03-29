import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {configDataList} from "../../application/utils/ConfigUtils.js";
import {ActionStatus} from "../actions/ActionStatus.js";
import {ENUMS} from "../../application/ENUMS.js";
import {MATH} from "../../application/MATH.js";
import {processStatisticalActionApplied} from "../actions/ActionStatusProcessor.js";


let config = {};
let actionStats = {};
let configUpdated = function(cfg) {
    config = cfg;
    //  console.log("ActorActionConfig: ", config);
}

let statsUpdated = function(cfg) {
    actionStats = cfg;
 //   console.log("STATISTICAL_ACTIONS: ", actionStats);
}

setTimeout(function() {
    configDataList("GAME_ACTORS", "ACTIONS", configUpdated)
    configDataList("GAME_ACTIONS", "STATISTICAL_ACTIONS", statsUpdated)
}, 2000)


let attackStateKeys = [
    ENUMS.ActionState.SELECTED,
    ENUMS.ActionState.PRECAST,
    ENUMS.ActionState.ACTIVE,
    ENUMS.ActionState.APPLY_HIT,
    ENUMS.ActionState.POST_HIT,
    ENUMS.ActionState.COMPLETED
]

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

let buttonStateMap = []
buttonStateMap[ENUMS.ActionState.DISABLED]  =  ENUMS.ButtonState.AVAILABLE;
buttonStateMap[ENUMS.ActionState.SELECTED]  =  ENUMS.ButtonState.SELECTED;
buttonStateMap[ENUMS.ActionState.PRECAST]   =  ENUMS.ButtonState.ACTIVATING
buttonStateMap[ENUMS.ActionState.ACTIVE]    =  ENUMS.ButtonState.ACTIVE
buttonStateMap[ENUMS.ActionState.APPLY_HIT] =  ENUMS.ButtonState.ACTIVE
buttonStateMap[ENUMS.ActionState.POST_HIT]  =  ENUMS.ButtonState.ACTIVE
buttonStateMap[ENUMS.ActionState.COMPLETED] =  ENUMS.ButtonState.DISABLED

let index = 0;

function determineButtonState(action, newActionState) {

    let currentActionState = action.status.call.getStatusByKey(ENUMS.ActionStatus.ACTION_STATE)

 //   console.log("currentActionState", currentActionState)

    if (currentActionState === ENUMS.ActionState.DISABLED) {
        let requiresTarget = action.status.call.getStatusByKey(ENUMS.ActionStatus.REQUIRES_TARGET)
        console.log("determineButtonState", requiresTarget)
    }

    return buttonStateMap[newActionState];
}

function processActionStateChange(action, actionState) {
 //   console.log("processActionStateChange", ENUMS.getKey('ActionState', actionState))

    let actor = action.getActor();
    if (!actor) {
        return;
    }

    let requiresTarget = action.call.getStatus(ENUMS.ActionStatus.REQUIRES_TARGET);
    let target = action.getTarget();

    if (requiresTarget) {
        if (!target) {
            console.log("No target found for action", action, actionState)
            return;
        }
    }

    let statisticalActions = action.statisticalActions

    let modifiers = action.call.getStatus(ENUMS.ActionStatus.STATUS_MODIFIERS);
    MATH.emptyArray(modifiers);

    switch (actionState) {
        case ENUMS.ActionState.DISABLED:

            break;
        case ENUMS.ActionState.SELECTED:

            console.log("Activate Visual Action", action.isRemote)
            action.visualAction.activateVisualAction(action);

            for (let i = 0; i < statisticalActions.length; i++) {
                statisticalActions[i].applyActorActionSelected(actor, modifiers)
            }
            break;
        case ENUMS.ActionState.PRECAST:

            break;
        case ENUMS.ActionState.ACTIVE:

            if (action.isRemote) {
                action.visualAction.visualizeAttack();
            } else {
                action.visualAction.visualizeAttack(action.call.activateAttackStateTransition);
            }

            for (let i = 0; i < statisticalActions.length; i++) {
                statisticalActions[i].applyActorActionActivate(target, modifiers)
            }
            break;
        case ENUMS.ActionState.APPLY_HIT:
            for (let i = 0; i < statisticalActions.length; i++) {
                statisticalActions[i].applyStatisticalActionToTarget(target, modifiers)
            }
            break;
        case ENUMS.ActionState.POST_HIT:

            break;
        case ENUMS.ActionState.COMPLETED:

            break;
    }

    processStatisticalActionApplied(actor, modifiers, target);
    action.status.call.forceStatusSend();
    MATH.emptyArray(modifiers);
}

class ActorAction {
    constructor() {

        this.id = "A"+index+"_"+client.getStamp()
        index++;

        this.status = new ActionStatus();
        this.stepProgress = 0;
        this.actor = null;
        this.targetId = null;
        this.visualAction = null;
        this.onCompletedCallbacks = [];
        this.initiated = false;
        this.statisticalActions = [];

        let stepDuration = 0;

        let activateAttackStateTransition = function() {
        //    console.log("activateAttackStateTransition")
            this.stepProgress = 0;

            let actionState = this.status.call.getStatusByKey(ENUMS.ActionStatus.ACTION_STATE)
            //     console.log("ACTION_STATE", actionState)

            if (!this.actor.call.getRemote()) {
                this.actor.setStatusKey(ENUMS.ActorStatus.ACTION_STATE_KEY, actionState)
            }

            let newActionState = transitionMap[actionState];
            let newButtonState = determineButtonState(this, newActionState);
            this.status.call.setStatusByKey(ENUMS.ActionStatus.BUTTON_STATE, newButtonState)

            let key = ENUMS.getKey('ActionState', newActionState);
            stepDuration = this.getStepDuration(key);
            //     console.log("New Action State", newActionState, "Key: ", key);
            this.status.call.setStatusByKey(ENUMS.ActionStatus.ACTION_STATE, newActionState)
            this.status.call.setStatusByKey(ENUMS.ActionStatus.STEP_START_TIME, 0)
            this.status.call.setStatusByKey(ENUMS.ActionStatus.STEP_END_TIME, stepDuration)
            processActionStateChange(this, newActionState);
            let funcName = attackStateMap[newActionState].updateFunc
            this.call[funcName]();

        }.bind(this)


        let updateActivate = function(tpf) {
        //    this.visualAction.activateVisualAction(this);
        }.bind(this)

        let updateProgress = function(tpf) {
            //             console.log("Progress status... ")
        }.bind(this)



        let updateActive = function(tpf) {

        }.bind(this)

        let updateActionCompleted = function(tpf) {
            this.attackCompleted()
        }.bind(this)

        let updateAttack = function(tpf) {
            this.stepProgress += tpf;
            if (stepDuration < this.stepProgress) {
                activateAttackStateTransition()
            }
        }.bind(this);

        let closeAttack = function() {
            this.attackCompleted();
        }.bind(this)

        let getStatus = function(key) {
            return this.status.call.getStatusByKey(key);
        }.bind(this);

        let setStatusKey = function(key, status) {
            this.status.call.setStatusByKey(key, status);
        }.bind(this)

        let initStatus = function(actor, actionKey) {
            this.initiated = true;
            this.status.call.initActionStatus(actor, this);
        }.bind(this);

        let applyActionSelected = function() {

        }.bind(this);

        this.call = {
         //   applyHitConsequences:applyHitConsequences,
            activateAttackStateTransition:activateAttackStateTransition,
            updateActivate:updateActivate,
            updateProgress:updateProgress,
            updateActive:updateActive,
            updateActionCompleted:updateActionCompleted,
            updateAttack:updateAttack,
            closeAttack:closeAttack,
            getStatus:getStatus,
            setStatusKey:setStatusKey,
            initStatus:initStatus,
            applyActionSelected:applyActionSelected,
            processActionStateChange:processActionStateChange
        }

    }

    getActor() {
        let actorId = this.status.call.getStatusByKey(ENUMS.ActionStatus.ACTOR_ID);
        let actor = GameAPI.getActorById(actorId)
        return actor;
    }

    getTarget() {

        let targetId = this.status.call.getStatusByKey(ENUMS.ActionStatus.TARGET_ID);
        if (!targetId) {
            console.log("No action Target...", this)
            let actor = GameAPI.getActorById(this.status.call.getStatusByKey(ENUMS.ActionStatus.ACTOR_ID));
            targetId = actor.getStatus(ENUMS.ActionStatus.SELECTED_TARGET);
            if (!targetId) {
                console.log("No actor Target either...", this)
                targetId = actor.id;
            }
        }

        return GameAPI.getActorById(targetId);
    }

    getStepDuration(step) {

        this.sequencing = this.readActionConfig('sequencing')
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

    readActionConfig(key) {
        let actionKey = this.getActionKey();
        if (!actionKey) {
            console.log("Need actionKey here.. ", config, key)
            return;
        }

        return config[actionKey][key];
    }

    setActionKey(actor, actionKey) {
        this.call.initStatus(actor, actionKey)
        this.status.call.setStatusByKey(ENUMS.ActionStatus.ACTION_KEY, actionKey);
        this.visualAction = poolFetch('VisualAction')
        let visualActionKey = this.readActionConfig('visual_action')
    //    console.log("Visual Action Key: ", visualActionKey);
        this.visualAction.setActorAction(this, visualActionKey);
        let statConfig = this.readActionConfig('statistical_actions')
        if (statConfig) {
            for (let i = 0; i < statConfig.length; i++) {
                let statAction = poolFetch('StatisticalAction')
                let cfg = actionStats[statConfig[i]];
                statAction.initStatisticalActionConfig(cfg, this);
                this.statisticalActions.push(statAction);
            }
        }

    }

    setActionKeyFromRemote(actionKey) {
   //     console.log("setActionKeyFromRemote", actionKey)
        this.status.call.setStatusByKey(ENUMS.ActionStatus.ACTION_KEY, actionKey);
        this.visualAction = poolFetch('VisualAction')
        let visualActionKey = this.readActionConfig('visual_action')
    //    console.log("Remote Visual Action Key: ", visualActionKey);
        this.visualAction.setActorAction(this, visualActionKey);
    }

    initAction(actor) {

        console.log("Client initAction", this);

        this.actor = actor;
        //   console.log("initAction", [actor], this.status.call.getStatusByKey(ENUMS.ActionStatus.ACTION_KEY))
        //   this.status.statusMap[ENUMS.ActionStatus.TARGET_ID] = actor.getStatus(ENUMS.ActionStatus.ACTOR_ID)
        if (!actor.call.getRemote()) {
            this.actor.setStatusKey(ENUMS.ActorStatus.ACTION_STATE_KEY, this.status.call.getStatusByKey(ENUMS.ActionStatus.ACTION_STATE))
            this.actor.setStatusKey(ENUMS.ActorStatus.SELECTED_ACTION, this.status.call.getStatusByKey(ENUMS.ActionStatus.ACTION_KEY));
            this.actor.setStatusKey(ENUMS.ActorStatus.REQUEST_TURN_STATE, ENUMS.TurnState.ACTION_APPLY);

        }

        let status = this.readActionConfig('status')

        if (typeof(status) === 'object') {
            // used for status altering actions, FLY, LEAP etc:
            for (let key in status) {
                actor.setStatusKey(ENUMS.ActorStatus[key], status[key])
            }
        }

        actor.actorText.yell(this.visualAction.name)

        this.sequencing = this.readActionConfig('sequencing')
        if (typeof(this.sequencing) === 'object') {
            // used for combat actions
            GameAPI.registerGameUpdateCallback(this.call.updateAttack);
        }
        this.call.applyActionSelected();
    }

    setActionTargetId(targetId) {
        this.status.call.setStatusByKey(ENUMS.ActionStatus.TARGET_ID, targetId)
    }

    activateAttack(onCompletedCB) {
        this.onCompletedCallbacks.push(onCompletedCB)
    }

    attackCompleted() {
        //       console.log("attackCompleted", this)
        this.initiated = false;

        let actor = GameAPI.getActorById(this.call.getStatus(ENUMS.ActionStatus.ACTOR_ID))

        if (!actor.call.getRemote()) {
            actor.setStatusKey(ENUMS.ActorStatus.REQUEST_TURN_STATE, ENUMS.TurnState.TURN_CLOSE);
        }

        actor.setStatusKey(ENUMS.ActorStatus.SELECTED_ACTION, '');

        this.call.setStatusKey(ENUMS.ActionStatus.ACTOR_ID, "none")
        this.call.setStatusKey(ENUMS.ActionStatus.ACTION_KEY, "none")

        GameAPI.unregisterGameUpdateCallback(this.call.updateAttack);
        MATH.callAll(this.onCompletedCallbacks, actor, this);
        MATH.emptyArray(this.onCompletedCallbacks);

        this.visualAction.closeVisualAction();
        this.recoverAttack();
    }

    recoverAttack() {
        while (this.statisticalActions.length) {
            poolReturn(this.statisticalActions.pop())
        }
        poolReturn(this.visualAction);
        this.visualAction = null;
        poolReturn(this)
    }

}

export { ActorAction }