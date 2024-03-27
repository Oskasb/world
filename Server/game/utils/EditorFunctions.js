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

function addIndexEntry(id, file, format) {
    console.log("updateEditWriteIndex", id, file, format)
    editIndex[id] = {file:file, timestamp:new Date().getTime(), format:format};
}

function saveFileFromSocketMessage(message) {
    if (message.format === "JSON") {
    //    console.log("saveFileFromSocketMessage JSON", message.file);
        addIndexEntry(message.id, message.file, message.format);
        serverConnection.writeDataToFile(message.format, message.id, message.file, message.data);
    } else {
        console.log("Format Not supported", message.file, message.format);
    }

}

function readFileFromSocketMessage(message, callback) {
    if (message.format === "JSON") {
        console.log("readFileFromSocketMessage JSON", message.id);
        if (!editIndex[message.id]) {
            console.log("Any reads should be in the index...", message.id)
            console.log(editIndex);
        } else {
            serverConnection.readDataFromFile(message.format, message.id, message.file, callback);
        }

    } else {
        console.log("Format Not supported", message.file, message.format);
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