import {Vector3} from "../../../libs/three/math/Vector3.js";
import {Quaternion} from "../../../libs/three/math/Quaternion.js";

let lastBroadcast = {};
let sendStatus = [];
let lastFullSend = 0;
let tempVec = new Vector3();
let tempQuat = new Quaternion();

function fullSend(statusMap) {
    for (let key in statusMap) {
        if (key !== ENUMS.ActorStatus.ACTOR_INDEX)  {
            sendStatus.push(key)
            sendStatus.push(statusMap[key])

            if (!lastBroadcast[key]) {
                lastBroadcast[key] = [0];
            }

            lastBroadcast[key][0] = MATH.stupidChecksumArray(statusMap[key])
        }
    }
}

function sendUpdatedOnly(statusMap) {

    for (let key in statusMap) {
        if (!lastBroadcast[key]) {
            lastBroadcast[key] = [0];
        }
            let checksum = MATH.stupidChecksumArray(statusMap[key])
            if (checksum !== lastBroadcast[key][0]) {
                lastBroadcast[key][0] = checksum;
                sendStatus.push(key)
                sendStatus.push(statusMap[key])
            }
    }
}

class ActorStatus {
    constructor() {
        this.statusMap = {}
        this.statusMap[ENUMS.ActorStatus.MOVE_STATE] = 'MOVE';
        this.statusMap[ENUMS.ActorStatus.STAND_STATE] = 'IDLE_HANDS';
        this.statusMap[ENUMS.ActorStatus.BODY_STATE] = 'IDLE_LEGS';
        this.statusMap[ENUMS.ActorStatus.EQUIPPED_ITEMS] = [];
        this.statusMap[ENUMS.ActorStatus.PATH_POINTS] = [];
        this.statusMap[ENUMS.ActorStatus.ACTIONS] = [];
        this.statusMap[ENUMS.ActorStatus.VEL_X] = 0;
        this.statusMap[ENUMS.ActorStatus.VEL_y] = 0;
        this.statusMap[ENUMS.ActorStatus.VEL_Z] = 0;
        this.statusMap[ENUMS.ActorStatus.POS_X] = 0;
        this.statusMap[ENUMS.ActorStatus.POS_y] = 0;
        this.statusMap[ENUMS.ActorStatus.POS_Z] = 0;
        this.statusMap[ENUMS.ActorStatus.SCALE_X] = 1;
        this.statusMap[ENUMS.ActorStatus.SCALE_y] = 1;
        this.statusMap[ENUMS.ActorStatus.SCALE_Z] = 1;
        this.statusMap[ENUMS.ActorStatus.QUAT_X] = 0;
        this.statusMap[ENUMS.ActorStatus.QUAT_y] = 0;
        this.statusMap[ENUMS.ActorStatus.QUAT_Z] = 0;
        this.statusMap[ENUMS.ActorStatus.QUAT_W] = 1;
        this.statusMap[ENUMS.ActorStatus.SELECTED_TARGET] = 0;
    }

    getStatusByKey(key) {
        if (typeof (this.statusMap[key]) === 'undefined') {
            this.statusMap[key] = 0;
        }
        return this.statusMap[key]
    }

    setStatusKey(key, status) {
        if (typeof (this.statusMap[key]) === typeof (status)) {
            this.statusMap[key] = status;
        } else {
            if (typeof (this.statusMap[key]) === 'undefined' || this.statusMap[key] === 0) {
                this.statusMap[key] = status;
            } else {
                console.log("changing type for status is bad", key, status)
            }
        }

    }

    broadcastStatus(gameTime) {

        let statusMap = this.statusMap;
        MATH.emptyArray(sendStatus);
        sendStatus.push(ENUMS.ActorStatus.ACTOR_INDEX)
        sendStatus.push(statusMap[ENUMS.ActorStatus.ACTOR_INDEX])

        if (lastFullSend < gameTime -2) {
            lastFullSend = gameTime;
            fullSend(statusMap)
        } else {
          sendUpdatedOnly(statusMap)
        }

        if (sendStatus.length > 2) {
        //    console.log(sendStatus)
            evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, sendStatus)
        }

    }

    setStatusVelocity(velVec) {
        MATH.testVec3ForNaN(velVec)
        this.setStatusKey(ENUMS.ActorStatus.VEL_X, velVec.x)
        this.setStatusKey(ENUMS.ActorStatus.VEL_Y, velVec.y)
        this.setStatusKey(ENUMS.ActorStatus.VEL_Z, velVec.z)
    }

    getStatusVelocity(store) {
        if (!store) {
            store = tempVec;
        }
        store.set(
            this.getStatusByKey(ENUMS.ActorStatus.VEL_X),
            this.getStatusByKey(ENUMS.ActorStatus.VEL_Y),
            this.getStatusByKey(ENUMS.ActorStatus.VEL_Z)
        )
        MATH.testVec3ForNaN(store)
        return store;
    }

    setStatusPosition(posVec) {
        MATH.testVec3ForNaN(posVec)
        this.setStatusKey(ENUMS.ActorStatus.POS_X, posVec.x)
        this.setStatusKey(ENUMS.ActorStatus.POS_Y, posVec.y)
        this.setStatusKey(ENUMS.ActorStatus.POS_Z, posVec.z)
    }

    getStatusPosition(store) {
        if (!store) {
            store = tempVec;
        }
        store.set(
            this.getStatusByKey(ENUMS.ActorStatus.POS_X),
            this.getStatusByKey(ENUMS.ActorStatus.POS_Y),
            this.getStatusByKey(ENUMS.ActorStatus.POS_Z)
        )
        MATH.testVec3ForNaN(store)
        return store;
    }

    setStatusScale(scaleVec) {
        MATH.testVec3ForNaN(scaleVec)
        this.setStatusKey(ENUMS.ActorStatus.SCALE_X, scaleVec.x)
        this.setStatusKey(ENUMS.ActorStatus.SCALE_Y, scaleVec.y)
        this.setStatusKey(ENUMS.ActorStatus.SCALE_Z, scaleVec.z)
    }

    getStatusScale(store) {
        if (!store) {
            store = tempVec;
        }
        store.set(
            this.getStatusByKey(ENUMS.ActorStatus.SCALE_X),
            this.getStatusByKey(ENUMS.ActorStatus.SCALE_Y),
            this.getStatusByKey(ENUMS.ActorStatus.SCALE_Z)
        )
        MATH.testVec3ForNaN(store)
        return store;
    }

    setStatusQuaternion(quat) {
        MATH.testVec3ForNaN(quat)
        this.setStatusKey(ENUMS.ActorStatus.QUAT_X, quat.x)
        this.setStatusKey(ENUMS.ActorStatus.QUAT_Y, quat.y)
        this.setStatusKey(ENUMS.ActorStatus.QUAT_Z, quat.z)
        this.setStatusKey(ENUMS.ActorStatus.QUAT_W, quat.w)
    }

    getStatusQuaternion(store) {
        if (!store) {
            store = tempQuat;
        }
        store.x = this.getStatusByKey(ENUMS.ActorStatus.QUAT_X)
        store.y = this.getStatusByKey(ENUMS.ActorStatus.QUAT_Y)
        store.z = this.getStatusByKey(ENUMS.ActorStatus.QUAT_Z)
        store.w = this.getStatusByKey(ENUMS.ActorStatus.QUAT_W)
        MATH.testVec3ForNaN(store)
        return store;
    }

}

export { ActorStatus }