function processServerCommand(command, message) {

    let stamp = message.stamp;
    let msg = JSON.parse(message.msg);
    let encounter;


    switch (msg.command) {
        case ENUMS.ServerCommands.PLAYER_CONNECTED:
            console.log("Player Connected; ", stamp, msg);

            break;
        case ENUMS.ServerCommands.PLAYER_UPDATE:
            console.log("Player Update; ", stamp, msg);

            break;
        case ENUMS.ServerCommands.PLAYER_DISCONNECTED:
            console.log("Player Disconnected; ", stamp, msg);

            break;
        case ENUMS.ServerCommands.ACTOR_INIT:
            console.log("ACTOR_INIT; ", stamp, msg);

            break;
        case ENUMS.ServerCommands.ACTOR_UPDATE:
            console.log("ACTOR_UPDATE; ", stamp, msg);

            break;
        case ENUMS.ServerCommands.ACTOR_REMOVED:
            console.log("ACTOR_REMOVED; ", stamp, msg);

            break;
        case ENUMS.ServerCommands.ENCOUNTER_TRIGGER:
            console.log("Trigger Encounter; ", msg.encounterId, msg.worldEncounterId, stamp, msg);
            encounter = GameAPI.getWorldEncounterByEncounterId(msg.worldEncounterId);
            encounter.call.triggerWorldEncounter();
            console.log("WE: ", encounter);
            break;
        case ENUMS.ServerCommands.ENCOUNTER_START:
            console.log("Start Encounter; ", msg.encounterId, msg.worldEncounterId, stamp, msg);
            encounter = GameAPI.getWorldEncounterByEncounterId(msg.worldEncounterId);
            encounter.call.startWorldEncounter();
            break;
        case ENUMS.ServerCommands.ENCOUNTER_CLOSE:
            console.log("Close Encounter; ", msg.encounterId, msg.worldEncounterId, stamp, msg);
            break;
        default:
            console.log("Unhandled server Command; ", [stamp, msg]);
    }

}


export {
    processServerCommand
}