import { PieceAnim } from "./PieceAnim.js";
import { AttachmentJoint } from "../../3d/three/animations/AttachmentJoint.js";
import { AnimationState } from "../../3d/three/animations/AnimationState.js";

class PieceAnimator {
    constructor() {
        this.animations = {};
        this.activeAnimations = [];
        this.activeActions = [];
        this.removes = [];

        this.animationStates = [];
        this.attachmentJoints = [];
        this.attachmentUpdates = [];

        this.timeAtKey = 0;
        this.poseKey = ENUMS.getKey('Animations', ENUMS.Animations.GD_MID_R);

        let setAttachmentUpdated = function(joint) {
            this.addAttachmentUpdate(joint)
        }.bind(this);

        this.callbacks = {
            setAttachmentUpdated:setAttachmentUpdated
        }

    }

    initPieceAnimator = function(piece, rigData) {
        this.gamePiece = piece;
        return this.setupPieceAnimations(rigData)

    };

    setupAnimations = function(model, scale) {

        let joints = model.jointMap;
        let anims = model.animMap;
        let joint;

     //   console.log(joints);

        for (let key in joints) {
            joint = new AttachmentJoint(key, scale, joints[key]);
            this.attachmentJoints[key] = joint;
        }

        this.jointMap = joints;

        for (let key in anims) {
            let animState = new AnimationState(anims[key]);
            this.animationStates.push(animState);
        }


    };

    setSizeForJoints(size) {
        for (let key in this.attachmentJoints) {
            let joint = this.attachmentJoints[key];
            joint.parentScale.set(size, size, size);
        }
    }

    addAttachmentUpdate = function(attachmentUpdate) {
        this.attachmentUpdates.push(attachmentUpdate);
    };


    setupPieceAnimations = function(rigData) {

        let animations = rigData.data['animations'];
        this.actionMap = rigData.data['action_map'];
    //    console.log("Anim states: ", rigData);
        for (let key in animations) {

            let animState = MATH.getFromArrayByKeyValue(this.animationStates, 'key', key)
        //    console.log("Anim state: ", animState);

            this.animations[key] = new PieceAnim(key, rigData, animState);
        //    console.log("Add anim: ", key);
        }

        return animations;
    };

    getPieceAnim = function(animationKey) {
        return this.animations[animationKey];
    };

    setPoseKey = function(key) {
        this.timeAtKey = 0;
        this.poseKey = key
    };

    getPoseKey = function() {
        return this.poseKey;
    };

    getTimeAtKey = function() {
        return this.timeAtKey;
    };

    activatePieceAnimation = function(animationKey, weight, timeScale, fadeTime) {

        let anim = this.getPieceAnim(animationKey);

        if (!anim) {
            console.log("Bad animationKey: ", animationKey)
            return;
        }

        if (this.activeAnimations.indexOf(anim) === -1) {
            anim.activateNow(weight, timeScale, fadeTime);

            let currentInChannel = MATH.getFromArrayByKeyValue(this.activeAnimations, 'channel', anim.channel);

            if (currentInChannel) {
                currentInChannel.notifyOverwrite(anim.fadeTime);
            }

            this.activeAnimations.push(anim);
        } else {

            if (anim.channel === 0) {
                // console.log("Refresh Legs")
            }

            anim.refreshDuration();
            if (timeScale) {
                anim.setTimeScale(timeScale);
            }
            if (weight) {
                anim.setWeight(weight);
            }
        }

    };

    isActiveAnimationKey = function(key) {
    //    console.log(this.activeAnimations)
        return MATH.getFromArrayByKeyValue(this.activeAnimations, 'key', key);
    };

    updatePieceAnimations = function(tpf, time, frozen) {

        this.timeAtKey += tpf;

        for (let i = 0; i < this.activeAnimations.length; i++) {
            this.activeAnimations[i].updateAnimation(tpf, time, this.removes, frozen);
        }

        while (this.removes.length) {
            MATH.quickSplice(this.activeAnimations, this.removes.pop());
        }

    };
}

export { PieceAnimator }

