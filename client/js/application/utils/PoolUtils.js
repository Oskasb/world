import { ExpandingPool } from "./ExpandingPool.js";
import {DynamicGrid} from "../../game/gameworld/DynamicGrid.js";
import {VegetationPatch} from "../../3d/three/terrain/vegetation/VegetationPatch.js";
import {DynamicTile} from "../../game/gameworld/DynamicTile.js";
import {WorldBox} from "../../game/gameworld/WorldBox.js";
import {Plant} from "../../3d/three/terrain/vegetation/Plant.js";
import {VisualTile } from "../../game/visuals/VisualTile.js";
import {ActorAction} from "../../game/actor/ActorAction.js";
import {VisualAction} from "../../game/visuals/VisualAction.js";
import {VisualIndicator} from "../../game/visuals/VisualIndicator.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import {GuiScreenSpaceText} from "../ui/gui/widgets/GuiScreenSpaceText.js";
import {PathPoint} from "../../game/gameworld/PathPoint.js";
import {SpatialTransition} from "./SpatialTransition.js";

import { VisualTrajectory } from "../../game/visuals/effects/VisualTrajectory.js";
import { VisualPointFX } from "../../game/visuals/VisualPointFX.js";
import { WorldActorStatusUI } from "../ui/gui/systems/WorldActorStatusUI.js";
import { VisualPulse } from "../../game/visuals/effects/VisualPulse.js";
import { VisualModel } from "../../game/visuals/VisualModel.js";
import {PhysicalModel} from "../../game/gameworld/PhysicalModel.js";
import {PhysicalShape} from "../../game/gameworld/PhysicalShape.js";
import {VisualPieceEffectContinuous} from "../../game/visuals/effects/VisualPieceEffectContinuous.js";
import {VisualPieceEffectTransition} from "../../game/visuals/effects/VisualPieceEffectTransition.js";
import {VisualModelPalette} from "../../game/visuals/VisualModelPalette.js";
import {StatisticalAction} from "../../game/actions/StatisticalAction.js";
import {VisualEngagementIndicator} from "../../game/visuals/effects/VisualEngagementIndicator.js";
import {VisualEngagementArc} from "../../game/visuals/effects/VisualEngagementArc.js";
import {VisualGridBorder} from "../../game/visuals/VisualGridBorder.js";
import {VisualEdgeLine} from "../../game/visuals/VisualEdgeLine.js";
import {HtmlElement} from "../ui/dom/HtmlElement.js";
import {ScalarTransition} from "./ScalarTransition.js";

let pools = {}
let stats = {};

function initPools() {
    registerPool(DynamicGrid);
    registerPool(VegetationPatch);
    registerPool(DynamicTile);
    registerPool(WorldBox);
    registerPool(Plant);
    registerPool(VisualTile);
    registerPool(ActorAction);
    registerPool(VisualAction);
    registerPool(VisualIndicator);
    registerPool(Vector3);
    registerPool(GuiScreenSpaceText);
    registerPool(PathPoint);
    registerPool(SpatialTransition);
    registerPool(VisualPointFX);
    registerPool(WorldActorStatusUI);
    registerPool(VisualTrajectory);
    registerPool(VisualPulse);
    registerPool(VisualPieceEffectContinuous);
    registerPool(VisualModel);
    registerPool(PhysicalModel);
    registerPool(PhysicalShape);
    registerPool(VisualPieceEffectTransition);
    registerPool(VisualModelPalette);
    registerPool(StatisticalAction);
    registerPool(VisualEngagementIndicator);
    registerPool(VisualEngagementArc);
    registerPool(VisualGridBorder);
    registerPool(VisualEdgeLine);
    registerPool(HtmlElement);
    registerPool(ScalarTransition)
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
    entry.poolFetched = true;
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