import {Object3D} from "../../../libs/three/core/Object3D.js";
import {Box3} from "../../../libs/three/math/Box3.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import {inheritAsParent, fixParentAroundChildBox} from "../../application/utils/ModelUtils.js";

let tempObj = new Object3D()
let tempVec = new Vector3()

class PhysicalShape {
    constructor() {
        this.obj3d = new Object3D();
        this.box = new Box3()
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
        tempVec.set(1, 1, 1).multiplyScalar(this.getScale().length() * 0.6);


        this.box.min.copy(this.getPos())
        this.box.min.sub(tempVec)
        this.box.max.copy(this.getPos())
        this.box.max.add(tempVec)

        fixParentAroundChildBox(parentBox, this.box);



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