import {Vector3} from "../../../libs/three/math/Vector3.js";
import {Quaternion} from "../../../libs/three/math/Quaternion.js";

let lastBroadcast = {};
let sendStatus = [];
let lastFullSend = 0;
let lastDeltaSend = 0;


let testSkip = function(key) {
    if (spatialMap.indexOf(key) !== -1) {
        return true;
    }
    if (skipMap.indexOf(key) !== -1) {
        return true;
    }
    return false;
}

function fullSend(statusMap) {
    for (let key in statusMap) {
        if (key !== ENUMS.ActorStatus.ACTOR_INDEX)  {

            if (testSkip(key) === false) {
                sendStatus.push(key)
                sendStatus.push(statusMap[key])

                if (!lastBroadcast[key]) {
                    lastBroadcast[key] = [0];
                }

                lastBroadcast[key][0] = MATH.stupidChecksumArray(statusMap[key])
            }
        }
    }
    lastBroadcast[ENUMS.ActorStatus.QUAT_W][0] = lastBroadcast[ENUMS.ActorStatus.QUAT_W][0]+0.1;
}

function sendUpdatedOnly(statusMap) {

    for (let key in statusMap) {
        if (testSkip(key) === false) {
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
}

let detailsMap = [
    ENUMS.ActorStatus.PATH_POINTS,
    ENUMS.ActorStatus.SELECTED_TARGET,
    ENUMS.ActorStatus.ALIGNMENT,
    ENUMS.ActorStatus.MOVE_STATE,
    ENUMS.ActorStatus.BODY_STATE,
    ENUMS.ActorStatus.ACTIONS
];

let spatialMap = [
    ENUMS.ActorStatus.POS_X,
    ENUMS.ActorStatus.POS_Y,
    ENUMS.ActorStatus.POS_Z,
    ENUMS.ActorStatus.VEL_X,
    ENUMS.ActorStatus.VEL_Y,
    ENUMS.ActorStatus.VEL_Z,
    ENUMS.ActorStatus.QUAT_X,
    ENUMS.ActorStatus.QUAT_Y,
    ENUMS.ActorStatus.QUAT_Z,
    ENUMS.ActorStatus.QUAT_W
]

let skipMap = [
    ENUMS.ActorStatus.PARTY_SELECTED,
    ENUMS.ActorStatus.STATUS_PITCH,
    ENUMS.ActorStatus.STATUS_ROLL,
    ENUMS.ActorStatus.STATUS_YAW,
    ENUMS.ActorStatus.STATUS_ANGLE_PITCH,
    ENUMS.ActorStatus.STATUS_ANGLE_ROLL,
    ENUMS.ActorStatus.STATUS_ANGLE_YAW,
    ENUMS.ActorStatus.STATUS_ANGLE_NORTH,
    ENUMS.ActorStatus.STATUS_ANGLE_EAST,
    ENUMS.ActorStatus.STATUS_ANGLE_SOUTH,
    ENUMS.ActorStatus.STATUS_ANGLE_WEST,
    ENUMS.ActorStatus.STATUS_CLIMB_RATE,
    ENUMS.ActorStatus.STATUS_ELEVATION,
    ENUMS.ActorStatus.STATUS_CLIMB_0,
    ENUMS.ActorStatus.STATUS_CLIMB_1,
    ENUMS.ActorStatus.STATUS_CLIMB_2,
    ENUMS.ActorStatus.STATUS_CLIMB_3,
    ENUMS.ActorStatus.STATUS_CLIMB_4,
    ENUMS.ActorStatus.STATUS_FORWARD,
    ENUMS.ActorStatus.STATUS_SPEED,
    ENUMS.ActorStatus.ACTOR_SPEED,
    ENUMS.ActorStatus.ACTOR_YAW_RATE,
    ENUMS.ActorStatus.SELECTING_DESTINATION,
    ENUMS.ActorStatus.STATUS_INPUT_SAMPLERS,
    ENUMS.ActorStatus.STATUS_WALK_SELECTION,
    ENUMS.ActorStatus.STATUS_LEAP_SELECTION,
    ENUMS.ActorStatus.POS_X,
    ENUMS.ActorStatus.POS_Y,
    ENUMS.ActorStatus.POS_Z,
    ENUMS.ActorStatus.VEL_X,
    ENUMS.ActorStatus.VEL_Y,
    ENUMS.ActorStatus.VEL_Z,
    ENUMS.ActorStatus.QUAT_X,
    ENUMS.ActorStatus.QUAT_Y,
    ENUMS.ActorStatus.QUAT_Z,
    ENUMS.ActorStatus.QUAT_W
]

function sendSpatial(statusMap) {

    let updated = false;

    for (let i = 0; i < spatialMap.length; i++) {
        let key = spatialMap[i]
        if (!lastBroadcast[key]) {
            lastBroadcast[key] = [0];
        }
        let checksum = MATH.stupidChecksumArray(statusMap[key])
        if (Math.abs(checksum - lastBroadcast[key][0]) > 0.05) {
            updated = true;
            lastBroadcast[key][0] = checksum;
        }
    }

    if (updated) {
        for (let i = 0; i < spatialMap.length; i++) {
            let key = spatialMap[i]
                sendStatus.push(key)
                sendStatus.push(statusMap[key])
        }
    }
}

function sendDetails(statusMap) {

    for (let i = 0; i < detailsMap.length; i++) {
        let key = detailsMap[i]
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
    constructor(actorId) {
        this.tempVec = new Vector3();
        this.tempQuat = new Quaternion();
        this.statusMap = {}
        this.statusMap[ENUMS.ActorStatus.ACTOR_ID] = actorId;
        this.statusMap[ENUMS.ActorStatus.IS_ACTIVE] = 0;
        this.statusMap[ENUMS.ActorStatus.ALIGNMENT] = 'NEUTRAL';
        this.statusMap[ENUMS.ActorStatus.MOVE_STATE] = 'MOVE';
        this.statusMap[ENUMS.ActorStatus.STAND_STATE] = 'IDLE_HANDS';
        this.statusMap[ENUMS.ActorStatus.BODY_STATE] = 'IDLE_LEGS';
        this.statusMap[ENUMS.ActorStatus.SPATIAL_DELTA] = 0.1;
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
        this.statusMap[ENUMS.ActorStatus.SELECTED_TARGET] = "";
        this.statusMap[ENUMS.ActorStatus.REQUEST_PARTY] = "";
        this.statusMap[ENUMS.ActorStatus.ACTIVATING_ENCOUNTER] = "";
        this.statusMap[ENUMS.ActorStatus.ACTIVATED_ENCOUNTER]  = "";
        this.statusMap[ENUMS.ActorStatus.PLAYER_PARTY]  = [];
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

        if (lastDeltaSend < gameTime - this.getStatusByKey(ENUMS.ActorStatus.SPATIAL_DELTA)) {
            lastDeltaSend = gameTime;
            sendSpatial(statusMap)
        }

        if (lastFullSend < gameTime -2) {
            lastFullSend = gameTime;
            fullSend(statusMap)
        } else {
            sendDetails(statusMap);

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
            store = this.tempVec;
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
            store = this.tempVec;
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
            store = this.tempVec;
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
            store = this.tempQuat;
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