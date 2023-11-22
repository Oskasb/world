
import { ServerConnection} from "./io/ServerConnection.js";
class ServerMain {
	constructor() {
		console.log("Construct Server Main");
		this.serverConnection = new ServerConnection();
	}

	initServerConnection = function (wss) {
		this.serverConnection.setupSocket(wss);
	};

}

export {ServerMain}