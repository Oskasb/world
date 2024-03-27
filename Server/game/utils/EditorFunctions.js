let serverConnection = null;

function setEditorServerConnection(srvrCon) {
    serverConnection = srvrCon;
}

function saveFileFromSocketMessage(message) {
    if (message.format === "JSON") {
        console.log("saveFile JSON", message.file);
        serverConnection.writeDataToFile(message.id, message.file, message.data);
    } else {
        console.log("Format Not supported", message.file, message.format);
    }

}

export {
    setEditorServerConnection,
    saveFileFromSocketMessage
}