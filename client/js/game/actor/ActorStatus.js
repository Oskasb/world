class ActorStatus {
    constructor() {
        this.statusMap = {}
    }

    getStatusByKey(key) {
        if (typeof (this.statusMap[key]) === 'undefined') {
            this.statusMap[key] = 0;
        }
        return this.statusMap[key]
    }

    setStatusKey(key, status) {
        this.statusMap[key] = status;
    }


}

export { ActorStatus }