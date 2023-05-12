class PieceAction {
    constructor(actionData) {
        this.name = actionData.name;
        this.source = actionData.source;
        this.init = actionData.init;
        this.active = actionData.active;
        this.end = actionData.end;
        this.activeAction = {
            init:null,
            active:null,
            end:null
        }
        this.currentAnim = null;
    }

    activatePieceAction() {
        this.activeAction = {
            source:MATH.getRandomArrayEntry(this.source),
            init:MATH.getRandomArrayEntry(this.init),
            active:MATH.getRandomArrayEntry(this.active),
            end:MATH.getRandomArrayEntry(this.end),
        }
    }

    updatePieceActionState(actionUpdate, source, init, active, end) {

        if (source < 1) {
            actionUpdate.animKey = this.activeAction.source;
            actionUpdate.animChannel = 1;
        } else if (init < 1) {
            actionUpdate.animKey = this.activeAction.init;
            actionUpdate.animChannel = 1;
        } else if (active < 1) {
            actionUpdate.animKey = this.activeAction.active;
            actionUpdate.animChannel = 1;
        } else {
            actionUpdate.animKey = this.activeAction.end;
            actionUpdate.animChannel = 1;
        }

    }

}

export { PieceAction }