import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {broadcastAll, getServerStamp} from "./GameServerFunctions.js";

let serverConnection = null;
let editIndex = null;
function setEditIndex(eIndex) {
    console.log("Set Edit Index", eIndex)
    editIndex = eIndex;
}

function getEditIndex() {
    return editIndex;
}

function setEditorServerConnection(srvrCon) {
    serverConnection = srvrCon;
}

function addIndexEntry(dir, root, folder, id, format, deleted) {
    console.log("updateEditWriteIndex", id)
    let entry = {dir:dir, root:root, folder:folder, format:format, deleted:deleted, timestamp:new Date().getTime()};
    if (!editIndex[id]) {
        let msg = {
            stamp:getServerStamp(),
            command:ENUMS.ServerCommands.LOAD_FILE_DATA,
            request:ENUMS.ClientRequests.READ_FILE,
            id:id,
            root:root,
            folder:folder,
            data:entry,
            operation:"add",
            format:'index_entry'
        }
        broadcastAll(msg);
    }
    editIndex[id] = entry
}

function saveFileFromSocketMessage(message) {
    if (message.format === "json" || message.format === "buffer") {
    //    console.log("saveFileFromSocketMessage JSON", message.file);
        serverConnection.writeDataToFile(message);

    } else {
        console.log("Format Not supported", message.id, message.format);
    }

}

function readFileFromSocketMessage(message, callback) {
    if (message.format === "json" || message.format === "buffer") {
        console.log("readFileFromSocketMessage JSON", message.id);
        if (!editIndex[message.id]) {
            console.log("Any reads should be in the index...", message.id)
            console.log(editIndex);
        } else {
            serverConnection.readDataFromFile(message, callback);
        }

    } else {
        console.log("Format Not supported", message, message.id, message.format);
    }

}

export {
    setEditIndex,
    getEditIndex,
    addIndexEntry,
    setEditorServerConnection,
    saveFileFromSocketMessage,
    readFileFromSocketMessage
}