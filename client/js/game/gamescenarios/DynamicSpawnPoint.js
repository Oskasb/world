import {Object3D} from "../../../libs/three/core/Object3D.js";

let worldSize = 2048;

function findSpawnPosition(sPoint) {
    sPoint.obj3d.position.x = worldSize*(MATH.sillyRandom(sPoint.index + sPoint.retries*0.0011 + sPoint.worldLevel)-0.5);
    sPoint.obj3d.position.z = worldSize*(MATH.sillyRandom(sPoint.index + sPoint.retries*0.0013 + sPoint.worldLevel + 1)-0.5);
    let y = ThreeAPI.terrainAt(sPoint.obj3d.position);

    if (y > 0.5 && y < sPoint.yMax) {
        sPoint.obj3d.position.y = y;
        sPoint.isActive = true;
    } else {
        sPoint.retries++;
        retry(sPoint);
    }

}

function retry(sPoint) {
    if (Math.random() < 0.1) {
        setTimeout(function() {
            console.log("retries", sPoint.retries);
            findSpawnPosition(sPoint);
        }, 100);
    } else {
        findSpawnPosition(sPoint);
    }

}

class DynamicSpawnPoint {
    constructor() {
        this.obj3d = new Object3D();
        this.retries = 0;
    }



    initDynamicSpawnPoint(index, maxPoints, worldLevel, yMax, lvlMin, lvlMax) {
        this.isActive = false;
        this.retries = 0;
        this.index = index;
        this.maxPoints = maxPoints;
        this.worldLevel = worldLevel;
        this.yMax = yMax;
        findSpawnPosition(this);
    }

    getPos() {
        return this.obj3d.position;
    }




}

export {DynamicSpawnPoint}