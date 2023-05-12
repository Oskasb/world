class PieceAttachment {
    constructor(key, joint, attachmentJoint) {
            this.key = key;
            this.jointOffsets = joint;
            this.attachmentJoint = attachmentJoint;
        };

        setAttachedSpatial = function(spatial) {
            return this.attachmentJoint.registerAttachedSpatial(spatial, this.joint);
        };

        releaseActiveAttachment = function() {
            return this.attachmentJoint.detachAttachedEntity();
        };

        getActiveAttachment = function() {
            return this.attachmentJoint.getAttachedEntity();
        };

        getDynamicJoint() {
            return this.attachmentJoint;
        }

        activateNow = function(weight, timeScale) {

        };
    }

    export { PieceAttachment }

