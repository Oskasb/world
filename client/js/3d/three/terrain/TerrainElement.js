import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";

let calcVec = new Vector3();

class TerrainElement {
    constructor() {
        this.obj3d = new Object3D();
        this.groundData = {x:0, y:0, z:0, w:0};
    }

    setPosition(posVec3) {

        posVec3.y = ThreeAPI.terrainAt(posVec3, calcVec);
        this.obj3d.lookAt(calcVec);
        this.obj3d.position.copy(posVec3);
        ThreeAPI.groundAt(posVec3, this.groundData);
        let gData = this.groundData;
        let pos = this.obj3d.position;
        setTimeout(function() {
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:GameAPI.getMainCharPiece().getPos(), to:pos, color:gData});
        }, Math.random()*1000)

    }

}

export {TerrainElement}