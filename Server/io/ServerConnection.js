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
let server = null;
let edit_index = null;
let indexFile = "edits/edit_index.json"
function updateEditWriteIndex(id, file) {
	console.log("updateEditWriteIndex", id, file)
	edit_index[id] = file;
	let writeCB = function(res) {
		if (res !== null) {
			console.log("index error:", res);
		} else {
			console.log("index updated:", id);
		}
	}
	server.writeFile(indexFile, JSON.stringify(edit_index), writeCB)
}

function loadEditIndex() {
	let indexCb = function(error, data) {
		if (error) {

		} else {
			edit_index = JSON.parse(data);
			console.log("Edit Index Loaded");
			console.log(edit_index);
		}
	}

	server.readFile(indexFile, indexCb)
}

class ServerConnection {
	constructor() {

	}

	shutdownSocket = function() {
		this.wss.close();
	};

	writeDataToFile(id, file, data) {
		let writeCB = function(res) {
			if (res !== null) {
				console.log("writeFile error:", res);
			} else {
				updateEditWriteIndex(id, file);
			}
		}
		server.writeFile(file, data, writeCB)
	}

	setupSocket = function(wss, srvr) {
		this.wss = wss;
		server = srvr;
		loadEditIndex();
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