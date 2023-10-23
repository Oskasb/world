let cache = {};
let poolList = [];
let poolKeys = [];
let track = null;
let biggestPool = 0;
let pools = []

let trackPool = function(expandingPool) {
    let size = expandingPool.poolEntryCount()
    track.passive += size;
    if (size > biggestPool) {
        biggestPool = size;
        track.big = expandingPool.dataKey;
        track.bigSize = size;
    }
}

let updatePoolTracking = function() {
    track.passive = 0;
    biggestPool = 0;
    for (let i = 0; i < pools.length; i++) {
        trackPool(pools[i])
    }
    track.active = track.added - track.passive;
}

class ExpandingPool {
    constructor(dataKey, createFunc) {

        pools.push(this);

        if (!cache['DEBUG']) {
            cache = PipelineAPI.getCachedConfigs();
            cache.DEBUG = {};
        }
        if (!cache['DEBUG']['POOLS']) {
            cache.DEBUG.POOLS = {
                added:0,
                pools: 0,
                passive: 0,
                active: 0,
                big: dataKey,
                bigSize: 0,
                poolKeys:poolKeys,
                poolList:poolList
            };
            setTimeout(function() {
                ThreeAPI.addPrerenderCallback(updatePoolTracking)
            }, 5000);

        }

        this.dataKey = dataKey;
        track = cache.DEBUG.POOLS
        track.pools++
        poolKeys.push(dataKey)
        this.pool = [];
        poolList.push(this.pool)

        this.count = {
            added:0
        }

        this.generatePoolEntry = function(callback) {
            track.added++
            this.count.added++
            createFunc(dataKey, callback)
        }.bind(this);

    };

    poolEntryCount = function() {
        return this.pool.length
    };

    pushEP = function(entry) {
        return this.pool.push(entry);
    };

    shiftEP = function() {
        return this.pool.shift()
    };

    getFromExpandingPool = function(callback) {

        if (this.poolEntryCount() !== 0) {
            callback(this.shiftEP());
        } else {
            this.generatePoolEntry(callback)
        }
    };

    returnToExpandingPool = function(entry) {

        if (this.pool.indexOf(entry) === -1) {
            this.pushEP(entry)
        } else {
            console.log("Entry already in pool, no good!", entry)
        }
    };


}

export { ExpandingPool }