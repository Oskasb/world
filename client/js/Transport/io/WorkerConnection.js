import {ENUMS} from "../../application/ENUMS.js";
import {MATH} from "../../application/MATH.js";

let socket;
let frameStack = [];
let messageCount = 0;
let socketBytes = 0;
let serverStamp = 0;

class WorkerConnection {
	constructor() {
		console.log("Worker ClientConnection ready")

		let sendJson = function(json) {
			socket.send(json);
		}

		this.call = {
			sendJson:sendJson
		}
	}

	setupSocket = function(connectedCallback, errorCallback, disconnectedCallback, messageCallback) {
		let host = location.origin.replace(/^http/, 'ws');
		let pings = 0;


		socket = new WebSocket(host);
		socket.responseCallbacks = {};

		socket.onopen = function (event) {
			let timestamp = MATH.decimalify(event.timeStamp + new Date().getTime(), 1);
			serverStamp = Number(String(timestamp).split('').reverse().join(''));
			postMessage([ENUMS.Protocol.SET_SERVER_STAMP, serverStamp])
			connectedCallback(event, serverStamp);
		};

		socket.onclose = function (event) {
			disconnectedCallback(event);
		};

		socket.onmessage = function (message) {
		//	console.log("Socket Message: ", message)
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