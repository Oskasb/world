import {Vector3} from "../../../libs/three/math/Vector3.js";
import {Quaternion} from "../../../libs/three/math/Quaternion.js";


let testSkip = function(key) {
    if (spatialMap.indexOf(key) !== -1) {
        return true;
    }
    if (skipMap.indexOf(key) !== -1) {
        return true;
    }
    return false;
}

function fullSend(status, statusMap) {
    for (let key in statusMap) {
        if (key !== ENUMS.ActorStatus.ACTOR_ID)  {

            if (testSkip(key) === false) {
                status.sendStatus.push(key)
                status.sendStatus.push(statusMap[key])

                if (!status.lastBroadcast[key]) {
                    status.lastBroadcast[key] = [0];
                }

                status.lastBroadcast[key][0] = MATH.stupidChecksumArray(statusMap[key])
            }
        }
    }
    status.lastBroadcast[ENUMS.ActorStatus.QUAT_W][0] = status.lastBroadcast[ENUMS.ActorStatus.QUAT_W][0]+0.1;
}

function sendUpdatedOnly(status, statusMap) {

    for (let key in statusMap) {
        if (testSkip(key) === false) {
            if (!status.lastBroadcast[key]) {
                status.lastBroadcast[key] = [0];
            }
            let checksum = MATH.stupidChecksumArray(statusMap[key])
            if (checksum !== status.lastBroadcast[key][0]) {
                status.lastBroadcast[key][0] = checksum;
                status.sendStatus.push(key)
                status.sendStatus.push(statusMap[key])
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
    ENUMS.ActorStatus.ACTIONS,
    ENUMS.ActorStatus.SELECTED_DESTINATION,
    ENUMS.ActorStatus.SELECTED_ACTION,
    ENUMS.ActorStatus.ACTION_STATE_KEY
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

function sendSpatial(status, statusMap) {

    let updated = false;

    for (let i = 0; i < spatialMap.length; i++) {
        let key = spatialMap[i]
        if (!status.lastBroadcast[key]) {
            status.lastBroadcast[key] = [0];
        }
        let checksum = MATH.stupidChecksumArray(statusMap[key])
        if (Math.abs(checksum - status.lastBroadcast[key][0]) > 0.05) {
            updated = true;
            status.lastBroadcast[key][0] = checksum;
        }
    }

    if (updated) {
        for (let i = 0; i < spatialMap.length; i++) {
            let key = spatialMap[i]
            status.sendStatus.push(key)
            status.sendStatus.push(statusMap[key])
        }
    }
}

function sendDetails(status, statusMap) {

    for (let i = 0; i < detailsMap.length; i++) {
        let key = detailsMap[i]
        if (!status.lastBroadcast[key]) {
            status.lastBroadcast[key] = [0];
        }
        let checksum = MATH.stupidChecksumArray(statusMap[key])
        if (checksum !== status.lastBroadcast[key][0]) {
            status.lastBroadcast[key][0] = checksum;
            status.sendStatus.push(key)
            status.sendStatus.push(statusMap[key])
        }
    }
}

class ActorStatus {
    constructor(actor) {

        this.actor = actor;
        this.lastBroadcast = {};
        this.sendStatus = [];
        this.lastFullSend = 0;
        this.lastDeltaSend = 0;
        this.spatialDelay = 0;

        this.tempVec = new Vector3();
        this.tempQuat = new Quaternion();
        this.statusMap = {}
        this.statusMap[ENUMS.ActorStatus.ACTOR_ID] = this.actor.id;
        this.statusMap[ENUMS.ActorStatus.IS_ACTIVE] = 0;
        this.statusMap[ENUMS.ActorStatus.ALIGNMENT] = 'NEUTRAL';
        this.statusMap[ENUMS.ActorStatus.MOVE_STATE] = 'MOVE';
        this.statusMap[ENUMS.ActorStatus.STAND_STATE] = 'IDLE_HANDS';
        this.statusMap[ENUMS.ActorStatus.BODY_STATE] = 'IDLE_LEGS';
        this.statusMap[ENUMS.ActorStatus.SPATIAL_DELTA] = 0.2;
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
        this.statusMap[ENUMS.ActorStatus.PARTY_SELECTED]  = false;
        this.statusMap[ENUMS.ActorStatus.PLAYER_PARTY]  = [];
        this.statusMap[ENUMS.ActorStatus.SELECTED_DESTINATION]  = [0, 0, 0];
        this.statusMap[ENUMS.ActorStatus.SELECTED_ACTION] = "";
        this.statusMap[ENUMS.ActorStatus.ACTION_STATE_KEY] = 0;
        this.statusMap[ENUMS.ActorStatus.ACTION_STEP_PROGRESS]  = 0;

        let updateTO = null;

        let send = function() {
            evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, this.sendStatus)
        }.bind(this);


        let frameQueue = function() {
            clearTimeout(updateTO)
            updateTO = setTimeout(send, 0);
        }.bind(this);

        this.call = {
            frameQueue:frameQueue
        }

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
            if (typeof (this.statusMap[key]) === 'undefined' || this.statusMap[key] === 0  || this.statusMap[key] === null) {
                this.statusMap[key] = status;
            } else {
                console.log("changing type for status is bad", key, status)
            }
        }
    }

    relaySpatial(delay) {

        if (this.actor.checkBroadcast()) {

            if (delay < this.spatialDelay) {
                this.spatialDelay = delay;
            }

            let gameTime = GameAPI.getGameTime();
            if (this.lastDeltaSend < gameTime - this.spatialDelay) {
                this.spatialDelay = delay;
                MATH.emptyArray(this.sendStatus);
                this.sendStatus.push(ENUMS.ActorStatus.ACTOR_ID)
                this.sendStatus.push(this.statusMap[ENUMS.ActorStatus.ACTOR_ID])
                this.lastDeltaSend = gameTime;
                sendSpatial(this, this.statusMap)
                if (this.sendStatus.length > 2) {
                    evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, this.sendStatus)
                }
            }
        }
    }

    broadcastStatus(gameTime) {
        MATH.emptyArray(this.sendStatus);
        this.sendStatus.push(ENUMS.ActorStatus.ACTOR_ID)
        this.sendStatus.push(this.statusMap[ENUMS.ActorStatus.ACTOR_ID])

        if (this.lastFullSend < gameTime -2) {
            this.lastFullSend = gameTime;
            sendSpatial(this, this.statusMap)
            fullSend(this, this.statusMap)
        } else {
            sendDetails(this, this.statusMap);
            sendUpdatedOnly(this, this.statusMap)
        }

        if (this.sendStatus.length > 2) {
        //    console.log(sendStatus)
            evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, this.sendStatus)
        }

    }

    setStatusVelocity(velVec) {
        if (MATH.testVec3ForNaN(velVec)) {
            return;
        }

        let diff = this.getStatusVelocity().sub(velVec).lengthSq();

            this.setStatusKey(ENUMS.ActorStatus.VEL_X, velVec.x)
            this.setStatusKey(ENUMS.ActorStatus.VEL_Y, velVec.y)
            this.setStatusKey(ENUMS.ActorStatus.VEL_Z, velVec.z)
        if (diff > 0.1) {
            this.relaySpatial(0.02)
        } else {
            this.relaySpatial(0.1)
        }



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
        if (MATH.testVec3ForNaN(posVec)) {
            return;
        }

        let diff = this.getStatusPosition().sub(posVec).lengthSq();

            this.setStatusKey(ENUMS.ActorStatus.POS_X, posVec.x)
            this.setStatusKey(ENUMS.ActorStatus.POS_Y, posVec.y)
            this.setStatusKey(ENUMS.ActorStatus.POS_Z, posVec.z)
        if (diff > 0.1) {
            this.relaySpatial(this.getStatusByKey(ENUMS.ActorStatus.SPATIAL_DELTA))
        }

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
        if (MATH.testVec3ForNaN(scaleVec)) {
            return;
        }

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
        if (MATH.testVec3ForNaN(quat)) {
            return;
        }

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