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

			console.log("websocket connection open");

			ws.on("message", function message(data, isBinary) {
				const message = isBinary ? data : data.toString();
			//	console.log(message + "\n\n");
				for (let i =0; i < sockets.length; i++) {
					sockets[i].send(message);
				}
			});

			ws.on("close", function() {
				console.log("connection closed "+sockets.indexOf(ws));
				sockets.splice(sockets.indexOf(ws), 1)
			})

		});

		console.log("Init Server Connection")

	};

};

export {ServerConnection}