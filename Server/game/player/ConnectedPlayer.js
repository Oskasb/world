class ConnectedPlayer {
    constructor(sendFunction) {

        this.send = sendFunction

    }

    setStamp(stamp) {
        this.stamp = stamp;
    }

    handleMessage(message, source) {
        console.log("handleMessage", source, message)
        let data = JSON.parse(message);
        console.log("JSON data: ", data);
        this.returnDataMessage(data);
    }

    returnDataMessage(message) {
        this.send(JSON.stringify(message))
    }

}

export {ConnectedPlayer}