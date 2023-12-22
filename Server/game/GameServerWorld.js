import {ServerEncounter} from "./encounter/ServerEncounter.js";
import {MATH} from "../../client/js/application/MATH.js";

let activeEncounterStamps = [];

let closeEncounterCB = function(stamp) {
    MATH.splice(activeEncounterStamps, stamp)
}

class GameServerWorld {
    constructor() {

    }

    initServerEncounter(requestMsg) {
        console.log("Handle Encounter Init", requestMsg)
        if (activeEncounterStamps.indexOf(requestMsg.stamp) === -1) {
            new ServerEncounter(requestMsg, closeEncounterCB);
            activeEncounterStamps.push(requestMsg.stamp);
        } else {
            console.log("Server already operates encounter by source stamp: ", requestMsg.stamp)
        }
    }

}

export {GameServerWorld}