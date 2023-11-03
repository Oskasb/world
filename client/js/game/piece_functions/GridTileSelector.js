import {Object3D} from "../../../libs/three/core/Object3D.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";

class GridTileSelector {
    constructor() {
        this.obj3d = new Object3D();
        this.initPos = new Vector3()
    }

    setPos(posVec) {
        this.initPos.copy(posVec);
        this.obj3d.position.copy(posVec);
    }

    getPos() {
        return this.initPos
    }

    getObj3D() {
        return this.obj3d;
    }


    updateTileSelector() {

    }

    activateGridTileSelector() {


        GameAPI.registerGameUpdateCallback(this.updateTileSelector)
    }

    deactivateGridTileSelector() {


        GameAPI.unregisterGameUpdateCallback(this.updateTileSelector)
    }


}

export { GridTileSelector }