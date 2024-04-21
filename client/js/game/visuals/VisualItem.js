import {Object3D} from "../../../libs/three/core/Object3D.js";
import {configDataList} from "../../application/utils/ConfigUtils.js";
import {setupVisualModel} from "../../application/utils/ModelUtils.js";


let visualConfigs = {};

let onData = function(data) {
    visualConfigs = data;
    console.log("visualConfigs", visualConfigs)
}

setTimeout(function() {
    configDataList("GAME","VISUALS", onData)
}, 1000);

class VisualItem {
    constructor() {
        this.obj3d = new Object3D();
        this.item = null;
        let onUpdateCB = null;
        let instance = null;

        let dactivationRequested = false;


        function setUpdateCB(cb) {
            onUpdateCB = cb;
            ThreeAPI.unregisterPrerenderCallback(update);
            ThreeAPI.registerPrerenderCallback(update);
        }

        function getInstance() {
            return instance;
        }

         let setInstance = function(i) {

             if (this.item === null) {
                 console.log("Bad setInstance item already removed..")
                 return;
             }

            this.item.setStatusKey(ENUMS.ItemStatus.ACTIVATION_STATE, ENUMS.ActivationState.ACTIVE)
            instance = i;
        //     ThreeAPI.showModel(instance.getSpatial().obj3d)
         //    instance.getSpatial().obj3d.frustumCulled = false;

             if (instance.getSpatial().call.isInstanced()) {
                 instance.getSpatial().call.hideSpatial(false)
             //    applyVisualPiecePalette()
             } else {
                 ThreeAPI.showModel(instance.getSpatial().obj3d)
                 instance.getSpatial().obj3d.frustumCulled = false;
             }

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


            if (dactivationRequested === true) {
                console.log("Update VItem dactivationRequested", dactivationRequested)
                closeVisualItem();
                dactivationRequested = false;
                return;
            }

            onUpdateCB();
            this.item.paletteUpdated = false;

        }.bind(this)

        let closeVisualItem = function() {
            instance.decommissionInstancedModel();
            ThreeAPI.unregisterPrerenderCallback(update);
            this.item.setStatusKey(ENUMS.ItemStatus.ACTIVATION_STATE, ENUMS.ActivationState.DEACTIVATING)
            this.item = null;
        }.bind(this);


        function requestDeactivation() {
            console.log("requestDeactivation VItem")
            dactivationRequested = true;
        }

        this.call = {
            setUpdateCB:setUpdateCB,
            setInstance:setInstance,
            closeVisualItem:closeVisualItem,
            getInstance:getInstance,
            requestDeactivation:requestDeactivation
        }

    }
    setItem(item, onReady) {
        if (item === null) {
            console.log("Bad setItem ")
            return;
        }
        this.item = item;
        item.visualItem = this;
        let visualId = item.config['visual_id'];
        let vConf = visualConfigs[visualId];

        setupVisualModel(this, vConf, onReady)
    //    console.log("Set Visual Item ", vConf, item);
    }

    setUpdateCallback(updateCB) {
        this.call.setUpdateCB(updateCB);
    }

    getSlotId() {
        return this.item.getEquipSlotId()
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

}

export {VisualItem}