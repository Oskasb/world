import {poolReturn} from "../../application/utils/PoolUtils.js";
let dismiss = function(pathPoint) {
    poolReturn(pathPoint);
}
class PathPoint {
    constructor() {
        this.point = [];
        this.call = {
            dismiss:dismiss
        }
    }

    setPos(vec3) {
        this.point[0] = MATH.decimalify(vec3.x, 10);
        this.point[1] = MATH.decimalify(vec3.y, 10);
        this.point[2] = MATH.decimalify(vec3.z, 10);
    }


}

export {PathPoint}