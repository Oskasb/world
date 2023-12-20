// import {WorkerMain} from "../../../../Server/Worker/WorkerMain.js";

let socket;
let frameStack = [];
let messageCount = 0;
let socketBytes = 0;
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
		}

	if (msg.data[0] === ENUMS.Protocol.MESSAGE_RECIEVE) {

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
				//	return;
			}

			let json = JSON.stringify({stamp:client.getStamp(), msg:msg})
		//	console.log("Send string: ", [json])
			socket.send(json);
		};

		this.call = {
			sendMessage:sendMessage
		}
	}

	setupWorker = function() {

	}

	setupSocket = function(connectedCallback, errorCallback, disconnectedCallback) {
		return;
		let host = location.origin.replace(/^http/, 'ws');
		let pings = 0;



		socket = new WebSocket(host);
		socket.responseCallbacks = {};

		socket.onopen = function (event) {
			window.GuiAPI.screenText('Connected')
			connectedCallback(event);
		};

		socket.onclose = function (event) {
			disconnectedCallback(event);
		};

		socket.onmessage = function (message) {
			messageCount++;
			socketBytes += message.data.length;
		//	console.log("Socket Message: ",messageCount, socketBytes, [message.data])
			let msg = JSON.parse(message.data)
			if (msg.stamp !== client.getStamp()) {
				msgEvent.stamp = msg.stamp;
				msgEvent.msg = msg.msg;
				evt.dispatch(ENUMS.Event.ON_SOCKET_MESSAGE, msgEvent)
			}
		};

		socket.onerror = function (error) {
			console.log('WebSocket error: ' + error);
			errorCallback(error);
		};

	};

}

export { Connection };