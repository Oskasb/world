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
        this.standState = 'IDLE_LEGS';

        this.hidden = true;

        this.addedAssets = [];
        this.obj3d = new Object3D();

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

            let setupModel = function(pieceReady) {
                ModelUtils.setupVisualModel(this, this.assetId, this.config, pieceReady);
            }.bind(this)


        let hideVisualPiece = function() {
            this.hidden = true;

        //    updateVisualGamePiece(0.1)
            ThreeAPI.unregisterPrerenderCallback(updateVisualGamePiece);

            if (this.getSpatial().call.isInstanced()) {
            //    this.getSpatial().setPosXYZ(0, 0, 0);
                this.getSpatial().call.hideSpatial(true)
            } else {
                ThreeAPI.hideModel(this.getSpatial().obj3d)
                this.disablePieceAnimations()

            }

        }.bind(this)

        let showVisualPiece = function() {
            this.hidden = false;
            ThreeAPI.addPrerenderCallback(updateVisualGamePiece);

            if (this.getSpatial().call.isInstanced()) {
                this.getSpatial().call.hideSpatial(false)
            } else {
                ThreeAPI.showModel(this.getSpatial().obj3d)
                this.getSpatial().obj3d.frustumCulled = false;
                this.enablePieceAnimations()
            }

        }.bind(this);

            let instance = null;

            let setInstance = function(inst) {
                instance = inst;
            }

            let getInstance = function() {
                if (!instance) {
                    console.log("No instance!")
                }
                return instance;
            }

        this.call = {
            setInstance:setInstance,
            getInstance:getInstance,
            updateVisualGamePiece:updateVisualGamePiece,
            setupModel:setupModel,
            hideVisualPiece:hideVisualPiece,
            showVisualPiece:showVisualPiece
        }

    }

    attachModelAsset = function(onReady) {

        let pieceReady = function(visualPiece) {
            visualPiece.call.showVisualPiece();
            onReady(this)
        }.bind(this)

        this.call.setupModel(pieceReady)
    }

    addModelAsset(assetId) {

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
        return this.call.getInstance().animator.applyAnimationState(animName, this.animStateMap, duration, channel, weight)
    }

    setModel(instance) {
        this.call.setInstance(instance);

    }

    getModel() {
        return this.call.getInstance();
    }

    getSpatial() {

        return this.call.getInstance().getSpatial();
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



    removeVisualGamePiece() {
        this.call.hideVisualPiece();
        this.getModel().decommissionInstancedModel();
    };

    setVisualPieceActor = function(actor) {
        this.obj3d = actor.actorObj3d
        this.actor = actor;
    }

    getModelObj3d() {
        return this.obj3d;
    }

    setMoveState = function(state) {
        this.moveState = state;
    }

    setBodyState = function(state) {
        this.bodyState = state;
    }

    setStandState = function(state) {
        this.standState = state;
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
        let jointMap = this.call.getInstance().getJointMap();
        return MATH.getRandomObjectEntry(jointMap)
    }

    getRandomBone() {
        let map = this.call.getInstance().getBoneMap();
        return MATH.getRandomObjectEntry(map)
    }

    getBoneWorldPosition(bone) {
        this.call.getInstance().updateBoneWorldTransform(bone, tempObj3d)
        return tempObj3d.position;
    }

    getJointWorldPosition(boneName) {
        if (boneName === 'root_node') {
            return this.getCenterMass();
        }
        this.call.getInstance().getBoneWorldTransform(boneName, tempObj3d)
        return tempObj3d.position;
    }

    updateAnimatedGamePiece(tpf, gameTime) {
        this.pieceAnimator.updatePieceAnimations(tpf, gameTime);

        this.getSpatial().call.getMovement(tempVec);
        let frameVelocity = tempVec.length() / tpf

        if (frameVelocity) {
            let action = this.animateActionState(this.moveState)
            if (!action) {
                console.log("No action to update",this);
                return;
            }
        //    console.log(action);
            action.timeScale = frameVelocity * 0.33;
        } else {
            this.animateActionState(this.standState)
        }
        this.animateActionState(this.bodyState)

    }

    updateVisualGamePiece() {
        if (this.hidden === false) {
            this.getSpatial().stickToObj3D(this.getModelObj3d());
        } else {
            this.getSpatial().setPosXYZ(0, -100000,0)
        }

    }

}

export { VisualGamePiece }