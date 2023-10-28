class ControlState {
    constructor() {
        this.values = {};
    }

    getValues() {
        return this.values;
    }

    setControlByKey(key, value) {
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