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

    setVisualGamePiece(visualGamePiece) {
        visualGamePiece.setHostObj3d(this.actorObj3d);
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
    //    this.obj3d.copy(ThreeAPI.getCameraCursor().getCursorObj3d())
    }

}

export { GameActor }