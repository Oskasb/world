import {ConfigData} from "../application/utils/ConfigData.js";
import {PieceAnimator} from "../game/gamepieces/PieceAnimator.js";
import {PieceActionSystem} from "../game/gamepieces/PieceActionSystem.js";
import {Vector3} from "../../libs/three/math/Vector3.js";
import {Object3D} from "../../libs/three/core/Object3D.js";

let tempVec = new Vector3()
let tempObj = new Object3D()
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

   //         instance.spatial.setPosVec3(ThreeAPI.getCameraCursor().getPos())
   //         console.log("Visual Game Piece:",visualPiece);

            if (config['skeleton_rig'])   {
                attachSkeletonRig(visualPiece, config['skeleton_rig'], pieceReady)
            } else {
                pieceReady(visualPiece);
            }

        }

        buildAssetInstance(assetId, config, addModel)

}

function inheritConfigTransform(obj3d, config) {

    if (config.pos) {
        MATH.vec3FromArray(tempVec, config.pos)
        obj3d.position.add(tempVec);
    }


    if (config.scale) {
        MATH.vec3FromArray(tempVec, config.scale)
        obj3d.scale.multiply(tempVec);
    }

    if (config.rot) {
    //    tempObj.quaternion.set(0, 0, 0, 1);
        MATH.rotXYZFromArray(obj3d, config.rot)
    //    obj3d.quaternion.copy(tempObj.quaternion);
    }


    if (config['on_ground']) {
        obj3d.position.y = ThreeAPI.terrainAt(obj3d.position);
    }

}

function inheritAsParent(childObj, parentObj) {
    childObj.quaternion.premultiply(parentObj.quaternion);
    childObj.position.applyQuaternion(parentObj.quaternion)
    childObj.position.add(parentObj.position);
    childObj.scale.x *= parentObj.scale.x;
    childObj.scale.y *= parentObj.scale.y;
    childObj.scale.z *= parentObj.scale.z;

}


export {

    setupVisualModel,
    buildAssetInstance,
    attachSkeletonRig,
    inheritConfigTransform,
    inheritAsParent
}