
let lastBroadcast = {};
let sendStatus = [];
let lastFullSend = 0;

function fullSend(statusMap) {
    for (let key in statusMap) {
        if (key !== ENUMS.ActorStatus.ENCOUNTER_ID)  {

        //    if (testSkip(key) === false) {
                sendStatus.push(key)
                sendStatus.push(statusMap[key])

                if (!lastBroadcast[key]) {
                    lastBroadcast[key] = [0];
                }

                lastBroadcast[key][0] = MATH.stupidChecksumArray(statusMap[key])
        //    }
        }
    }
 }

function sendUpdatedOnly(statusMap) {

    for (let key in statusMap) {
     //   if (testSkip(key) === false) {
            if (!lastBroadcast[key]) {
                lastBroadcast[key] = [0];
            }
            let checksum = MATH.stupidChecksumArray(statusMap[key])
            if (checksum !== lastBroadcast[key][0]) {
                lastBroadcast[key][0] = checksum;
                sendStatus.push(key)
                sendStatus.push(statusMap[key])
            }
      //  }
    }
}

class EncounterStatus {
    constructor(id, worldEncId) {
        this.statusMap = {}
        this.statusMap[ENUMS.EncounterStatus.ENCOUNTER_ID] = id;
        this.statusMap[ENUMS.EncounterStatus.GRID_ID] = "";
        this.statusMap[ENUMS.EncounterStatus.GRID_POS] = [0, 0, 0];
        this.statusMap[ENUMS.EncounterStatus.WORLD_ENCOUNTER_ID] = worldEncId;
        this.statusMap[ENUMS.EncounterStatus.ENCOUNTER_ACTORS] = [];
        this.statusMap[ENUMS.EncounterStatus.HAS_TURN_ACTOR] = "";
        this.statusMap[ENUMS.EncounterStatus.TURN_INDEX] = 0;
        this.statusMap[ENUMS.EncounterStatus.ACTIVATION_STATE] = ENUMS.ActivationState.INIT;


        let getStatus = function(key) {
            return this.getStatusByKey(key);
        }.bind(this)

        let setStatus = function(key, status) {
            return this.setStatusKey(key, status);
        }.bind(this)

        this.call = {
            getStatus:getStatus,
            setStatus:setStatus
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
            if (typeof (this.statusMap[key]) === 'undefined' || this.statusMap[key] === 0) {
                this.statusMap[key] = status;
            } else {
                console.log("changing type for status is bad", key, status)
            }
        }
    }

    broadcastStatus(gameTime) {

        let statusMap = this.statusMap;
        let encClientStamp = this.getStatusByKey(ENUMS.EncounterStatus.CLIENT_STAMP)
        let playerClientStamp = client.getStamp();

        if (encClientStamp === playerClientStamp) {
            MATH.emptyArray(sendStatus);
            sendStatus.push(ENUMS.EncounterStatus.ENCOUNTER_ID)
            sendStatus.push(statusMap[ENUMS.EncounterStatus.ENCOUNTER_ID])

            if (lastFullSend < gameTime -0.1) {
                lastFullSend = gameTime;
                fullSend(statusMap)
            } else {
                sendUpdatedOnly(statusMap)
            }

            if (sendStatus.length > 2) {
                console.log("DYN ENC SEND: ", sendStatus)
                evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, sendStatus)
            }
        } else {
            console.log("No send others enc's", encClientStamp, playerClientStamp)
        }
    }
}

export { EncounterStatus }