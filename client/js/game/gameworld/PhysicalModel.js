import {Object3D} from "../../../libs/three/core/Object3D.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";

class PhysicalModel {
    constructor() {
        this.obj3d = new Object3D();
        this.shapes = []
    }

    initPhysicalWorldModel(worldModel, obj3d) {
        this.obj3d.copy(obj3d);
        MATH.emptyArray(this.shapes);

    }



    addPhysicalModelShape() {

    }



}

export {PhysicalModel}