import {Object3D} from "../../../libs/three/core/Object3D.js";
import {Box3} from "../../../libs/three/math/Box3.js";
import {OBB} from "../../3d/three/assets/OBB.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import {Matrix4} from "../../../libs/three/math/Matrix4.js";
import {Ray} from "../../../libs/three/math/Ray.js";
import {
    inheritAsParent,
    fixParentAroundChildBox,
    testAABOXIntersectPosition, boxObjIntersectsPoint
} from "../../application/utils/ModelUtils.js";

let tempObj = new Object3D()
let tempVec = new Vector3()
let tempVec2 = new Vector3()
let tempMatrix = new Matrix4();
let tempRay = new Ray();
class PhysicalShape {
    constructor() {
        this.debugColor = 'BLACK'
        this.obj3d = new Object3D();
        this.box = new Box3()
        this.OBB = new OBB();
        this.shapeName = null;
    }

    setShapeParams(parentObj3d, parentBox, shapeName, pos, rot, scale) {
        if (this.instance) {
            this.instance.decommissionInstancedModel()
        }

        MATH.vec3FromArray(this.obj3d.position, pos);
        MATH.vec3FromArray(this.obj3d.scale, scale);
        this.obj3d.quaternion.set(0, 0, 0, 1);
        MATH.rotXYZFromArray(this.obj3d, rot);
        inheritAsParent(this.obj3d, parentObj3d);
        this.OBB.center.copy(this.getPos())
        this.OBB.halfSize.copy(this.getScale())
        this.OBB.halfSize.multiplyScalar(0.5);
        tempObj.copy(this.obj3d);
        tempObj.rotateX(-MATH.HALF_PI);
        tempMatrix.makeRotationFromQuaternion(tempObj.quaternion);
        this.OBB.rotation.setFromMatrix4(tempMatrix)

        tempVec.set(1, 1, 1).multiplyScalar(this.getScale().length() * 0.6);

        this.box.min.copy(this.getPos())
        this.box.min.sub(tempVec)
        this.box.max.copy(this.getPos())
        this.box.max.add(tempVec)

        fixParentAroundChildBox(parentBox, this.box, 0.5);



    }

    getPos() {
        return this.obj3d.position;
    }

    getScale() {
        return this.obj3d.scale;
    }

    getQuat() {
        return this.obj3d.quaternion;
    }

    getBoundingMax() {
        return this.box.max;
    }

    getBoundingMin() {
        return this.box.min
    }





    shapeIntersectsPos(pos, insideStore) {
        let insideBounds = testAABOXIntersectPosition(pos, this.box);
        if (insideBounds) {
        //    this.debugColor = 'GREEN'
            let intersects = this.OBB.containsPoint(pos)
            if (intersects) {
                this.OBB.clampPoint(pos, tempVec);
                insideStore.copy(tempVec);
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempVec, to:pos, color:'YELLOW'});
            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: pos, color:'YELLOW', size:0.25})
            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: this.OBB.center, color:'GREEN', size:0.25})
            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:pos, to:this.OBB.center, color:'YELLOW'});
                this.debugColor = 'RED';
            //    return true;
            }
        } else {
            this.debugColor = 'BLACK'
        }
    }

    shapeIntersectsRay(ray, contactPoint) {
        let insideBounds = ray.intersectBox(this.box, tempVec);
        tempVec2.addVectors(ray.origin, ray.direction);
        if (insideBounds) {
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: tempVec, color:'YELLOW', size:0.25})
            //    this.debugColor = 'GREEN'
            let intersects = this.OBB.intersectRay(ray, contactPoint)
        //    contactPoint.sub(ray.origin)
            if (intersects) {
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ray.origin, to:contactPoint, color:'YELLOW'});
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: contactPoint, color:'YELLOW', size:0.25})
                //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: this.OBB.center, color:'GREEN', size:0.25})
                //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:pos, to:this.OBB.center, color:'YELLOW'});
                this.debugColor = 'YELLOW';
                //    return true;
            } else {
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ray.origin, to:tempVec2, color:'RED'});
            }
        } else {
            this.debugColor = 'BLACK'
        }
    }


    drawDebugBox() {

        if (!this.instance) {

            let iconSprites = GuiAPI.getUiSprites("box_tiles_8x8");
            let iconKey =  "rock_hard";
            let iconSprite = iconSprites[iconKey];
            let addSceneBox = function(instance) {
                instance.setActive(ENUMS.InstanceState.ACTIVE_VISIBLE);
                tempObj.copy(this.obj3d);
                tempObj.rotateX(-MATH.HALF_PI)
                tempObj.scale.multiplyScalar(0.01)
                instance.spatial.stickToObj3D(tempObj);
                instance.setSprite(iconSprite);
                ThreeAPI.getScene().remove(instance.spatial.obj3d)
                this.instance = instance;
            }.bind(this);
            client.dynamicMain.requestAssetInstance('asset_box', addSceneBox)

        }

    }

}

export {PhysicalShape}