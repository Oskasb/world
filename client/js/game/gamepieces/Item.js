import {ItemStatus} from "./ItemStatus.js";
import {applyStatusMessageToMap} from "../../../../Server/game/utils/GameServerFunctions.js";

let index = 0;

class Item {

    constructor(configId, visualGamePiece, config) {

        this.id = 'item_'+index+'_'+client.getStamp();
        index++;

        this.configId = configId;
        this.config = config;
        this.visualGamePiece = visualGamePiece;
        this.status = new ItemStatus(this.id, configId);
        this.visualGamePiece.call.setPiece(this)

        let addModifiers = {};
        let updateCallback = null;

        let addMods = config['status_add_modifiers']
        if (addMods) {
            let modStatus = this.status.call.getStatusByKey(ENUMS.ItemStatus.MODIFIERS)
            for (let i = 0; i < addMods.length; i++) {
                if (addModifiers[addMods[i].status]) {
                    addModifiers[addMods[i].status].push(addMods[i].value)
                } else {
                    addModifiers[addMods[i].status] = [addMods[i].value];
                }
                modStatus[i*2] = addMods[i].status;
                modStatus[i*2 + 1] = addMods[i].value;
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

        let tickSkinnedItem = function(tpf, gameTime) {
            let ownerId = this.getStatus(ENUMS.ItemStatus.ACTOR_ID)
            let actor = GameAPI.getActorById(ownerId)
            if (actor) {
                this.visualGamePiece.call.tickPieceEquippedItem(actor)
            } else {
                console.log("No current owner actor", ownerId, GameAPI.getGamePieceSystem().getActors())
                if (this.getStatus(ENUMS.ItemStatus.ACTIVATION_STATE) === ENUMS.ActivationState.DEACTIVATED) {
                    console.log("Deactivate Item", ownerId)
                    this.hide();
                    this.disposeItem();
                }


            }

        }.bind(this);


        let applyStatusMessage = function(msg) {
            applyStatusMessageToMap(msg, this.status.statusMap);
            let item = this;

            if (msg.indexOf(ENUMS.ItemStatus.PALETTE_VALUES) !== -1) {

                let valueIdx = msg.indexOf(ENUMS.ItemStatus.PALETTE_VALUES)+1
                let paletteValues = msg[valueIdx]
                if (paletteValues.length === 8) {
                    item.getVisualGamePiece().visualModelPalette.setFromValuearray(paletteValues);
                    let instance = item.getVisualGamePiece().call.getInstance()
                    if (instance) {
                        item.getVisualGamePiece().visualModelPalette.applyPaletteToInstance(instance)
                    } else {
                        console.log("item expects instance here")
                    }
                }
            }

        }.bind(this)

        this.call = {
            getAddModifiers:getAddModifiers,
            setUpdateCallback:setUpdateCallback,
            getUpdateCallback:getUpdateCallback,
            tickSkinnedItem:tickSkinnedItem,
            applyStatusMessage:applyStatusMessage
        }

    }


    setStatusKey(key, status) {
        this.status.call.setStatusByKey(key, status);
    };

    getStatus(key) {
        return this.status.call.getStatusByKey(key);
    }


    show() {
        this.setStatusKey(ENUMS.ItemStatus.ACTIVATION_STATE, ENUMS.ActivationState.ACTIVE)
        ThreeAPI.registerPrerenderCallback(this.call.getUpdateCallback());
        this.visualGamePiece.call.showVisualPiece();
    }

    hide() {
        this.setStatusKey(ENUMS.ItemStatus.ACTIVATION_STATE, ENUMS.ActivationState.DEACTIVATING)
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
        this.setStatusKey(ENUMS.ItemStatus.ACTIVATION_STATE, ENUMS.ActivationState.DEACTIVATING)
        ThreeAPI.unregisterPostrenderCallback(this.status.call.pulseStatusUpdate);
        this.visualGamePiece.removeVisualGamePiece();
    }

}

export {Item}