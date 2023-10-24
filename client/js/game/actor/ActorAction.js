import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {configDataList} from "../../application/utils/ConfigUtils.js";


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
    console.log("ActorActionConfig: ", config);
}


setTimeout(function() {
    configDataList("GAME_ACTORS", "ACTIONS", configUpdated)
}, 2000)



let attackStateKeys = [
    'attack_selected',
    'attack_precast',
    'attack_active',
    'attack_apply_hit',
    'attack_post_hit',
    'attack_completed'
]

let attackStateMap = {};
attackStateMap[attackStateKeys[0]] = {updateFunc:'updateSelected'}
attackStateMap[attackStateKeys[1]] = {updateFunc:'updatePrecast'}
attackStateMap[attackStateKeys[2]] = {updateFunc:'updateActive'}
attackStateMap[attackStateKeys[3]] = {updateFunc:'updateApplyHit'}
attackStateMap[attackStateKeys[4]] = {updateFunc:'updatePostHit'}
attackStateMap[attackStateKeys[5]] = {updateFunc:'updateAttackCompleted'}


let activateAttackStateTransition = function(attack) {
    attack.stepProgress = 0;
    let stateIndex = attack.attackStateIndex;
    console.log("stateIndex", stateIndex)
    let stateKey = attackStateKeys[stateIndex]

//    attack.actor.actorText.say(stateKey)
    let funcName = attackStateMap[stateKey].updateFunc
    attack.updateFunc = attack.call[funcName];
    attack.attackStateIndex++;
}


class ActorAction {
    constructor() {

        this.stepProgress = 0;
        this.actor = null;
        this.target = null;
        this.visualAction = null;
        this.attackStateIndex = 0;
        this.onCompletedCallbacks = [];
        this.actionKey = null;

        this.updateFunc = function () {
            console.log("No Update func for ActorAction Yet...")
        };

        let advanceState = function() {
            activateAttackStateTransition(this);
        }.bind(this)

        let updateSelected = function(tpf) {
            this.visualAction.call.updateSelected(tpf);
        }.bind(this)

        let updatePrecast = function(tpf) {
            this.visualAction.call.updatePrecast(tpf);
        }.bind(this)

        let updateActive = function(tpf) {
            this.visualAction.call.updateActive(tpf);
        }.bind(this)

        let updateApplyHit = function(tpf) {
            this.visualAction.call.updateApplyHit(tpf);
            if (this.stepProgress > this.getStepDuration('apply')) {
                activateAttackStateTransition(this);
            }

        }.bind(this)

        let updatePostHit = function(tpf) {
            this.visualAction.call.updatePostHit(tpf);
            if (this.stepProgress > this.getStepDuration('post_hit')) {
                activateAttackStateTransition(this);
            }
        }.bind(this)

        let updateAttackCompleted = function(tpf) {
            this.attackCompleted()
        }.bind(this)

        let updateAttack = function(tpf) {
            this.stepProgress += tpf;
            this.updateFunc(tpf);
        }.bind(this);

        let closeAttack = function() {
            this.attackCompleted();
        }.bind(this)

        this.call = {
            advanceState:advanceState,
            updateSelected:updateSelected,
            updatePrecast:updatePrecast,
            updateActive:updateActive,
            updateApplyHit:updateApplyHit,
            updatePostHit:updatePostHit,
            updateAttackCompleted:updateAttackCompleted,
            updateAttack:updateAttack,
            closeAttack:closeAttack
        }

    }

    getStepDuration(step) {
        if (typeof this.sequencing[step] === 'object') {
            return this.sequencing[step].time || 1;
        } else {
            return 1;
        }

    }

    readActionConfig(key) {
        return config[this.actionKey][key];
    }

    setActionKey(actionKey) {
        this.actionKey = actionKey;
        this.visualAction = poolFetch('VisualAction')
        let visualActionKey = this.readActionConfig('visual_action')
        this.visualAction.setActorAction(this, visualActionKey);
    }

    initAction(actor) {
        this.actor = actor;

        let status = this.readActionConfig('status')

        if (typeof(status) === 'object') {
            for (let key in status) {
                actor.setStatusKey(ENUMS.ActorStatus[key], status[key])
            }
        }
        actor.actorText.yell(this.visualAction.name)

        this.sequencing = this.readActionConfig('sequencing')
        if (typeof(this.sequencing) === 'object') {
            this.attackStateIndex = 0;
            this.call.advanceState();
            GameAPI.registerGameUpdateCallback(this.call.updateAttack);
        }

    }

    activateAttack(target, onCompletedCB) {

        if (typeof(this.sequencing) === 'object') {
            this.target = target;
            this.onCompletedCallbacks.push(onCompletedCB)
            this.visualAction.visualizeAttack(this);
        }

    }

    attackCompleted() {
        console.log("attackCompleted", this)
        this.actor = null;
        this.target = null;
        GameAPI.unregisterGameUpdateCallback(this.call.updateAttack);
        MATH.callAndClearAll(this.onCompletedCallbacks);
        this.recoverAttack();
    }

    recoverAttack() {
        poolReturn(this.visualAction);
        poolReturn(this)
    }

}

export { ActorAction }