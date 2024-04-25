import {Object3D} from "../../../libs/three/core/Object3D.js";

class PhysicalProbe {
    constructor(model, pos) {
        this.obj3d = new Object3D();
    }


    setPosQuat(pos, quat) {
        this.obj3d.position.copy(pos);
        this.obj3d.quaternion.copy(quat);
    }


}

export {PhysicalProbe}