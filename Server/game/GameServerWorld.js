import {ServerEncounter} from "./encounter/ServerEncounter.js";
import {MATH} from "../../client/js/application/MATH.js";

let activeEncounters = [];

function getEncounterById(encId) {
    for (let i = 0; i < activeEncounters.length; i++) {
        if (activeEncounters[i].id === encId) {
            return activeEncounters[i]
        }
    }
    console.log("No Server Encounter by id", encId, activeEncounters);
}

let closeEncounterCB = function(encounterId) {
    MATH.splice(activeEncounters, encounterId)
}

class GameServerWorld {
    constructor() {

    }

    initServerEncounter( message) {
        console.log("Handle Encounter Init", message)
        if (activeEncounters.indexOf(message.encounterId) === -1) {
            let enc = new ServerEncounter(message, closeEncounterCB);
            activeEncounters.push(enc);
        } else {
            console.log("Server already operates encounter by id: ", message.encounterId)
        }
    }

    handleEncounterPlayMessage(message) {
        let enc = getEncounterById(message.encounterId);
        enc.applyPlayerPlayMessage(message);
    }

    getActiveEncoutners() {
        return activeEncounters;
    }

}

export {GameServerWorld}