import {Object3D} from "../../../libs/three/core/Object3D.js";



class WorldAdventure {
    constructor() {
        this.obj3d = new Object3D();

        this.config = {
            pos:[0, 0, 0],
            grid: 1
        }

    }

    getPos() {
        return this.obj3d.position;
    }

}



export { WorldAdventure }