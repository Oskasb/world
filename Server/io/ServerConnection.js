import {ConnectedPlayer} from "../game/player/ConnectedPlayer.js";
let sockets = [];

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

			ws.connectedPlayer = new ConnectedPlayer(ws.send)
			console.log("websocket connection open");

			ws.on("message", function message(data, isBinary) {
				const message = isBinary ? data : data.toString();
				console.log(message + "\n\n");
				ws.connectedPlayer.handleMessage(message, "NODE WS")
			});

			ws.on("close", function() {
				console.log("connection closed "+sockets.indexOf(ws));
				sockets.splice(sockets.indexOf(ws), 1)
			})

		});

		console.log("Init Server ClientConnection")

	};

};

export {ServerConnection}