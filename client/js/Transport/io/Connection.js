
let socket;
let msgEvent = {
	stamp:0,
	msg:""
}

// './client/js/data_pipeline/worker/WorkerMain.js'
let worker = new Worker("./Server/Worker/WorkerMain.js", { type: "module" });
worker.onmessage = function(msg) {

		if (msg.data[0] === ENUMS.Protocol.SET_SERVER_STAMP) {
			console.log("Worker Set ServerStamp", msg.data[1]);
			client.setStamp(msg.data[1]);
			let relayToWorker = function(msg) {

				if (!msg) {
					console.log("SEND REQUEST missing", msg, args);
					return;
				}

				let json = JSON.stringify({stamp:client.getStamp(), msg:msg})
			//	console.log("Relay to Worker: ", json)
				worker.postMessage([ENUMS.Protocol.CLIENT_TO_WORKER, json]);
			}

			evt.on(ENUMS.Event.SEND_SOCKET_MESSAGE, relayToWorker)

			let callServer = function(msg) {
				let json = JSON.stringify({stamp:client.getStamp(), msg:msg})
				worker.postMessage([ENUMS.Protocol.SERVER_CALL, json]);
			}

			evt.on(ENUMS.Event.CALL_SERVER, callServer)
		}

	if (msg.data[0] === ENUMS.Protocol.MESSAGE_RECEIVE) {

		msgEvent.stamp = msg.data[1].stamp;
		msgEvent.msg = msg.data[1].msg;
		evt.dispatch(ENUMS.Event.ON_SOCKET_MESSAGE, msgEvent)

	//	console.log("Worker Socket -> Client Message", msg[1], msgEvent);
	}

};

class Connection {
	constructor() {
		worker.postMessage({message:"ping", transfer:["connect"]})
		let sendMessage = function(msg) {

			//	console.log("SEND message", msg, args);
			if (!msg) {
				console.log("SEND REQUEST missing", msg, args);
			}

			let json = JSON.stringify({stamp:client.getStamp(), msg:msg})
			socket.send(json);
		};

		this.call = {
			sendMessage:sendMessage
		}
	}

	setupWorker = function() {

	}

	setupSocket = function(connectedCallback, errorCallback, disconnectedCallback) {

	};

}

export { Connection };