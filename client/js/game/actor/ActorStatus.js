
let lastBroadcast = {};
let sendStatus = [];
let lastFullSend = 0;


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

function compareArrays(a, b) {

    if (a.length !== b.length) {
        return false
    } else {
        for (let i = 0; i < a.length; i++) {
            if (a[i] === b[i]) {
                if (typeof (a[i].length) === 'number') {
                    return compareArrays(a[i], b[i])
                }
            } else {
                return false
            }
        }
    }
    return true;
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
        this.statusMap[ENUMS.ActorStatus.EQUIPPED_ITEMS] = [];
        this.statusMap[ENUMS.ActorStatus.PATH_POINTS] = [];
        this.statusMap[ENUMS.ActorStatus.ACTIONS] = [];
    }

    getStatusByKey(key) {
        if (typeof (this.statusMap[key]) === 'undefined') {
            this.statusMap[key] = 0;
        }
        return this.statusMap[key]
    }

    setStatusKey(key, status) {
        this.statusMap[key] = status;
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

}

export { ActorStatus }