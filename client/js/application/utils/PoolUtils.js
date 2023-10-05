import { ExpandingPool } from "./ExpandingPool.js";
import {DynamicGrid} from "../../game/gameworld/DynamicGrid.js";
import {VegetationPatch} from "../../3d/three/terrain/vegetation/VegetationPatch.js";
import {VegetationTile} from "../../3d/three/terrain/vegetation/VegetationTile.js";
import {DynamicTile} from "../../game/gameworld/DynamicTile.js";
import {WorldBox} from "../../game/gameworld/WorldBox.js";
import {Plant} from "../../3d/three/terrain/vegetation/Plant.js";

let pools = {}

function initPools() {
    registerPool(DynamicGrid);
    registerPool(VegetationPatch);
    registerPool(VegetationTile);
    registerPool(DynamicTile);
    registerPool(WorldBox);
    registerPool(Plant);

}

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
   // if (!pools[dataKey])

    pools[dataKey].getFromExpandingPool(fetcher)
    let entry = fetched;
    fetched = null;
    return entry;
}

function poolReturn(entry) {
    pools[entry.constructor.name].returnToExpandingPool(entry)
}

export {
    initPools,
    registerPool,
    poolFetch,
    poolReturn
}