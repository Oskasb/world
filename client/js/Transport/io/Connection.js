import {GuiAPI} from "../../application/ui/gui/GuiAPI.js";

var socket;
var frameStack = [];
var messageCount = 0;
var socketBytes = 0;

class Connection {
	constructor() {
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

	setupSocket = function(connectedCallback, errorCallback, disconnectedCallback) {
		let host = location.origin.replace(/^http/, 'ws');
		let pings = 0;

		let msgEvent = {
			stamp:0,
			msg:""
		}

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