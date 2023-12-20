import {ENUMS} from "../../application/ENUMS.js";


let socket;
let frameStack = [];
let messageCount = 0;
let socketBytes = 0;
// './client/js/data_pipeline/worker/WorkerMain.js'
let serverStamp = 0;

class WorkerConnection {
	constructor() {
		console.log("Worker Connection ready")
		let sendMessage = function(serverStamp, msg) {

			//	console.log("SEND message", msg, args);
			if (!msg) {
				console.log("SEND REQUEST missing", msg, args);
				//	return;
			}

			let json = JSON.stringify({stamp:serverStamp, msg:msg})
		//	console.log("Send string: ", [json])
			socket.send(json);
		};

		let sendJson = function(json) {
			socket.send(json);
		}

		this.call = {
			sendJson:sendJson,
			sendMessage:sendMessage
		}
	}

	setupSocket = function(connectedCallback, errorCallback, disconnectedCallback, messageCallback) {
		let host = location.origin.replace(/^http/, 'ws');
		let pings = 0;


		socket = new WebSocket(host);
		socket.responseCallbacks = {};

		socket.onopen = function (event) {
			let timestamp = WorkerGlobalScope.MATH.decimalify(event.timeStamp + new Date().getTime(), 1);
			serverStamp = Number(String(timestamp).split('').reverse().join(''));
			postMessage([ENUMS.Protocol.SET_SERVER_STAMP, serverStamp])
			connectedCallback(event, serverStamp);
		};

		socket.onclose = function (event) {
			disconnectedCallback(event);
		};

		socket.onmessage = function (message) {
			messageCount++;
			socketBytes += message.data.length;
		//	console.log("Socket Message: ",messageCount, socketBytes, [message.data])
			let msg = JSON.parse(message.data)
		//	console.log("Worker Socket Message", msg)
			if (msg.stamp !== serverStamp) {
				messageCallback(msg);
			}

		};

		socket.onerror = function (error) {
			console.log('WebSocket error: ' + error);
			errorCallback(error);
		};

	};

}

export { WorkerConnection };