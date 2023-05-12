import { TileIndicator } from "../../application/ui/gui/game/TileIndicator.js";

class GridTile {
    constructor(tileX, tileZ, size, thickness, obj3d) {
        this.hidden = false;
        this.tileX = tileX;
        this.tileZ = tileZ;
        this.size = size;
        this.thickness = thickness;
        this.occupant = null;
        this.pathClaimant = null;
        this.obj3d = obj3d;
        this.tileStatus = 'FREE'
        this.tileIndicator = new TileIndicator(this);
    }

    indicateTileStatus(bool) {
        if (bool) {
            this.tileIndicator.activateTileIndicator();
        } else {
            this.tileIndicator.removeTileIndicator();
        //    this.tileIndicator.removeIndicatorFx();
            this.tileStatus = 'FREE'
        }

    }

    setPathClaimant(gamePiece) {
        this.pathClaimant = gamePiece;
    }

    getPathClaimant() {
        return this.pathClaimant
    }

    setOccupant(gamePiece) {
        this.occupant = gamePiece;
    }

    getOccupant() {
        return this.occupant;
    }

    setTileStatus(status) {
        if (status === 'FREE') {
            this.setPathClaimant(null);
            this.setOccupant(null);
        }
        this.tileStatus = status;
    }
    getTileStatus() {
        return this.tileStatus;
    }
    getPos() {
        return this.obj3d.position;
    }
    setTileQuat(quat) {
        this.obj3d.quaternion.copy(quat)
    }
    setTileInstance(instance) {
        this.instance = instance;
    }

    getTileInstance() {
        return this.instance;
    }



}

export { GridTile }