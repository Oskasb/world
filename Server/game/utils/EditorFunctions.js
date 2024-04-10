import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {broadcastAll, getServerStamp} from "./GameServerFunctions.js";

let serverConnection = null;
let editIndex = null;
function setEditIndex(eIndex) {
    console.log("Set Edit Index", Object.keys(eIndex).length, eIndex)
    editIndex = eIndex;
}

function getEditIndex() {
    console.log("getEditIndex", Object.keys(editIndex).length)
    return editIndex;
}

function setEditorServerConnection(srvrCon) {
    serverConnection = srvrCon;
}

function addIndexEntry(path, root, folder, id, format, deleted, init) {
    console.log("addIndexEntry :", path, root, folder, id, format, deleted, init)
    let entry = {path:path, root:root, folder:folder, format:format, deleted:deleted, timestamp:new Date().getTime()};
 //   console.log("WriteIndex:", dir, root, folder)
    if (init !== true) {
        if (!editIndex[id]) {
            let msg = {
                stamp:getServerStamp(),
                command:ENUMS.ServerCommands.LOAD_FILE_DATA,
                request:ENUMS.ClientRequests.READ_FILE,
                id:id,
                timestamp:entry.timestamp,
                path:path,
                root:root,
                folder:folder,
                data:entry,
                operation:"add",
                format:'index_entry'
            }
            broadcastAll(msg);
        }
    }

    editIndex[id] = entry
    return entry.timestamp;
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

        if (!editIndex[message.id]) {
            console.log("Any reads should be in the index...", message.id)
            console.log(editIndex);
        } else {
            message.timestamp = editIndex[message.id].timestamp;
            console.log("readFileFromSocketMessage JSON", message);
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