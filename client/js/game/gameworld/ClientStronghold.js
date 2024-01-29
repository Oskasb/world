import {Status} from "../../../../Server/game/status/Status.js";
import {LocationModel} from "./LocationModel.js";
import {Object3D} from "../../../libs/three/core/Object3D.js";
import {WorldModel} from "./WorldModel.js";

class ClientStronghold {
    constructor(id) {
        this.id = id;
        this.obj3d = new Object3D();
        this.status = new Status();
        this.locationModel = null;
        this.worldModel = null;

        let status = this.status;

        function getStatus(key) {
            return status.getStatus(key);
        }

        let setupVisualSh = function() {

            let config = {
                model: getStatus(ENUMS.StrongholdStatus.MODEL),
                pos: getStatus(ENUMS.StrongholdStatus.POS),
                rot: getStatus(ENUMS.StrongholdStatus.ROT),
                scale: getStatus(ENUMS.StrongholdStatus.SCALE),
                on_ground: true,
                visibility: 3,
                palette: getStatus(ENUMS.StrongholdStatus.PALETTE)
            }

            let model = new WorldModel(config)

            this.worldModel = model;
        }.bind(this)

        this.call = {
            setupVisualSh:setupVisualSh
        }

    }


    getStatus(key) {
        return this.status.getStatus(key);
    }

    applyServerStatus(statusMap) {
        for (let key in statusMap) {
            this.status.setStatusKey(key, statusMap[key])
        }
        console.log("applyServerStatus", statusMap, this);

    }





    enterStronghold(actor) {

    }

}

export {ClientStronghold}