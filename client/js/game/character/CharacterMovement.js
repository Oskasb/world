import {Vector3} from "../../../libs/three/math/Vector3.js";
import { Object3D } from "../../../libs/three/core/Object3D.js";

let tempObj = new Object3D()
let tempVec3 = new Vector3();

class CharacterMovement {
    constructor(gamePiece) {
        this.vel = new THREE.Vector3();
        this.speed = 0;
        this.combatState = false;
        this.gamePiece = gamePiece;
        this.spatial = gamePiece.getSpatial();
        this.status = gamePiece.pieceState.status;
        this.frameSpeed = 0;
        this.charState = null;

        let onGameTick = function(tpf) {
            this.tickCharMovement(tpf)
        }.bind(this)

        this.callbacks = {
            onGameTick:onGameTick
        }

        gamePiece.addPieceUpdateCallback(this.callbacks.onGameTick);
    }

    applyCombatState(bool) {

        if (bool) {
            if (this.speed) {
                this.gamePiece.animateActionState('MOVE_COMBAT')
            } else {
             //   this.gamePiece.applyPieceAnimationState('SET_RT_FF')
                this.gamePiece.animateActionState('STAND_COMBAT')
            }
        } else {
            if (this.speed) {
                this.gamePiece.animateActionState('MOVE') // WALK_BODY
           //     this.gamePiece.animateActionState('IDLE_HANDS')
            } else {
                //   this.gamePiece.applyPieceAnimationState('SET_RT_FF')
                this.gamePiece.animateActionState('IDLE_LEGS')
                this.gamePiece.animateActionState('IDLE_HANDS')
            }
        }


    }

    applyRotation(speed) {
        tempObj.quaternion.set(0, 1, 0,0)
        let targetPiece = this.gamePiece.getTarget();
        if (targetPiece) {
                if (targetPiece.isDead) {
                 //   console.log("It is dead, dont look at it", targetPiece)
                //    this.gamePiece.clearEngagementStatus();
                    return;
                }

            tempVec3.copy(targetPiece.getPos());
            tempVec3.y = this.gamePiece.getPos().y
            this.spatial.obj3d.lookAt(tempVec3)
        } else if (speed > 0.000001) {
            let angY = MATH.vectorXZToAngleAxisY(this.vel);
            tempObj.rotateY(angY);
            this.spatial.obj3d.quaternion.copy(tempObj.quaternion)
        }

    }

    applyMovementState(bool) {


        if (bool) {
            if (!this.combatState) {
                this.gamePiece.animateActionState('MOVE')
                this.gamePiece.animateActionState('IDLE_HANDS')
            } else {
                this.gamePiece.animateActionState('MOVE_COMBAT')
            }
        } else {
            if (!this.combatState) {
                this.gamePiece.animateActionState('IDLE_LEGS')
                this.gamePiece.animateActionState('IDLE_HANDS')
            } else {
                this.gamePiece.animateActionState('STAND_COMBAT')
            }
        }

    }

    updateCharMovement(tpf) {

        if (this.charState !== this.status.charState) {
            if (this.status.charState !== ENUMS.CharacterState.IDLE_HANDS) {
                if (!this.combatState) {
                    this.applyCombatState(true);
                }
                this.combatState = true;
            } else {
                if (this.combatState) {
                    this.applyCombatState(false);
                }
                this.combatState = false;
            }
        }

        this.spatial.call.getMovement(this.vel)
        let speed = this.vel.lengthSq();
        if (speed > 0.000000001) {
            this.applyMovementState(true)
        } else  {
            this.applyMovementState(false)
        }
        this.speed = speed;
        this.applyRotation(speed)
    }

    tickCharMovement(tpf) {
        this.updateCharMovement(tpf)
    }

}

export { CharacterMovement }