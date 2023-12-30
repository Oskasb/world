import {ConnectedClient} from "../game/player/ConnectedClient.js";
import {GameServer} from "../game/GameServer.js";
import {setGameServer} from "../game/utils/GameServerFunctions.js";
import {trackIncomingBytes, trackOutgoingBytes} from "../game/utils/ServerStatusTracker.js";

let sockets = [];
let connectedPlayers = [];
let gameServer = new GameServer(connectedPlayers)
gameServer.initServerLoop(100);
setGameServer(gameServer)

let sends = 0;

class ServerConnection {
	constructor() {

	}

	shutdownSocket = function() {
		this.wss.close();
	};

	setupSocket = function(wss) {
		this.wss = wss;

		wss.on("connection", function(ws) {

			sockets.push(ws);

			var sends = 0;

			let returnFromPlayer = function(message) {
				sends++
			//	console.log("Pass to socket ", sends, message)
				let bytes = message.length
				trackOutgoingBytes(bytes)
				ws.send(message)
			}


			ws.connectedClient = new ConnectedClient(returnFromPlayer, false)
			ws.connectedClient.activateConnectedClient();
			connectedPlayers.push(ws.connectedClient);
			console.log("websocket connection open");

			ws.on("message", function message(data, isBinary) {
				const message = isBinary ? data : data.toString();
				let bytes = message.length;
				trackIncomingBytes(bytes);
			//	console.log(message + "\n\n");
				ws.connectedClient.handleMessage(message, "NODE WS")
			});

			ws.on("close", function() {
				console.log("connection closed "+sockets.indexOf(ws));

				sockets.splice(sockets.indexOf(ws), 1)
				connectedPlayers.splice(connectedPlayers.indexOf(ws.connectedClient), 1)
				ws.connectedClient.deactivateConnectedClient();
			})

		});

		console.log("Init Server ClientConnection")

	};

};

export {ServerConnection}