import {ServerEncounter} from "./encounter/ServerEncounter.js";
import {MATH} from "../../client/js/application/MATH.js";

let activeEncounterStamps = [];

let closeEncounterCB = function(stamp) {
    MATH.splice(activeEncounterStamps, stamp)
}

class GameServerWorld {
    constructor() {

    }

    initServerEncounter( message) {
        console.log("Handle Encounter Init", message)
        if (activeEncounterStamps.indexOf(message.stamp) === -1) {
            new ServerEncounter(message, closeEncounterCB);
            activeEncounterStamps.push(message.stamp);
        } else {
            console.log("Server already operates encounter by source stamp: ", message.stamp)
        }
    }

}

export {GameServerWorld}