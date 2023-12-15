import * as ModelUtils from "../../application/utils/ModelUtils.js";
import { Vector3 } from "../../../libs/three/math/Vector3.js";
import { Object3D } from "../../../libs/three/core/Object3D.js";
import { VisualPathPoints } from "./VisualPathPoints.js";
import {poolReturn, poolFetch} from "../../application/utils/PoolUtils.js";

let tempVec = new Vector3();
let tempObj3d = new Object3D()
let visualIndex = 0;

let paletteTemplatesOptions = [
    'DEFAULT',
    'ITEMS_RED',
    'ITEMS_BLUE',
    'ITEMS_GREEN',
    'NATURE',
    'NATURE_DESERT',
    'NATURE_SUMMER',
    'NATURE_FALL',
    'NATURE_WINTER'
]

class VisualGamePiece {
    constructor(config) {

        this.visualIndex = visualIndex;
        visualIndex ++;

        let gamePiece // will be either item or actor... needs "getStatus()"

        this.visualPathPoints = new VisualPathPoints();

        this.visualModelPalette = poolFetch('VisualModelPalette')

        let paletteUpdateCB = function(colorParams, settings) {
            let piece = this.call.getPiece();
            if (!piece) {
                console.log("no Piece yet...", gamePiece)
                return;
            }
        //    console.log("Apply colors", colorParams, piece)
            let statusValues = piece.getStatus(ENUMS.ItemStatus.PALETTE_VALUES);
            MATH.emptyArray(statusValues);
            for (let key in colorParams) {
                statusValues.push(colorParams[key]);
            }
            for (let key in settings) {
                statusValues.push(settings[key])
            }
            piece.setStatusKey(ENUMS.ItemStatus.PALETTE_VALUES, statusValues)
        }.bind(this)

        this.visualModelPalette.onUpdateCallbacks.push(paletteUpdateCB)
        this.visualModelPalette.applyPaletteSelection(paletteTemplatesOptions[Math.floor(Math.random() * paletteTemplatesOptions.length)], null)

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
                applyVisualPiecePalette()
            } else {
                ThreeAPI.showModel(this.getSpatial().obj3d)
                this.getSpatial().obj3d.frustumCulled = false;
                this.enablePieceAnimations()
            }

        }.bind(this);

            let instance = null;

            let setInstance = function(inst) {
                instance = inst;
                if (gamePiece) {
                    applyVisualPiecePalette();
                }
            }.bind(this);

            let getInstance = function() {
                if (!instance) {
                    console.log("No instance!")
                }
                return instance;
            }

            let getPiece = function() {
                return gamePiece;
            }.bind(this)

        let setPiece = function(piece) {
            gamePiece = piece;
            console.log("set Piece ", this.call.getPiece())
                        applyVisualPiecePalette()
        }.bind(this)

        let applyVisualPiecePalette = function() {
                if (!instance) return;
                this.visualModelPalette.applyPaletteToInstance(instance);
        }.bind(this)

        this.call = {
                applyVisualPiecePalette:applyVisualPiecePalette,
            getPiece:getPiece,
            setPiece:setPiece,
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
        this.visualModelPalette.closePalette()
        poolReturn(this.visualModelPalette);
        this.call.hideVisualPiece();
        this.getModel().decommissionInstancedModel();
    };

    setVisualPieceActor = function(actor) {
        this.obj3d = actor.actorObj3d
        this.call.setPiece(actor);
    }

    getModelObj3d() {
        return this.obj3d;
    }

    getCenterMass() {
        tempVec.copy(this.getPos());
        tempVec.y += this.call.getPiece().getStatus(ENUMS.ActorStatus.HEIGHT) * 0.7;
        return tempVec;
    }

    getAboveHead(above) {
        tempVec.copy(this.getPos());
        tempVec.y += this.call.getPiece().getStatus(ENUMS.ActorStatus.HEIGHT) + above;
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

        this.call.getPiece().getSpatialVelocity(tempVec);
    //    tempVec.normalize();
    //    tempVec.multiplyScalar()
    //    this.getSpatial().call.getMovement(tempVec);
        let frameVelocity = 0;
        if (tempVec.length() > 0.001) {
            frameVelocity = this.call.getPiece().getStatus(ENUMS.ActorStatus.MOVEMENT_SPEED);
            let action = this.animateActionState(this.call.getPiece().getStatus(ENUMS.ActorStatus.MOVE_STATE))
            if (!action) {
                console.log("No action to update",this);
                return;
            }
        //    console.log(action);
            action.timeScale = frameVelocity * 0.33;
        } else {
            this.animateActionState(this.call.getPiece().getStatus(ENUMS.ActorStatus.STAND_STATE))
        }
        this.animateActionState(this.call.getPiece().getStatus(ENUMS.ActorStatus.BODY_STATE))

    }

    updateVisualGamePiece() {
        if (this.hidden === false) {
            let piece = this.call.getPiece()
            if (piece.actorStatus) {
                this.call.getPiece().getSpatialPosition(tempObj3d.position);
                this.call.getPiece().getSpatialQuaternion(tempObj3d.quaternion);
                this.call.getPiece().getSpatialScale(tempObj3d.scale);

           //     console.log(tempObj3d.position)
                this.getSpatial().stickToObj3D(tempObj3d);

            } else {
            //    console.log("No piece...") // items do otherwise
            }
        } else {
        //    this.getSpatial().setPosXYZ(0, -100000,0)
        }

    }

}

export { VisualGamePiece }