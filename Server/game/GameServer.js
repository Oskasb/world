import {ENUMS} from "../../client/js/application/ENUMS.js";
import {MATH} from "../../client/js/application/MATH.js";
import {ServerEncounter} from "./encounter/ServerEncounter.js";
import {GameServerWorld} from "./GameServerWorld.js";
import {ServerPlayer} from "./player/ServerPlayer.js";

let connectedPlayers = [];
class GameServer {
    constructor(connectedClients) {
        this.connectedClients = connectedClients;
        this.gameServerWorld = new GameServerWorld();
        this.tpf = 1;
        this.serverTime = 0;
        this.onUpdateCallbacks = [];
        this.stamp = "init";
    }

    setStamp(stamp) {
        this.stamp = stamp;
    }

    getConnectedPlayerByStamp(stamp) {
        for (let i = 0; i < connectedPlayers.length; i++) {
            let player = connectedPlayers[i];
            if (player.stamp === stamp) {
                return player;
            }
        }
    }

    registerConnectedPlayer(stamp) {
        let player = this.getConnectedPlayerByStamp(stamp)
        if (!player) {
            player = new ServerPlayer(stamp)
            connectedPlayers.push(player);
            console.log("Player registered: ", connectedPlayers, this.getConnectedPlayerByStamp(stamp))
            return true;
        } else {
            console.log("Player Already registered, skipping add process: ", player)
            return false;
        }
    }

    disconnectConnectedPlayer(player) {
        MATH.splice(connectedPlayers, player);

    }


    initServerLoop(targetTpfMs) {

        let lastTick = performance.now();
        let avgTpf = targetTpfMs;

        let update = function() {
            let now = performance.now();
            let dt = now-lastTick;
            avgTpf = avgTpf*0.95 + dt*0.05;
            this.tickGameServer(Math.round(avgTpf) * 0.001); // ms to s to run time in seconds
            lastTick = now;
        }.bind(this)

        setInterval(update, targetTpfMs);

    }

    tickGameServer(avgTpf) {
        this.tpf = avgTpf;
        this.serverTime += avgTpf;
    //    console.log(this.tpf, this.serverTime);
        MATH.callAll(this.onUpdateCallbacks, this.tpf, this.serverTime);
    }

    messageAllClients(message) {
        for (let i = 0; i < this.connectedClients.length; i++) {
            this.connectedClients[i].call.returnDataMessage(message);
        }
    }

}

export { GameServer }