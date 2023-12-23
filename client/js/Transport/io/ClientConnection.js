import {processServerCommand} from "./ServerCommandProcessor.js";

let socket;
let msgEvent = {
	stamp:0,
	msg:""
}

let relayToWorker = function(msg) {

	if (!msg) {
		console.log("SEND REQUEST missing", msg, args);
		return;
	}

	let json = JSON.stringify({stamp:client.getStamp(), msg:msg})
	//	console.log("Relay to Worker: ", json)
	worker.postMessage([ENUMS.Protocol.CLIENT_TO_WORKER, json]);
}

let callServer = function(msg) {
	let json = JSON.stringify({stamp:client.getStamp(), msg:msg})
	worker.postMessage([ENUMS.Protocol.SERVER_CALL, json]);
}

function setupUniqueConnection(stamp) {
	console.log("Client got Server Stamp from worker message", stamp);
	evt.on(ENUMS.Event.SEND_SOCKET_MESSAGE, relayToWorker)
	evt.on(ENUMS.Event.CALL_SERVER, callServer)
	client.setStamp(stamp);
}

// './client/js/data_pipeline/worker/WorkerMain.js'
let worker = new Worker("./Server/Worker/WorkerMain.js", { type: "module" });

worker.onmessage = function(msg) {

	let protocolKey = msg.data[0];

	if (protocolKey === ENUMS.Protocol.SET_SERVER_STAMP) {
		setupUniqueConnection(msg.data[1]);
	} else if (protocolKey === ENUMS.Protocol.MESSAGE_RELAYED) {
		msgEvent.stamp = msg.data[1].stamp;
		msgEvent.msg = msg.data[1].msg;
		if (msgEvent.stamp === client.getStamp()) {
			console.log("Not return back to self")
		} else {
			evt.dispatch(ENUMS.Event.ON_SOCKET_MESSAGE, msgEvent)
		}

		//	console.log("Worker Socket -> Client Message", msg[1], msgEvent);
	} else if (protocolKey === ENUMS.Protocol.SERVER_DISPATCH) {
		console.log("SERVER_DISPATCH -> Socket", msg[1], msgEvent);
		processServerCommand(msg.data[0], msg.data[1]);
	} else {
		console.log("Worker Socket Unhandled Message", msg);
	}

};

class ClientConnection {
	constructor() {
	//	worker.postMessage({message:"ping", transfer:["connect"]})
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

}

export { ClientConnection };