class Item {

    constructor(visualGamePiece, config) {
        this.config = config;
        this.visualGamePiece = visualGamePiece;
    }


    getEquipSlotId() {
        return this.config['equip_slot']
    }

    getPos() {
        return this.visualGamePiece.getPos();
    }

    getQuat() {
        return this.visualGamePiece.getQuat();
    }

    getSpatial() {
        return this.getModel().getSpatial()
    }

    getModel() {
        return this.visualGamePiece.getModel();
    }

    getVisualGamePiece() {
        return this.visualGamePiece
    }

}

export {Item}