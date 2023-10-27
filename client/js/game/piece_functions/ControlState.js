class ControlState {
    constructor() {
        this.values = {};
    }

    setControlByKey(key, values) {
        this.values[key] = value;
    }

    getControlByKey(key) {
        if (!this.values[key]) {
            this.values[key] = 0;
        }
        return this.values[key]
    }

}

export { ControlState }