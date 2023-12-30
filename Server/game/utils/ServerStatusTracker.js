let incomingBytes = 0;
let outgoingBytes = 0;
let sends = 0;
let receives = 0;


function trackIncomingBytes(byteCount) {
    receives++
    incomingBytes+=byteCount;
}

function trackOutgoingBytes(byteCount) {
    sends++
    outgoingBytes+=byteCount;
}

function getIncomingBytes() {
    return incomingBytes;
}

function getOutgoingBytes() {
    return outgoingBytes;
}

export {
    trackIncomingBytes,
    trackOutgoingBytes,
    getIncomingBytes,
    getOutgoingBytes
}