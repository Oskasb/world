import {processServerCommand} from "./ServerCommandProcessor.js";

let worker;
let socket;
let msgEvent = {
	stamp:0,
	msg:""
}

let relayToWorker = function(msg) {
//	let json = JSON.stringify({stamp:client.getStamp(), msg:msg})
	worker.postMessage([ENUMS.Protocol.CLIENT_TO_WORKER, msg]);
}

function setupUniqueConnection(stamp) {
	console.log("Client got Server Stamp from worker message", stamp);
	evt.on(ENUMS.Event.SEND_SOCKET_MESSAGE, relayToWorker)
	client.setStamp(stamp);
}



// './client/js/data_pipeline/worker/ServerWorkerMain.js'
function initWorker() {
	worker = new Worker("./Server/Worker/ServerWorkerMain.js", { type: "module" });

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

			if (msg.data[1].stamp === client.getStamp()) {
				console.log("local dispatch", msg.data)
				processServerCommand(msg.data[0], msg.data[1]);
			} else {
				console.log("remote dispatch", msg.data)
				processServerCommand(msg.data[0], msg.data[1]);
				//	console.log("Not listening to remote dispatches", msg.data)
			}

		} else {
			console.log("Worker Socket Unhandled Message", msg);
		}

	};
}



class ClientConnection {
	constructor() {

		initWorker()
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