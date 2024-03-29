import {ConnectedClient} from "../game/player/ConnectedClient.js";
import {GameServer} from "../game/GameServer.js";
import {applyMessageToClient, setGameServer} from "../game/utils/GameServerFunctions.js";
import {trackIncomingBytes, trackOutgoingBytes} from "../game/utils/ServerStatusTracker.js";
import {ENUMS} from "../../client/js/application/ENUMS.js";
import {addIndexEntry, setEditIndex} from "../game/utils/EditorFunctions.js";

let sockets = [];
let connectedPlayers = [];
let gameServer = new GameServer(connectedPlayers)
gameServer.initServerLoop(100);
setGameServer(gameServer)

let sends = 0;
let server = null;
let edit_index = null;
let indexFile = "edits/edit_index.json"
function updateEditWriteIndex(message, deleted) {
	addIndexEntry(message.dir, message.root, message.folder, message.id, message.format, deleted);
	let writeCB = function(res) {
		if (res !== null) {
			console.log("index error:", res);
		} else {
			console.log("index updated:", message.id);
		}
	}
	server.writeFile(indexFile, JSON.stringify(edit_index), writeCB)
}

function loadEditIndex(cb) {
	let indexCb = function(error, data) {
		if (error) {
		} else {
			edit_index = JSON.parse(data);
			console.log("Edit Index Loaded");
		//	console.log(edit_index);
			cb(edit_index);
		}
	}
	server.readFile(indexFile, indexCb)
}

function fileFromMessage(message) {
	return message.dir+message.root+"/"+message.folder+"/"+message.id+"."+message.format;
}

class ServerConnection {
	constructor() {

	}

	shutdownSocket = function() {
		this.wss.close();
	};



	writeDataToFile(message) {
		let data = message.data;
		if (message.format === 'buffer') {

		}

		let deleted = false;
		if (data['DELETED'] === true) {
			deleted = true;
		}
		let file = fileFromMessage(message)
		addIndexEntry(message.dir, message.root, message.folder, message.id, message.format, deleted);

		let writeCB = function(res) {
			if (res !== null) {
				console.log("writeFile error:", res);
			} else {
				if (deleted === false) {
					updateEditWriteIndex(message, deleted);
				}
			}
		}
		console.log("writeDataToFile", message.id, file);
		server.writeFile(file, data, writeCB)
	}

	readDataFromFile(message, callback) {
		let file = fileFromMessage(message)
		let dataCb = function(error, data) {
			if (error) {
				console.log("Data Read Error: ", message.id, file, error);
			} else {
				let value = JSON.parse(data);
				console.log("File Loaded", message.id, file);
			//	console.log(value);
				callback(value)
			}
		}
		console.log("readDataFromFile", message.id, file);
		server.readFile(file, dataCb)
	}

	setupSocket = function(wss, srvr) {
		this.wss = wss;
		server = srvr;

		loadEditIndex(setEditIndex);

		wss.on("connection", function(ws) {
			sockets.push(ws);
			let sends = 0;

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
	};

};

export {ServerConnection}