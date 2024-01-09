import {MATH} from "../../../../client/js/application/MATH.js";

class GridPoint {
    constructor(pos) {
        this.point = [];
        this.setPos(pos)
    }

    setPos(vec3) {
        this.point[0] = MATH.decimalify(vec3.x, 10);
        this.point[1] = MATH.decimalify(vec3.y, 10);
        this.point[2] = MATH.decimalify(vec3.z, 10);
    }


}

export {GridPoint}