import { PieceAction } from "./PieceAction.js";

class PieceActionSystem {
    constructor() {
        this.actions = {}
        this.gamePiece = null;
        this.activeAction = null;
        this.actionUpdate = {
            animKey:null,
            animChannel:0,
            lastAnim:null,
            lastAnimChannel:0,
            switchFrame:false
        }
    }
    initPieceActionSystem(visualPiece, rigData) {
        this.visualPiece = visualPiece;
        let actions = this.actions;
        let addActionGroup = function(actionList, data) {
            for (let i = 0; i < data.length; i++) {
                actionList.push(new PieceAction(data[i]))
            }
        }

        for (let key in rigData['action_maps']) {
            actions[key] = [];
            addActionGroup(actions[key], rigData['action_maps'][key])
        }

    }

    activateActionOfType(actionType, actionName) {
        let pieceAction = this.getPieceActionOfType(actionType, actionName);
        pieceAction.activatePieceAction();
        this.activeAction = pieceAction;
        return pieceAction;
    }

    getPieceActionOfType(actionType, name) {
        if (name) {
            return MATH.getFromArrayByKeyValue(this.actions[actionType], 'name', name);
        } else {
            return MATH.getRandomArrayEntry(this.actions[actionType])
        }
    }

    applyPieceActionProgress(pieceAction, source, init, active, end, duration, clamp) {
        let actionUpdate = this.actionUpdate;
        pieceAction.updatePieceActionState(actionUpdate, source, init, active, end);

        if (!this.visualPiece.getPlayingAnimation( actionUpdate.animKey)) {
            if (actionUpdate.lastAnim) {
                this.visualPiece.applyPieceAnimationState(actionUpdate.lastAnim, actionUpdate.lastDuartion*0.5, actionUpdate.lastAnimChannel, 0, clamp)
            }
            this.visualPiece.applyPieceAnimationState(actionUpdate.animKey, duration+0.1, actionUpdate.animChannel, null, clamp)
            actionUpdate.lastAnim = actionUpdate.animKey;
            actionUpdate.lastDuartion = duration;
            actionUpdate.lastAnimChannel = actionUpdate.animChannel;
        } else {
        //    let weight = Math.random();
        //    this.visualPiece.activatePieceAnimation(actionUpdate.animKey, weight)
        }
        return actionUpdate.animKey;
    }

}

export { PieceActionSystem }