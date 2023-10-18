import {PlaneGeometry} from "../../../../libs/three/geometries/PlaneGeometry.js";
import {Mesh} from "../../../../libs/three/objects/Mesh.js";
import {MeshBasicMaterial} from "../../../../libs/three/materials/MeshBasicMaterial.js";
import {DoubleSide} from "../../../../libs/three/constants.js";

let bigWorld = null;
let lodCenter = null;
let originalMat = null;

let updateBigGeo = function(tpf) {
    bigWorld.getSpatial().setPosXYZ(Math.floor(lodCenter.x), 5, Math.floor(lodCenter.z));
}

let materialModel = function(model) {
    originalMat = model.originalModel.material.mat
    bigWorld = model;
    console.log("materialModel", originalMat)
/*
    let plane = new PlaneGeometry(256, 256, 256, 256)

    bigWorld = new Mesh(plane, new MeshBasicMaterial());
    bigWorld.rotateX(MATH.HALF_PI);
    //    bigWorld.scale.multiplyScalar(this.tx_width);
    bigWorld.material.opacity = 0.4;
    bigWorld.material.side = DoubleSide;
    bigWorld.material.transparent = true;
    bigWorld.material.depthTest = false;
    bigWorld.material.depthWrite = false;
    ThreeAPI.addToScene(bigWorld)

 */
}

class TerrainBigGeometry {
    constructor() {
        this.call = {
            updateBigGeo:updateBigGeo
        }

    }



    initBigTerrainGeometry(lodC) {
        return;
        // "asset_big_loader"

        client.dynamicMain.requestAssetInstance("asset_big_loader", materialModel)

        lodCenter = lodC;

        ThreeAPI.addPrerenderCallback(this.call.updateBigGeo)
    }






}

export {TerrainBigGeometry}