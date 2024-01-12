import {MATH} from "../../../client/js/application/MATH.js";

class ServerActorPathWalker {
    constructor() {
        this.pathPoints = []
    }

    tileCount() {
        return this.pathPoints.length;
    }

    setPathPoints(points) {
        MATH.copyArrayValues(points, this.pathPoints)
    }

    walkPath(progress) {
        console.log("walk path", progress)
    }


}



export {ServerActorPathWalker}