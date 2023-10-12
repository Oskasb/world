import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";

let visualConfig = {
    "fx_selected":"combat_effect_hands_magic_power",
    "fx_precast":"combat_effect_hands_fire",
    "fx_active":"combat_effect_fire_missile",
    "fx_apply":"combat_effect_fireball",
    "fx_post_hit":"damage_effect_catch_on_fire"
}

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
    let stateKey = attackStateKeys[stateIndex]
    let funcName = attackStateMap[stateKey].updateFunc
    attack.updateFunc = attack.call[funcName];
    attack.attackStateIndex++;
}


class ActorAttack {
    constructor() {
        this.stepProgress = 0;
        this.actor = null;
        this.target = null;
        this.visualAttack = null;
        this.attackStateIndex = 0;
        this.onCompletedCallbacks = [];

        this.updateFunc = function () {
            console.log("No Update func for ActorAttack Yet...")
        };

        let advanceState = function() {
            activateAttackStateTransition(this);
        }.bind(this)

        let updateSelected = function(tpf) {
            this.visualAttack.call.updateSelected(tpf);
        }.bind(this)

        let updatePrecast = function(tpf) {
            this.visualAttack.call.updatePrecast(tpf);
        }.bind(this)

        let updateActive = function(tpf) {
            this.visualAttack.call.updateActive(tpf);
        }.bind(this)

        let updateApplyHit = function(tpf) {
            this.visualAttack.call.updateApplyHit(tpf);
            activateAttackStateTransition(this);

        }.bind(this)

        let updatePostHit = function(tpf) {
            this.visualAttack.call.updatePostHit(tpf);
            if (this.stepProgress > 1) {
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

    initAttack(actor) {
        this.actor = actor;
        this.attackStateIndex = 0;
        this.visualAttack = poolFetch('VisualAttack')
        this.visualAttack.setActorAttack(this, visualConfig);
        this.call.advanceState();
        GameAPI.registerGameUpdateCallback(this.call.updateAttack);
    }

    getTargetPos() {
        return this.target.visualGamePiece.getPos()
    }

    activateAttack(target, onCompletedCB) {
        this.target = target;
        this.onCompletedCallbacks.push(onCompletedCB)
        this.visualAttack.visualizeAttack(this);
    }

    updateActiveAttack(progress) {

    }

    attackCompleted() {
        console.log("attackCompleted", this)
        this.actor = null;
        this.target = null;
        GameAPI.unregisterGameUpdateCallback(this.call.updateAttack);
        MATH.callAndClearAll(this.onCompletedCallbacks);
        poolReturn(this.visualAttack);
        poolReturn(this)
    }

}

export { ActorAttack }