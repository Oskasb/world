import * as ModelUtils from "../../3d/ModelUtils.js";
import { Vector3 } from "../../../libs/three/math/Vector3.js";

let tempVec = new Vector3();

class VisualGamePiece {
    constructor(config) {
        this.assetId = config['model_asset'];
        this.config = config;

        let updateGamePiece = function(tpf) {
            this.updateVisualGamePiece(tpf);

            if (this.pieceAnimator) {
                this.updateAnimatedGamePiece(tpf, GameAPI.getGameTime());
            }

        }.bind(this);

        this.call = {
            updateGamePiece:updateGamePiece
        }

    }

    attachModelAsset = function() {

        let pieceReady = function(visualPiece) {
            visualPiece.showVisualGamePiece();

            if (visualPiece.pieceAnimator) {
                visualPiece.animateActionState('IDLE_HANDS')
            }

            console.log("Visual Game Piece Ready", visualPiece)
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
        let action = this.pieceActionSystem.actions[actionName][0];
        if (action) {
            if (action.active.length) {
                let actionMap = this.pieceActionSystem.actions[actionName][0].active;
                let animId = MATH.getRandomArrayEntry(actionMap)
                this.applyPieceAnimationState(animId);
            }
        }
    }

    getPlayingAnimation = function(animName) {
        return this.pieceAnimator.isActiveAnimationKey(animName);
    };

    applyPieceAnimationState(animName, duration, channel, weight) {
        this.instance.animator.applyAnimationState(animName, this.animStateMap, duration, channel, weight)
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

    disablePieceAnimations() {
        let mixer = this.getModel().getAnimationMixer()
        if (mixer) {
            ThreeAPI.deActivateMixer(mixer);
        }
    }

    enablePieceAnimations() {
        let mixer = this.getModel().getAnimationMixer()
        if (mixer) {
            ThreeAPI.activateMixer(mixer);
        }
    }

    showVisualGamePiece = function() {
        if (this.getSpatial().geometryInstance) {
            tempVec.set(1, 1, 1);
            this.getSpatial().geometryInstance.setScale(tempVec);

        } else {
            ThreeAPI.showModel(this.getSpatial().obj3d)
            this.enablePieceAnimations()
        }

        ThreeAPI.addPrerenderCallback(this.call.updateGamePiece);

    };

    hideVisualGamePiece() {
        this.getModel().decommissionInstancedModel();
    //    this.gamePieceUpdateCallbacks.length = 0;
        this.disablePieceAnimations()
        ThreeAPI.unregisterPrerenderCallback(this.call.updateGamePiece);
    };


    updateAnimatedGamePiece(tpf, gameTime) {
        this.pieceAnimator.updatePieceAnimations(tpf, gameTime);
    //    this.pieceAttacher.tickAttacher();
    }

    updateVisualGamePiece(tpf) {

    }

}

export { VisualGamePiece }