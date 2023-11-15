import { ExpandingPool } from "./ExpandingPool.js";
import {DynamicGrid} from "../../game/gameworld/DynamicGrid.js";
import {VegetationPatch} from "../../3d/three/terrain/vegetation/VegetationPatch.js";
import {VegetationTile} from "../../3d/three/terrain/vegetation/VegetationTile.js";
import {DynamicTile} from "../../game/gameworld/DynamicTile.js";
import {WorldBox} from "../../game/gameworld/WorldBox.js";
import {Plant} from "../../3d/three/terrain/vegetation/Plant.js";
import {VisualTile } from "../../game/visuals/VisualTile.js";
import {ActorAction} from "../../game/actor/ActorAction.js";
import {VisualAction} from "../../game/visuals/VisualAction.js";
import {VisualIndicator} from "../../game/visuals/VisualIndicator.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";

let pools = {}
let stats = {};

function initPools() {
    registerPool(DynamicGrid);
    registerPool(VegetationPatch);
    registerPool(VegetationTile);
    registerPool(DynamicTile);
    registerPool(WorldBox);
    registerPool(Plant);
    registerPool(VisualTile);
    registerPool(ActorAction);
    registerPool(VisualAction);
    registerPool(VisualIndicator);
    registerPool(Vector3);
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
    if (!entry) {
        console.log("fetcher() is giving nothing... fix!")
    }
    return entry;
}

function poolReturn(entry) {
    pools[entry.constructor.name].returnToExpandingPool(entry)
}

function poolStats(dataKey, store) {
    if (!store) store = stats;
    let expPool = pools[dataKey]
    store.size = expPool.poolEntryCount();
    store.added = expPool.count.added;
    store.active = expPool.count.active
}

export {
    initPools,
    registerPool,
    poolFetch,
    poolReturn,
    poolStats
}