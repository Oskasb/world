class Status {
    constructor(statusValues) {
        this.statusMap = statusValues || {};
    }

    setStatusKey(key, status) {
        this.statusMap[key] = status;
    }

    getStatus(key) {
        return this.statusMap[key];
    }

}

export { Status }