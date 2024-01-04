import {Vector3} from "../../../client/libs/three/math/Vector3.js";

class ServerTile {
    constructor(tileInfo) {
        this.pos = new Vector3(tileInfo.posX, tileInfo.posY, tileInfo.posZ);
        this.walkable = tileInfo.walkable;
        this.blocking = tileInfo.blocking;
        this.tileX = tileInfo.tileX;
        this.tileZ = tileInfo.tileZ;
        this.gridI = tileInfo.gridI;
        this.gridJ = tileInfo.gridJ;
    }

    getPos() {
        return this.pos;
    }

}

export { ServerTile }