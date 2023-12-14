import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {
    addPhysicsToModel,
    removePhysicalModel
} from "../../../application/utils/PhysicsUtils.js";

let calcVec = new Vector3();
let index = 0;

class TerrainElement {
    constructor(lodLevel) {
        index++;
        this.index = index;
        this.lodLevel = lodLevel;
        this.obj3d = new Object3D();
        this.groundData = {x:0, y:0, z:0, w:0};
        this.hasShade = false;
        this.physicalModel = null;

    }

    getCount() {
        return index;
    }

    setTerrainElementPosition(posVec3) {
        let seed = Math.floor(posVec3.x+posVec3.z*0.01);
        let scale = MATH.decimalify(MATH.sillyRandomBetween(0.3, 1.2, seed), 4);
    //    console.log(scale)
        let rotZ = scale*1000;
        posVec3.y = ThreeAPI.terrainAt(posVec3, calcVec);
        this.obj3d.rotateZ(rotZ);
        calcVec.y = 3
        calcVec.normalize();
        this.obj3d.lookAt(calcVec);
        this.obj3d.rotateX(MATH.decimalify(MATH.sillyRandomBetween(-0.2, 0.2, seed+1), 10));
        this.obj3d.rotateY(MATH.decimalify(MATH.sillyRandomBetween(-0.2, 0.2, seed+2), 10));
        this.obj3d.scale.multiplyScalar(scale);
        this.obj3d.position.copy(posVec3);
        ThreeAPI.groundAt(posVec3, this.groundData);
/*
        let gData = this.groundData;
        let pos = this.obj3d.position;

    setTimeout(function() {
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:GameAPI.getMainCharPiece().getPos(), to:pos, color:gData});
    //    ThreeAPI.shadeGroundAt(pos, 2)
        }, 200 + Math.random()*200)
  */
        return posVec3.y;
    }


    setupElementModel(assetId, callback, shade) {

        this.assetId = assetId;

        let shadeCompleted = ThreeAPI.checkShadeCompleted()
        if (shadeCompleted) {
            this.hasShade = true;
        }

        if (this.hasShade === false) {
            if (typeof (shade) === 'number') {
                ThreeAPI.shadeGroundAt(this.obj3d.position, shade*this.obj3d.scale.x)
            }
            this.hasShade = true;
            return;
        }

        let addInstance = function(instance) {
            instance.stationary = true;
            instance.spatial.stickToObj3D(this.obj3d);
            ThreeAPI.getScene().remove(instance.spatial.obj3d)
            callback(instance, this.groundData);
        }.bind(this);

        client.dynamicMain.requestAssetInstance(assetId, addInstance)
    }


    deactivateElementPhysics() {
        if (this.physicalModel) {
            removePhysicalModel(this.physicalModel);
            this.physicalModel = null;
        }

    }

    activateElementPhysics() {
        if (!this.physicalModel) {
            this.physicalModel = addPhysicsToModel(this.assetId, this.obj3d)
        }
    }


}

export {TerrainElement}