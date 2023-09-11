import {configDataList} from "../application/utils/ConfigUtils.js";
import {VisualGamePiece} from "./visuals/VisualGamePiece.js";

let visualConfigs = {};

let loadVisualPiece = function(event) {
    console.log("Load Visual Piece:", event, visualConfigs[event.id])
    let visualPiece = new VisualGamePiece(visualConfigs[event.id]);
    visualPiece.attachModelAsset();
}

class GamePieceSystem {
    constructor() {
    }

    initGamePieceSystem = function() {
        let onData = function(data) {
            visualConfigs = data;
            console.log("initGamePieceSystem", visualConfigs)
        }

        configDataList("GAME","VISUALS", onData)

        evt.on(ENUMS.Event.LOAD_VISUAL_PIECE, loadVisualPiece)

    }


}

export { GamePieceSystem }