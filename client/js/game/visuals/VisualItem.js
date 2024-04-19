import {Object3D} from "../../../libs/three/core/Object3D.js";

class VisualItem {
    constructor() {
        this.obj3d = new Object3D();
        this.item = null;
        let onUpdateCB = null;
        let instance = null;

        function setUpdateCB(cb) {
            onUpdateCB = cb;
        }

        function getInstance() {
            return instance;
        }

         let setInstance = function(i) {
            this.item.setStatusKey(ENUMS.ItemStatus.ACTIVATION_STATE, ENUMS.ActivationState.ACTIVE)
            instance = i;
             ThreeAPI.registerPrerenderCallback(update);
        }.bind(this)

        let update = function() {
            // update paletteStatus;
            /*
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


 */

            onUpdateCB();
            this.item.paletteUpdated = false;

        }.bind(this)


        this.call = {
            setUpdateCB:setUpdateCB,
            setInstance:setInstance,
            getInstance:getInstance
        }

    }
    setItem(item) {
        this.item = item;
        item.visualItem = this;

        console.log("Set Visual Item ", item);

    }

    setUpdateCallback(updateCB) {
        this.call.setUpdateCB(updateCB);
    }

    getSlotId() {
        this.item.getEquipSlotId()
    }

    getPos() {
        return this.obj3d.position;
    }

    getQuat() {
        return this.obj3d.quaternion;
    }

    getSpatial() {
        return this.call.getInstance().getSpatial()
    }

    deactivateVisualItem() {
        this.item.setStatusKey(ENUMS.ItemStatus.ACTIVATION_STATE, ENUMS.ActivationState.DEACTIVATING)
        this.item = null;
    }



}

export {VisualItem}