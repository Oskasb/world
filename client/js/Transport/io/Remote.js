import {Vector3} from "../../../libs/three/math/Vector3.js";
import {Quaternion} from "../../../libs/three/math/Quaternion.js";

let index = [];
let remotes = [];

let spatialMap = {}
    spatialMap[ENUMS.ActorStatus.POS_X] = {key:'pos', val:'x'}
    spatialMap[ENUMS.ActorStatus.POS_Y] = {key:'pos', val:'y'}
    spatialMap[ENUMS.ActorStatus.POS_Z] = {key:'pos', val:'z'}
    spatialMap[ENUMS.ActorStatus.VEL_X] = {key:'vel', val:'x'}
    spatialMap[ENUMS.ActorStatus.VEL_Y] = {key:'vel', val:'y'}
    spatialMap[ENUMS.ActorStatus.VEL_Z] = {key:'vel', val:'z'}
    spatialMap[ENUMS.ActorStatus.SCALE_X] = {key:'scale', val:'x'}
    spatialMap[ENUMS.ActorStatus.SCALE_Y] = {key:'scale', val:'y'}
    spatialMap[ENUMS.ActorStatus.SCALE_Z] = {key:'scale', val:'z'}
    spatialMap[ENUMS.ActorStatus.QUAT_X] = {key:'quat', val:'x'}
    spatialMap[ENUMS.ActorStatus.QUAT_Y] = {key:'quat', val:'y'}
    spatialMap[ENUMS.ActorStatus.QUAT_Z] = {key:'quat', val:'z'}
    spatialMap[ENUMS.ActorStatus.QUAT_W] = {key:'quat', val:'w'}




class Remote {
    constructor(stamp, remoteId) {
        if (remotes.indexOf(remoteId)) {
            console.log("--- REMOTE ALREADY ADDED --- FIX!")
        }
        remotes.push(remoteId)
        this.stamp = stamp;

        this.lastUpdate = {
            pos:new Vector3(),
            scale:new Vector3(),
            vel:new Vector3(),
            quat:new Quaternion()
        }

        this.remoteId =remoteId;
        this.pos=new Vector3();
        this.scale=new Vector3();
        this.vel=new Vector3();
        this.quat=new Quaternion();
        this.remoteActionKey='';
        let action= null;
        this.updateTime=-5;
        this.timeDelta=2


        let setAction = function(a) {
            action = a;
        };

        let getAction = function() {
            return action;
        };

        let getActionById = null;

        let setGetActionFunction = function(call) {
            getActionById = call;
        }

        this.call = {
            setAction:setAction,
            getAction:getAction,
            setGetActionFunction:setGetActionFunction,
            getActionById:getActionById
        }

    }

    copyLastFrame() {
        this.lastUpdate.pos.copy(this.pos);
        this.lastUpdate.vel.copy(this.vel);
        this.lastUpdate.scale.copy(this.scale);
        this.lastUpdate.quat.copy(this.quat);
    }

    updateSpatial(key, value) {
        let vector = this[spatialMap[key].key]
        vector[spatialMap[key].val] = value;
    }

}

export { Remote }