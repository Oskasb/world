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
    editIndex[id] = {dir:dir, root:root, folder:folder, format:format, deleted:deleted, timestamp:new Date().getTime()};
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
    if (message.format === "json") {
        console.log("readFileFromSocketMessage JSON", message.id);
        if (!editIndex[message.id]) {
            console.log("Any reads should be in the index...", message.id)
            console.log(editIndex);
        } else {
            serverConnection.readDataFromFile(message, callback);
        }

    } else {
        console.log("Format Not supported", message.id, message.format);
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