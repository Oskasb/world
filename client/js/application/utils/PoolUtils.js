import { ExpandingPool } from "./ExpandingPool.js";

let pools = {}

function registerPool(DataObj) {

    let dataKey = DataObj.name;

    if (pools[dataKey]) {
    //    console.log("Pool already registered", dataKey)
    } else {
        let createFunc = function(key, cb) {
            cb(new DataObj())
        }
        pools[dataKey] = new ExpandingPool(dataKey, createFunc)
    }
}

let fetched = null;
let fetcher = function(entry) {
    fetched = entry;
}

function poolFetch(dataKey) {
    pools[dataKey].getFromExpandingPool(fetcher)
    let entry = fetched;
    fetched = null;
    return entry;
}

function poolReturn(entry) {
    pools[entry.constructor.name].returnToExpandingPool(entry)
}

export {
    registerPool,
    poolFetch,
    poolReturn
}