import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {configDataList} from "../../application/utils/ConfigUtils.js";
import {ActionStatus} from "./ActionStatus.js";

let visualConfig = {
    "fx_selected":"combat_effect_hands_magic_power",
    "fx_precast":"combat_effect_hands_fire",
    "fx_active":"combat_effect_fire_missile",
    "fx_apply":"combat_effect_fireball",
    "fx_post_hit":"damage_effect_catch_on_fire"
}

let config = {};
let configUpdated = function(cfg) {
    config = cfg;
  //  console.log("ActorActionConfig: ", config);
}


setTimeout(function() {
    configDataList("GAME_ACTORS", "ACTIONS", configUpdated)
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


        let stepDuration = 0;


        let activateAttackStateTransition = function() {
            this.stepProgress = 0;

            let actionState = this.status.call.getStatusByKey(ENUMS.ActionStatus.ACTION_STATE)
            console.log("ACTION_STATE", actionState)

            if (!this.actor.call.getRemote()) {
                this.actor.setStatusKey(ENUMS.ActorStatus.ACTION_STATE_KEY, actionState)
            }

            let newActionState = transitionMap[actionState];
            let newButtonState = buttonStateMap[newActionState];
            this.status.call.setStatusByKey(ENUMS.ActionStatus.BUTTON_STATE, newButtonState)

            let key = ENUMS.getKey('ActionState', newActionState);
            stepDuration = this.getStepDuration(key);
            console.log("New Action State", newActionState, "Key: ", key);
            this.status.call.setStatusByKey(ENUMS.ActionStatus.ACTION_STATE, newActionState)
            this.status.call.setStatusByKey(ENUMS.ActionStatus.STEP_START_TIME, 0)
            this.status.call.setStatusByKey(ENUMS.ActionStatus.STEP_END_TIME, stepDuration)
            let funcName = attackStateMap[newActionState].updateFunc
            this.call[funcName]();

        }.bind(this)


        let updateActivate = function(tpf) {
                this.visualAction.activateVisualAction(this);
        }.bind(this)

        let updateProgress = function(tpf) {
                console.log("Progress status... ")
        }.bind(this)

        let applyHitConsequences = function() {
            let target = this.getTarget();

            if (!target) {
                console.log("No target found for action", this)
                return;
            }

            if (!target.call) {
                console.log("No target found for action", target)
                return;
            }


            if (!target.call.getRemote()) {
                let hp = target.getStatus(ENUMS.ActorStatus.HP);
                let maxHP = target.getStatus(ENUMS.ActorStatus.MAX_HP);
                let newHP = Math.ceil(MATH.clamp(hp - (1  + (Math.random()*3))), 0, maxHP );
                target.setStatusKey(ENUMS.ActorStatus.HP, newHP)
            }

        }.bind(this);

        let applyMissileHit = function() {
            applyHitConsequences()
            activateAttackStateTransition()
        }


        let updateActive = function(tpf) {
            if (this.stepProgress === 0) {
                this.visualAction.visualizeAttack(applyMissileHit);
            }
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
            this.status.call.initActionStatus(actor, actionKey, this)
        }.bind(this);

        this.call = {
            applyHitConsequences:applyHitConsequences,
            updateActivate:updateActivate,
            updateProgress:updateProgress,
            updateActive:updateActive,
            updateActionCompleted:updateActionCompleted,
            updateAttack:updateAttack,
            closeAttack:closeAttack,
            getStatus:getStatus,
            setStatusKey:setStatusKey,
            initStatus:initStatus
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
        this.visualAction = poolFetch('VisualAction')
        let visualActionKey = this.readActionConfig('visual_action')
        this.visualAction.setActorAction(this, visualActionKey);
    }

    initAction(actor) {

        this.actor = actor;


        if (!actor.call.getRemote()) {
            this.actor.setStatusKey(ENUMS.ActorStatus.ACTION_STATE_KEY, this.status.call.getStatusByKey(ENUMS.ActionStatus.ACTION_STATE))
            this.actor.setStatusKey(ENUMS.ActorStatus.SELECTED_ACTION, this.status.call.getStatusByKey(ENUMS.ActionStatus.ACTION_KEY));
        }

        let status = this.readActionConfig('status')

        if (typeof(status) === 'object') {
            for (let key in status) {
                actor.setStatusKey(ENUMS.ActorStatus[key], status[key])
            }
        }
        actor.actorText.yell(this.visualAction.name)

        this.sequencing = this.readActionConfig('sequencing')
        if (typeof(this.sequencing) === 'object') {
            GameAPI.registerGameUpdateCallback(this.call.updateAttack);
        }
    }

    setActionTargetId(targetId) {
        this.status.call.setStatusByKey(ENUMS.ActionStatus.TARGET_ID, targetId)
    }

    activateAttack(onCompletedCB) {
        this.onCompletedCallbacks.push(onCompletedCB)
    }

    attackCompleted() {
        console.log("attackCompleted", this)
        this.initiated = false;

        let actor = GameAPI.getActorById(this.call.getStatus(ENUMS.ActionStatus.ACTOR_ID))
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
        poolReturn(this.visualAction);
        poolReturn(this)
    }

}

export { ActorAction }