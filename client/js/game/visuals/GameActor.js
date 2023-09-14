import {Object3D} from "../../../libs/three/core/Object3D.js";
import { GameWalkGrid } from "../gameworld/GameWalkGrid.js";

class GameActor {
    constructor(config) {
        this.actorObj3d = new Object3D();
        this.config = config;
        this.visualGamePiece = null;

        this.gameWalkGrid = new GameWalkGrid();

        let setAsSelection = function () {

        }.bind(this);

        let updateGameActor = function() {
            this.updateGameActor();
        }.bind(this);

        this.call = {
            setAsSelection:setAsSelection,
            updateGameActor:updateGameActor
        }
    }

    getGameWalkGrid() {
        return this.gameWalkGrid;
    }

    getPos() {
        return this.gameWalkGrid.getGridMovementObj3d().position;
    }

    getQuat() {
        return this.gameWalkGrid.getGridMovementObj3d().quaternion;
    }

    setVisualGamePiece(visualGamePiece) {
        visualGamePiece.setVisualPieceObj3d(this.actorObj3d);
        this.visualGamePiece = visualGamePiece;
    }

    getVisualGamePiece() {
        return this.visualGamePiece;
    }

    showGameActor() {
        this.visualGamePiece.attachModelAsset();
    }

    activateGameActor() {
        this.visualGamePiece.attachModelAsset();
        GameAPI.registerGameUpdateCallback(this.call.updateGameActor);
    }

    deactivateGameActor() {
        GameAPI.unregisterGameUpdateCallback(this.call.updateGameActor);
    }

    updateGameActor = function() {

        this.actorObj3d.position.copy(this.getPos())
        this.actorObj3d.quaternion.copy(this.getQuat())

    }

}

export { GameActor }