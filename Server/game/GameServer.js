class GameServer {
    constructor() {
        this.stamp = "init";
    }


    setStamp(stamp) {
        console.log("Set GameServer Stamp: ", stamp);
        this.stamp = stamp;
    }




}

export { GameServer }