import {ENUMS} from "../../application/ENUMS.js";

class SimpleSend {
    constructor() {
        let request = {
            request:null,
            status:null
        }
        let lastBroadcast = {};
        let sendStatus = [];
        let lastFullSend = 0;

        let skipKey = null;

        function fullSend(statusMap) {
            for (let key in statusMap) {
                if (key !== skipKey)  {

                    if (key === 'undefined') {
                    //    console.log("SIMPLE SEND FULL: ",key, sendStatus)
                    } else {

                        sendStatus.push(key)
                        sendStatus.push(statusMap[key])

/*
                        if (key === ENUMS.ItemStatus.EQUIPPED_SLOT) {
                            console.log("Send EQ SLot: ", statusMap[key],  statusMap[ENUMS.ItemStatus.TEMPLATE])
                        }
*/
                        if (!lastBroadcast[key]) {
                            lastBroadcast[key] = [0];
                        }

                        lastBroadcast[key][0] = MATH.stupidChecksumArray(statusMap[key])
                    }


                }
            }
        }

        function sendUpdatedOnly(statusMap) {

            for (let key in statusMap) {
                if (key !== skipKey) {
                    if (!lastBroadcast[key]) {
                        lastBroadcast[key] = [0];
                    }
                    let checksum = MATH.stupidChecksumArray(statusMap[key])
                    if (checksum !== lastBroadcast[key][0]) {
                        lastBroadcast[key][0] = checksum;
                        if (key === 'undefined') {
                        //    console.log("SIMPLE SEND: ",key, sendStatus)
                        } else {
                            sendStatus.push(key)
                            sendStatus.push(statusMap[key])
                        }

                    }
                }


            }
        }

        function broadcastStatus(statusMessageKey, statusMap, clientRequest, forceFullSend) {
            request.request = clientRequest;
            request.status = sendStatus;
            let gameTime = GameAPI.getGameTime();
            MATH.emptyArray(sendStatus);
            sendStatus.push(statusMessageKey)
            sendStatus.push(statusMap[statusMessageKey])
            skipKey = statusMessageKey;

                if (lastFullSend < gameTime -0.5) {
                    lastFullSend = gameTime;
                    fullSend(statusMap)
                } else {
                    sendUpdatedOnly(statusMap)
                }

                if (sendStatus.length > 2) {
            //        console.log("SIMPLE SEND: ", request)

                    if (forceFullSend) {
                        lastFullSend = gameTime;
                        fullSend(statusMap)
                    }

                    evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, request)
                }

        }

        this.call = {
            broadcastStatus:broadcastStatus
        }

    }

}

export { SimpleSend }