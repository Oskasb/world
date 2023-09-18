import {ConfigData} from "../application/utils/ConfigData.js";
import {PieceAnimator} from "../game/gamepieces/PieceAnimator.js";
import {PieceActionSystem} from "../game/gamepieces/PieceActionSystem.js";

function buildAssetInstance(assetId, config, callback) {

    let addModelInstance = function(instance) {
        let obj3d = instance.spatial.obj3d
    //    ThreeAPI.getScene().remove(obj3d)

    //    instance.spatial.stickToObj3D(obj3d);

        if (config['rot']) {
            obj3d.rotateX(config.rot[0]);
            obj3d.rotateY(config.rot[1]);
            obj3d.rotateZ(config.rot[2]);
        }

        if (config['scale']) {
            MATH.vec3FromArray(obj3d.scale, config.scale)
        }

        instance.spatial.stickToObj3D(obj3d);

        callback(instance);
    };

    client.dynamicMain.requestAssetInstance(assetId, addModelInstance)

}

function attachSkeletonRig(visualPiece, rigId, pieceReady) {
    visualPiece.rigId = rigId;

    visualPiece.setPieceAnimator(new PieceAnimator());
    visualPiece.setPieceActionSystem( new PieceActionSystem());

    let assetInstance = visualPiece.instance;
    let skellRig = rigId

    let assetDataCB = function(assetsConfig) {

        let parsed = assetConfigData.parseConfigData()
        let assetConfig = parsed[visualPiece.assetId].config

        let rigDataKey = assetConfig['rig'];

        let rigData = new ConfigData("ASSETS", "RIGS", rigDataKey);
        let onRigData = function(config) {

    //        console.log("rigConf:", rigDataKey, config)
            let skeletonData = new ConfigData("GAME", "SKELETON_RIGS");

            visualPiece.rigData = MATH.getFromArrayByKeyValue(config, 'id', rigDataKey);

            let scaleVec = ThreeAPI.tempVec3;
            let size = 1 // gamePiece.getStatusByKey('size')
            scaleVec.set(size, size, size);
            visualPiece.pieceAnimator.setupAnimations(assetInstance.originalModel, scaleVec);

            //    gamePiece.pieceAttachments = gamePiece.pieceAttacher.initPieceAttacher(gamePiece, skeletonData.data);

            let onSkelRigData = function (skelConfig) {
   //             console.log("SkelRig", skelConfig, skeletonData);
                visualPiece.animStateMap = visualPiece.pieceAnimator.initPieceAnimator(skeletonData);
   //             console.log(visualPiece.animStateMap)
                visualPiece.pieceActionSystem.initPieceActionSystem(visualPiece, skeletonData.data);
                pieceReady(visualPiece)
            }

            skeletonData.addUpdateCallback(onSkelRigData)
            skeletonData.fetchData(skellRig);

        }

        rigData.parseConfig(rigDataKey, onRigData)
    }

    let assetConfigData = new ConfigData("ASSETS", "MODELS", null, null, null, assetDataCB)

}

function setupVisualModel(visualPiece, assetId, config, pieceReady) {

        let addModel = function(instance) {
            visualPiece.setModel(instance);
            visualPiece.obj3d = instance.spatial.obj3d;
            instance.spatial.setPosVec3(ThreeAPI.getCameraCursor().getPos())
   //         console.log("Visual Game Piece:",visualPiece);

            if (config['skeleton_rig'])   {
                attachSkeletonRig(visualPiece, config['skeleton_rig'], pieceReady)
            } else {
                pieceReady(visualPiece);
            }

        }

        buildAssetInstance(assetId, config, addModel)

}


export {
    setupVisualModel,
    buildAssetInstance,
    attachSkeletonRig
}