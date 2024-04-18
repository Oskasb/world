import {Object3D} from "../../../libs/three/core/Object3D.js";
import {VisualPathPoints} from "./VisualPathPoints.js";
import {setupVisualModel} from "../../application/utils/ModelUtils.js";
import {configDataList} from "../../application/utils/ConfigUtils.js";
import {poolReturn} from "../../application/utils/PoolUtils.js";
import {ENUMS} from "../../application/ENUMS.js";
import {Vector3} from "../../../libs/three/Three.js";
import {PieceAnimator} from "../gamepieces/PieceAnimator.js";
import {PieceActionSystem} from "../gamepieces/PieceActionSystem.js";
import {PieceAttacher} from "../gamepieces/PieceAttacher.js";

let tempObj3d = new Object3D();
let tempVec = new Vector3();

let visualConfigs = {};

let onData = function(data) {
    visualConfigs = data;
    console.log("visualConfigs", visualConfigs)
}

setTimeout(function() {
    configDataList("GAME","VISUALS", onData)
}, 1000);


let index = 0;

class VisualActor {
    constructor() {
        index++;
        let i = index;

        let actor = null;
        let visualConfigId = null;
        let instance = null;
        this.visualPathPoints = new VisualPathPoints();

        this.animStateMap = null;
        this.pieceAnimator = new PieceAnimator();
        let pieceAnimator = this.pieceAnimator;
        this.pieceActionSystem = new PieceActionSystem();
        this.pieceAttacher = new PieceAttacher();

        let activating = false;
        let active = false;


        let setActor = function(a, onReady) {
            if (activating === true) {
                console.log("Multiple Activte Calls on same VisualActor pool entry..")
            }

            skipped = false;
            activating = true;
            actor = a;
            let vConf = visualConfigs[actor.config['visual_id']]
            console.log("VisualActor set actor", vConf.model_asset, vConf, actor);
            setupVisualModel(this, vConf, onReady)
        }.bind(this)

        function setInstance(i) {
            instance = i;
        }

        function getInstance() {
            return instance;
        }

        let updateAnimatedGamePiece = function(tpf, gameTime) {
            this.pieceAnimator.updatePieceAnimations(tpf, gameTime);

            actor.getSpatialVelocity(tempVec);
            //    tempVec.normalize();
            //    tempVec.multiplyScalar()
            //    this.getSpatial().call.getMovement(tempVec);
            let frameVelocity = 0;
            if (tempVec.length() > 0.001) {
                frameVelocity = actor.getStatus(ENUMS.ActorStatus.MOVEMENT_SPEED);
                let action = this.animateActionState(actor.getStatus(ENUMS.ActorStatus.MOVE_STATE))
                if (!action) {
                    console.log("No action to update",this);
                    return;
                }
                //    console.log(action);
                action.timeScale = frameVelocity * 0.33;
            } else {
                this.animateActionState(actor.getStatus(ENUMS.ActorStatus.STAND_STATE))
            }
            this.animateActionState(actor.getStatus(ENUMS.ActorStatus.BODY_STATE))

        }.bind(this)

        let hold = 0;

        let update = function(tpf) {

            hold+= tpf;
            if (hold > 2) {
                actor.actorText.say(i);
                hold = Math.random();
            }

            if (pieceAnimator.animationStates.length) {
                updateAnimatedGamePiece(tpf, GameAPI.getGameTime());
            }

            actor.getSpatialPosition(tempObj3d.position);
            actor.getSpatialQuaternion(tempObj3d.quaternion);
            actor.getSpatialScale(tempObj3d.scale);
            instance.getSpatial().stickToObj3D(tempObj3d);
        }

        function activate() {
            if (active !== true) {

                activating = false;
                if (skipped === true) {
                    //         return;
                }

                ThreeAPI.showModel(instance.getSpatial().obj3d)
                instance.getSpatial().obj3d.frustumCulled = false;
                pieceAnimator.callbacks.resetAnimator();
                instance.getSpatial().call.setStopped();
                ThreeAPI.registerPrerenderCallback(update);
                update(0.01);
                actor.actorText.say("   ++++   ")
            } else {
                actor.actorText.say(" DOUBLED ")
            }
            active = true;
        }

        let skipped = false;

        let deactivate = function() {

            if (active !== false) {
                actor = null;
                instance.decommissionInstancedModel();

                ThreeAPI.unregisterPrerenderCallback(update);
                instance = null;
            }
            active = false;

        }

        function getActor() {
            return actor;
        }

        this.call = {
            setActor:setActor,
            getActor:getActor,
            setInstance:setInstance,
            getInstance:getInstance,
            activate:activate,
            deactivate:deactivate
        }

    }


    animateActionState(actionName) {
        let actions = this.pieceActionSystem.actions[actionName]
        if (actions) {
            let action = actions[0];
            if (action) {
                if (action.active.length) {
                    let actionMap = this.pieceActionSystem.actions[actionName][0].active;
                    let animId = MATH.getRandomArrayEntry(actionMap)
                    return this.applyPieceAnimationState(animId);
                }
            }
        }
    }

    getPlayingAnimation(animName) {
        return this.pieceAnimator.isActiveAnimationKey(animName);
    };

    applyPieceAnimationState(animName, duration, channel, weight) {
        return this.call.getInstance().animator.applyAnimationState(animName, this.animStateMap, duration, channel, weight)
    }

    getBoneWorldPosition(bone) {
        this.call.getInstance().updateBoneWorldTransform(bone, tempObj3d)
        return tempObj3d.position;
    }

    getRandomBone() {
        let map = this.call.getInstance().getBoneMap();
        return MATH.getRandomObjectEntry(map)
    }

    getCenterMass() {
        tempVec.copy(this.getPos());
        tempVec.y += this.call.getActor().getStatus(ENUMS.ActorStatus.HEIGHT) * 0.7;
        return tempVec;
    }

    getAboveHead(above) {
        let actor = this.call.getActor()
        tempVec.copy(actor.getPos());
        tempVec.y += actor.getStatus(ENUMS.ActorStatus.HEIGHT) + above;
        return tempVec;
    }

    getModel() {
        return this.call.getInstance()
    }

}

export { VisualActor }