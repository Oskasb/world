import * as ModelUtils from "../../3d/ModelUtils.js";
import { Vector3 } from "../../../libs/three/math/Vector3.js";
import { Object3D } from "../../../libs/three/core/Object3D.js";

let tempVec = new Vector3();
let tempObj3d = new Object3D()
let visualIndex = 0;

class VisualGamePiece {
    constructor(config) {

        this.visualIndex = visualIndex;
        visualIndex ++;

        this.moveState = 'MOVE';
        this.bodyState = 'IDLE_HANDS';

        this.assetId = config['model_asset'];
        this.config = config;
        this.visualPieceObj3d = new Object3D();

            let updateVisualGamePiece = function(tpf) {
            this.updateVisualGamePiece(tpf);

            if (this.pieceAnimator) {

                if (this.pieceAnimator.animationStates.length) {
                    this.updateAnimatedGamePiece(tpf, GameAPI.getGameTime());
                }

            }

        }.bind(this);

        this.call = {
            updateVisualGamePiece:updateVisualGamePiece
        }

    }

    attachModelAsset = function(onReady) {

        let pieceReady = function(visualPiece) {
            visualPiece.showVisualGamePiece();

            if (visualPiece.pieceAnimator) {
                visualPiece.enablePieceAnimations();
                visualPiece.animateActionState('IDLE_HANDS')
            }
            onReady(this)
        }

        ModelUtils.setupVisualModel(this, this.assetId, this.config, pieceReady);
    }

    setPieceAnimator = function(pieceAnimator) {
        this.pieceAnimator = pieceAnimator
    }

    setPieceActionSystem = function(pieceActionSystem) {
        this.pieceActionSystem = pieceActionSystem;
    }

    setPieceAttacher = function(pieceAttacher) {
        this.pieceAttacher = pieceAttacher
    }

    animateActionState = function(actionName) {
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

    getPlayingAnimation = function(animName) {
        return this.pieceAnimator.isActiveAnimationKey(animName);
    };

    applyPieceAnimationState(animName, duration, channel, weight) {
        return this.instance.animator.applyAnimationState(animName, this.animStateMap, duration, channel, weight)
    }

    setModel(instance) {
        this.instance = instance;
    }

    getModel() {
        return this.instance;
    }

    getSpatial() {
        return this.instance.getSpatial();
    }

    getPos() {
        return this.getSpatial().getPos()
    }

    getQuat() {
        return this.getSpatial().getQuat()
    }

    disablePieceAnimations() {
        this.getSpatial().call.setStopped();
    }

    enablePieceAnimations() {
        this.pieceAnimator.callbacks.resetAnimator();
        this.getSpatial().call.setStopped();
    }

    showVisualGamePiece() {

        if (this.getSpatial().geometryInstance) {
            tempVec.set(1, 1, 1);
            this.getSpatial().geometryInstance.setScale(tempVec);

        } else {
            ThreeAPI.showModel(this.getSpatial().obj3d)
            this.enablePieceAnimations()
        }

        ThreeAPI.addPrerenderCallback(this.call.updateVisualGamePiece);

    };

    removeVisualGamePiece() {
        ThreeAPI.unregisterPrerenderCallback(this.call.updateVisualGamePiece);
        this.disablePieceAnimations()
        this.getModel().decommissionInstancedModel();
    };

    setVisualPieceActor = function(actor) {
        this.actor = actor;
    }

    getModelObj3d() {
        return this.actor.actorObj3d;
    }

    setMoveState = function(state) {
        this.moveState = state;
    }

    setBodyState = function(state) {
        this.bodyState = state;
    }


    getCenterMass() {
        tempVec.copy(this.getPos());
        tempVec.y += this.actor.getStatus(ENUMS.ActorStatus.HEIGHT) * 0.7;
        return tempVec;
    }

    getAboveHead(above) {
        tempVec.copy(this.getPos());
        tempVec.y += this.actor.getStatus(ENUMS.ActorStatus.HEIGHT) + above;
        return tempVec;
    }

    getRandomJointId() {
        let jointMap = this.instance.getJointMap();
        return MATH.getRandomObjectEntry(jointMap)
    }

    getRandomBone() {
        let map = this.instance.getBoneMap();
        return MATH.getRandomObjectEntry(map)
    }

    getBoneWorldPosition(bone) {
        this.instance.updateBoneWorldTransform(bone, tempObj3d)
        return tempObj3d.position;
    }

    getJointWorldPosition(boneName) {
        if (boneName === 'root_node') {
            return this.getCenterMass();
        }
        this.instance.getBoneWorldTransform(boneName, tempObj3d)
        return tempObj3d.position;
    }

    updateAnimatedGamePiece(tpf, gameTime) {
        this.pieceAnimator.updatePieceAnimations(tpf, gameTime);
    //    this.pieceAttacher.tickAttacher();

        this.getSpatial().call.getMovement(tempVec);
        let frameVelocity = tempVec.length() / tpf

        if (frameVelocity) {
            let action = this.animateActionState(this.moveState)
        //    console.log(action);
            action.timeScale = frameVelocity * 0.33;
        } else {
            this.animateActionState('IDLE_LEGS')
        }
        this.animateActionState(this.bodyState)


    }

    updateVisualGamePiece() {
        this.getSpatial().stickToObj3D(this.getModelObj3d());
    }

}

export { VisualGamePiece }