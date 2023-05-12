import { ConfigData } from "../../application/utils/ConfigData.js";

class PieceComposer {
    constructor(gamePiece, config, callback) {
        this.composeGamePiece(gamePiece, config, callback)
    }

    composeGamePiece(gamePiece, config, callback) {

        let pieceData = new ConfigData("GAME", "PIECES")
        pieceData.fetchData(config.piece); // .f
        let assetId = pieceData.data["model_asset"];

        let assetData = new ConfigData("ASSETS", "MODELS")
        assetData.fetchData(assetId);

        if (pieceData.data['slot']) {
            gamePiece.setEquipSlotId(pieceData.data['slot'])
            let statusData = pieceData.data['status'];
            for (let key in statusData) {
                gamePiece.setStatusValue(key, statusData[key]);
            }
        }

        let setupSkelRig = function(assetInstance, callback) {

            let skellRig = pieceData.data['skeleton_rig']

            if (skellRig) {

                let rigDataKey = assetData.data['rig'];
                let rigData = new ConfigData("ASSETS", "RIGS", rigDataKey);
                let onRigData = function(config) {

                    let skeletonData = new ConfigData("GAME", "SKELETON_RIGS");

                    let onSkelRigData = function (config) {
              //          console.log("SkelRig", config);
                    }

                    skeletonData.addUpdateCallback(onSkelRigData)
                    skeletonData.fetchData(skellRig);

            //        console.log("Rig Data: ", config)

                    gamePiece.rigData = MATH.getFromArrayByKeyValue(config, 'id', rigDataKey);

                        let scaleVec = ThreeAPI.tempVec3;
                        let size = gamePiece.getStatusByKey('size')
                        scaleVec.set(size, size, size);
                        gamePiece.pieceAnimator.setupAnimations(assetInstance.originalModel, scaleVec);
                        gamePiece.animStateMap = gamePiece.pieceAnimator.initPieceAnimator(gamePiece, skeletonData);
                        gamePiece.pieceActionSystem.initPieceActionSystem(gamePiece, skeletonData.data);
                        //    gamePiece.pieceAnimator.activatePieceAnimation('IDLE', 1, 1, 1)
                        gamePiece.pieceAttachments = gamePiece.pieceAttacher.initPieceAttacher(gamePiece, skeletonData.data);

                    callback(gamePiece);
                }

                rigData.addUpdateCallback(onRigData)

            //    rigData.fetchData(rigData.data[rigDataKey]);

                //   console.log("Rig Piece:", assetId, pieceData.data, skeletonData.data);
            } else {
                //   console.log("not rigged piece:", assetId, config)
                callback(gamePiece);
            }

        }

        let modelInstanceCB = function(assetInstance) {
            //   console.log(assetInstance);
            gamePiece.setModelInstance(assetInstance);

            if (config.pos) {
                gamePiece.getSpatial().setPosXYZ(
                    config.pos[0],
                    config.pos[1],
                    config.pos[2]
                )
            }

            if (config.rot) {
                gamePiece.getSpatial().rotateXYZ(
                    config.rot[0],
                    config.rot[1],
                    config.rot[2]
                )
            }

            setupSkelRig(assetInstance, callback)


        };

        let assetLoaded = function(asset) {
            client.dynamicMain.requestAssetInstance(asset.id, modelInstanceCB)
        };

        client.dynamicMain.requestAsset(assetId, assetLoaded)


    }


}

export { PieceComposer }