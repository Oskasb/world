class Item {

    constructor(visualGamePiece, config) {
        this.config = config;
        this.visualGamePiece = visualGamePiece;

        let addModifiers = {};

        let addMods = config['status_add_modifiers']
        if (addMods) {
            for (let i = 0; i < addMods.length; i++) {
                if (addModifiers[addMods[i].status]) {
                    addModifiers[addMods[i].status].push(addMods[i].value)
                } else {
                    addModifiers[addMods[i].status] = [addMods[i].value];
                }
            }
        }
        let getAddModifiers = function() {
            return addModifiers
        }



        this.call = {
            getAddModifiers:getAddModifiers
        }

    }


    show() {
        this.visualGamePiece.call.showVisualPiece();
    }

    hide() {
        this.visualGamePiece.call.hideVisualPiece();
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

    disposeItem() {
        this.visualGamePiece.removeVisualGamePiece();
    }

}

export {Item}