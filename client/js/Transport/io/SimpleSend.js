class SimpleSend {
    constructor() {

        let lastBroadcast = {};
        let sendStatus = [];
        let lastFullSend = 0;

        let skipKey = null;

        function fullSend(statusMap) {
            for (let key in statusMap) {
                if (key !== skipKey)  {

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
                if (key !== skipKey) {
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

        function broadcastStatus(statusMessageKey, statusMap) {
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
                    console.log("SIMPLE SEND: ",statusMessageKey, sendStatus)
                    evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, sendStatus)
                }

        }

        this.call = {
            broadcastStatus:broadcastStatus
        }

    }

}

export { SimpleSend }