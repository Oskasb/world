import {effectCalls} from "../combat/feedback/CombatEffects.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../libs/three/core/Object3D.js";

let tempVec = new Vector3();
let tempObj3D = new Object3D();

let visualConfigDefaults = {
    "fx_selected":"combat_effect_hands_magic_power",
    "fx_precast":"combat_effect_hands_fire",
    "fx_active":"combat_effect_fire_missile",
    "fx_apply":"combat_effect_fireball",
    "fx_post_hit":"damage_effect_catch_on_fire"
}

let fxKeys = [
    "fx_selected",
    "fx_precast",
    "fx_active",
    "fx_apply",
    "fx_post_hit"
]

class VisualAttack {
    constructor() {
        this.sourcePos = new Vector3();
        this.targetPos = new Vector3();
        this.actorAttack = null;
        this.progress = 0;
        this.config = visualConfigDefaults;
        this.rightHandObj3d = new Object3D();
        this.leftHandObj3d = new Object3D();

        let missileEffect = null;

        let updateSelected = function(tpf) {
            this.getActor().getVisualJointWorldTransform('HAND_R', this.rightHandObj3d)
            this.getActor().getVisualJointWorldTransform('HAND_L', this.leftHandObj3d)
            effectCalls()[this.config[fxKeys[0]]](this.getActor(), this.rightHandObj3d)
            effectCalls()[this.config[fxKeys[0]]](this.getActor(), this.leftHandObj3d)
        }.bind(this)

        let updatePrecast = function(tpf) {
            this.getActor().getVisualJointWorldTransform('HAND_R', this.rightHandObj3d)
            this.getActor().getVisualJointWorldTransform('HAND_L', this.leftHandObj3d)
            effectCalls()[this.config[fxKeys[1]]](this.getActor(), this.rightHandObj3d)
            effectCalls()[this.config[fxKeys[1]]](this.getActor(), this.leftHandObj3d)
        }.bind(this)

        let updateActive = function(tpf) {
            tempObj3D.position.copy(missileEffect.pos)
            effectCalls()[this.config[fxKeys[1]]](this.getActor(), tempObj3D)
        }.bind(this)

        let updateApplyHit = function(tpf) {
            effectCalls()[this.config[fxKeys[3]]](this.getTarget())
        }.bind(this)

        let updatePostHit = function(tpf) {
            effectCalls()[this.config[fxKeys[4]]](this.getTarget())
        }.bind(this)

        let fxCallback = function(efct) {
            missileEffect = efct;
        }

        this.call = {
            fxCallback:fxCallback,

            updateSelected:updateSelected,
            updatePrecast:updatePrecast,
            updateActive:updateActive,
            updateApplyHit:updateApplyHit,
            updatePostHit:updatePostHit
        }

    }

    setActorAttack(actorAttack, visualConfig) {
        this.actorAttack = actorAttack;
        this.config = visualConfig || visualConfigDefaults;
    }

    getActor() {
        return this.actorAttack.actor;
    }

    getTarget() {
        return this.actorAttack.target;
    }



    visualizeAttack(actorAttack) {
        this.progress = 0;
        this.sourcePos.copy(actorAttack.actor.getPos())
        this.sourcePos.y +=1.5;

        let tPos = this.targetPos;

        let getTargetPos = function() {
            tPos.copy(actorAttack.target.call.getActorPos())
            tPos.y +=1.5;
            return tPos;
        }



        let onMissileArrive = function(gameEffect) {
            console.log("Missile Arrive", gameEffect)
            actorAttack.call.advanceState();
        }
        actorAttack.call.advanceState();
        effectCalls()['combat_effect_fire_missile'](this.sourcePos, actorAttack.actor, 0, onMissileArrive, getTargetPos, this.call.fxCallback)
    }


}

export {VisualAttack}