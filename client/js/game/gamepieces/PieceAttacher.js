import { PieceAttachment } from "./PieceAttachment.js";

class PieceAttacher {
    constructor() {
        this.pieceAttachments = {};
        this.activeJoints = [];
        this.attachedWorldEntities = [];
    };

    initPieceAttacher = function (piece, rigData) {
        this.gamePiece = piece;
        return this.setupPieceAttachments(rigData)
    };

    setupPieceAttachments = function (rigData) {

        let joints = rigData['joints'];

        this.gamePiece.jointData = joints;

    //    let jointMap = this.gamePiece.modelInstance.originalModel.jointMap;

        for (let key in joints) {
            this.pieceAttachments[key] = new PieceAttachment(key, joints[key], this.gamePiece.pieceAnimator.attachmentJoints[key]);
        }
        return this.pieceAttachments;
    };

    attachSpatialToJoint = function (spatial, jointKey) {
        this.attachedWorldEntities.push(spatial);
        let pieceAttachment = this.getAttachmentJoint(jointKey)
        let attachmentJoint = pieceAttachment.setAttachedSpatial(spatial, this.gamePiece.modelInstance);

        this.activeJoints.push(attachmentJoint);
    };

    getAttachmentJointOffsets(key) {
        return this.pieceAttachments[key].jointOffsets;
    }

    getAttachmentJoint = function (key) {
        return this.pieceAttachments[key].getDynamicJoint();
    };

    isActiveJointKey = function (key) {
        return this.getAttachmentJoint(key).getActiveAttachment();
    };

    releaseJointKey = function (key, spatial) {
        MATH.quickSplice(this.attachedWorldEntities, spatial);
        let pieceAttachment = this.getAttachmentJoint(key)
        let attachmentJoint = pieceAttachment.releaseActiveAttachment();
        return MATH.quickSplice(this.activeJoints, attachmentJoint);
    };

    removeAttachedEntities = function () {
        while (this.attachedWorldEntities.length) {
            this.attachedWorldEntities.pop();
        }
    };

    tickAttacher(){
        for (let i = 0; i < this.activeJoints.length;i++) {
            let joint = this.activeJoints[i];
            if (joint.dynamicBone) {
                joint.inheritJointDynamicPosition()
            }
        }
    }

}
export { PieceAttacher }

