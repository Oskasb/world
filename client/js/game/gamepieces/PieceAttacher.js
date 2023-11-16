import { PieceAttachment } from "./PieceAttachment.js";

class PieceAttacher {
    constructor() {
        this.pieceAttachments = {};
        this.activeJoints = [];
        this.attachedWorldEntities = [];
    };

    initPieceAttacher = function (visualGamePiece, rigData) {
        this.visualGamePiece = visualGamePiece;
        return this.setupPieceAttachments(rigData)
    };

    setupPieceAttachments = function (rigData) {

        let joints = rigData['joints'];

        this.visualGamePiece.jointData = joints;

    //    let jointMap = this.gamePiece.modelInstance.originalModel.jointMap;

        for (let key in joints) {
            this.pieceAttachments[key] = new PieceAttachment(key, joints[key], this.visualGamePiece.pieceAnimator.attachmentJoints[key]);
        }
        return this.pieceAttachments;
    };

    attachSpatialToJoint = function (spatial, jointKey) {
        this.attachedWorldEntities.push(spatial);
        let pieceAttachment = this.getAttachmentJoint(jointKey)
        let attachmentJoint = pieceAttachment.setAttachedSpatial(spatial, this.visualGamePiece.getModel());
        this.activeJoints.push(attachmentJoint);
    };

    getAttachmentJointOffsets(key) {
        return this.pieceAttachments[key].jointOffsets;
    }

    getAttachmentJoint = function (key) {

        if (!this.pieceAttachments[key]) {
            console.log("No Joint for key", key, this.pieceAttachments)
        }

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

}
export { PieceAttacher }

