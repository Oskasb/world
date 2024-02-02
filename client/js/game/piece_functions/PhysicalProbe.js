import {WorldModel} from "../gameworld/WorldModel.js";
import {Object3D} from "../../../libs/three/core/Object3D.js";
import {getBodyByPointer, transformBody} from "../../application/utils/PhysicsUtils.js";

class PhysicalProbe {
    constructor(model, pos) {

        let config = {
            "model": model,
            "pos": pos,
            "rot": [0, 0, 0],
            "scale": [1, 1, 1],
            "on_ground": false,
            "visibility": 0,
            "no_lod":true
        }
        this.obj3d = new Object3D();
        this.worldModel = new WorldModel(config);
        this.ptr = null;
        this.body = null;
    }

    getBodyPointer() {
        let model = this.worldModel.locationModels[0];
        return model.bodyPointers[0];
    }

    getBody() {
        let ptr = this.getBodyPointer();
        if (this.ptr !== ptr) {
            this.ptr = ptr;
            this.body = getBodyByPointer(ptr);
        }
        return this.body;
    }

    setPosQuat(pos, quat) {
        this.obj3d.position.copy(pos);
        this.obj3d.quaternion.copy(quat);
        transformBody(this.obj3d, this.getBody());
    }




}

export {PhysicalProbe}