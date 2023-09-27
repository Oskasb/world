import {Vector3} from "../../../../../libs/three/math/Vector3.js";
import {borrowBox} from "../../../ModelUtils.js";
let index = 0;
let boxColor = {x:1, y:1, z:1}

let tempVec = new Vector3(1, 1, 1)
class VegetationPatch {
    constructor() {
        this.index = index;
        index++
        this.position = new Vector3();
    }

    setVegTile(vegTile) {
        this.position.copy(vegTile.getPos())

        let borrowedBox = borrowBox();
        borrowedBox.min.copy(this.position).sub(tempVec);
        borrowedBox.max.copy(this.position).add(tempVec);
        boxColor.x = Math.sin(this.index*1.1);
        boxColor.y = Math.cos(this.index*0.4);
        boxColor.z = Math.cos(this.index*1.5);
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:borrowedBox.min, max:borrowedBox.max, color:boxColor})

    }



}

export {VegetationPatch }