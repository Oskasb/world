class Item {

    constructor(configId, visualGamePiece, config) {
        this.configId = configId;
        this.config = config;
        this.visualGamePiece = visualGamePiece;
        let addModifiers = {};
        let updateCallback = null;

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

        let setUpdateCallback = function(cb) {
            updateCallback = cb;
        }

        let getUpdateCallback = function() {
            return updateCallback
        }

        this.call = {
            getAddModifiers:getAddModifiers,
            setUpdateCallback:setUpdateCallback,
            getUpdateCallback:getUpdateCallback
        }

    }


    show() {
        ThreeAPI.registerPrerenderCallback(this.call.getUpdateCallback());
        this.visualGamePiece.call.showVisualPiece();
    }

    hide() {
        ThreeAPI.unregisterPrerenderCallback(this.call.getUpdateCallback());
        this.visualGamePiece.call.hideVisualPiece();
    }

    getItemConfigId() {
        return this.configId;
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