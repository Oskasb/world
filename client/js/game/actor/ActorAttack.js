import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";

class ActorAttack {
    constructor() {
        this.actor = null;
        this.target = null;
        this.visualAttack = null;
        this.onCompletedCallbacks = [];

        let updateAttack = function(tpf) {

        }.bind(this);

        let closeAttack = function() {
            this.attackCompleted();
        }.bind(this)

        this.call = {
            updateAttack:updateAttack,
            closeAttack:closeAttack
        }

    }

    initAttack(actor, target) {
        this.actor = actor;
        this.target = target;
        this.visualAttack = poolFetch('VisualAttack')
    }

    getTargetPos() {
        return this.target.visualGamePiece.getPos()
    }

    activateAttack(onCompletedCB) {
        this.onCompletedCallbacks.push(onCompletedCB)
        GameAPI.registerGameUpdateCallback(this.call.updateAttack);
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