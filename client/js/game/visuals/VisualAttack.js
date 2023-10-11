import {effectCalls} from "../combat/feedback/CombatEffects.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
let tempVec = new Vector3();
class VisualAttack {
    constructor() {
        this.sourcePos = new Vector3();
        this.targetPos = new Vector3();
    }

    visualizeAttack(actorAttack) {
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
            actorAttack.call.closeAttack()
        }

        effectCalls()['combat_effect_fire_missile'](this.sourcePos, actorAttack.actor, 0, onMissileArrive, getTargetPos)
    }


}

export {VisualAttack}