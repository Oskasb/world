function processServerCommand(command, message) {

    let stamp = message.stamp;
    let msg = JSON.parse(message.msg);

    if (msg.command === ENUMS.ServerCommands.ENCOUNTER_TRIGGER) {
        console.log("Trigger Encounter; ", msg.encounterId, msg.worldEncounterId, stamp, msg);
        let encounter = GameAPI.getWorldEncounterByEncounterId(msg.worldEncounterId);
        encounter.call.triggerWorldEncounter();
        console.log("WE: ", encounter);

    } else if (msg.command === ENUMS.ServerCommands.ENCOUNTER_CLOSE) {
        console.log("Close Encounter; ", msg.encounterId, msg.worldEncounterId, stamp, msg);
    } else {
        console.log("Unhandled server Command; ", [stamp, msg]);
    }
}


export {
    processServerCommand
}