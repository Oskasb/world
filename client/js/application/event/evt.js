
class evt {

    constructor(eventKeys) {

        for (let key in eventKeys) {
            this.setupEvent(eventKeys[key])
        }

    }

    listeners = [];
    spliceListeners = [];
    evtStatus = {
        activeListeners:0,
        firedCount:0,
        onceListeners:0,
        addedListeners:0
    };

    setupEvent = function(event) {

        if (typeof (event) !== 'number') {
            console.log("Old Event: ", event);
            return;
        }

        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
    };


    dispatch(event, args) {

        while (this.spliceListeners.length) {
        //    console.log("pre splice listeners", this.spliceListeners);
            this.spliceListener(this.spliceListeners.shift(), this.spliceListeners.shift())
        }

        for (let i = 0; i < this.listeners[event].length; i++) {

            if (typeof (this.listeners[event][i]) !== 'function') {
                console.log("Bad listener", event, this.listeners);
                return;
            }

            this.listeners[event][i](args);
        }

        while (this.spliceListeners.length) {
        //    console.log("post splice listeners", this.spliceListeners);
            this.spliceListener(this.spliceListeners.shift(), this.spliceListeners.shift())
        }
        this.evtStatus.firedCount++;
    };

    removeListener(event, callback, evt) {

        if (!evt.listeners[event]) {
            return;
        }

        if (evt.listeners[event].indexOf(callback) === -1) {
            return;
        }

        evt.spliceListeners.push(evt.listeners[event]);
        evt.spliceListeners.push(callback);
    };

    on(event, callback) {
    //    this.setupEvent(event);
        this.listeners[event].push(callback);
    };

    once(event, callback) {
    //    this.setupEvent(event);

        const _this = this;

        const evtStatus = this.evtStatus;

        const remove = function() {
            _this.removeListener(event, singleShot,_this);
            evtStatus.onceListeners--;
            if (evtStatus.onceListeners < 0) {
                console.log("remaining singleshots", evtStatus.onceListeners);
            }
        };

        const call = function(args) {
            callback(args);
        };

        const singleShot = function(args) {

            call(args);
            remove();

        };

        this.evtStatus.onceListeners++;

        this.on(event, singleShot);
    };

    spliceListener(listeners, cb) {
        MATH.quickSplice(listeners, cb);
    };

    getEventSystemStatus() {

        this.evtStatus.eventCount = 0;
        this.evtStatus.listenerCount = 0;
        for (const key in this.listeners) {
            this.evtStatus.eventCount++;
            this.evtStatus.listenerCount += this.listeners[key].length;
        }

        return this.evtStatus;
    };

}

export { evt }