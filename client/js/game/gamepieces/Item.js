class Item {

    constructor(visualGamePiece) {
        this.visualGamePiece = visualGamePiece;
    }

    getPos() {
        return this.visualGamePiece.getPos();
    }

    setBaseSize(x) {
        this.visualGamePiece.getSpatial().setBaseSize(x);
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