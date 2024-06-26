import {readConfig} from "./ConfigUtils.js";



let potencyMap = {};
potencyMap[ENUMS.quality.POOR] =        {slots:2, steps:1};
potencyMap[ENUMS.quality.BASIC] =       {slots:3, steps:2};
potencyMap[ENUMS.quality.GOOD] =        {slots:4, steps:3};
potencyMap[ENUMS.quality.EXCEPTIONAL] = {slots:4, steps:4};
potencyMap[ENUMS.quality.SUPERB] =      {slots:5, steps:5};

let rankMap = {};
rankMap[ENUMS.rarity.PLAIN]     = {slots:2, steps:1};
rankMap[ENUMS.rarity.COMMON]    = {slots:2, steps:2};
rankMap[ENUMS.rarity.UNCOMMON]  = {slots:3, steps:3};
rankMap[ENUMS.rarity.RARE]      = {slots:4, steps:4};
rankMap[ENUMS.rarity.EPIC]      = {slots:5, steps:5};
rankMap[ENUMS.rarity.LEGENDARY] = {slots:6, steps:6};

function getSlotStepMaxCount(slotStep) {
    return slotStep.slots * slotStep.steps;
}

function getVisualConfigIconClass(visdualConfig) {
    let cString = visdualConfig.data['icon_class'];
    if (typeof (cString) === "string") {
        return cString
    }
    return ""
}

function getItemIconClass(itemId) {
    let visualCfg = getVisualConfigByItemId(itemId);

    if (visualCfg !== null) {
        getVisualConfigIconClass(visualCfg);
    }
    return "";
}

function getVisualConfigByVisualId(visualId) {
    let cfgs = readConfig("GAME","VISUALS")
    for (let i = 0; i < cfgs.length; i++) {
        if (cfgs[i].id === visualId) {
            return cfgs[i];
        }
    }
    return null;
}

function getItemConfigByItemId(itemId) {
    let cfgs = readConfig("GAME","ITEMS")
//    console.log("getItemConfigByItemId", cfgs)
    for (let i = 0; i < cfgs.length; i++) {
        if (cfgs[i].id === itemId) {
            return cfgs[i];
        }
    }

    return null;
}

function getVisualConfigByItemId(itemId) {
    let cfg = getItemConfigByItemId(itemId);

    if (cfg !== null) {
        let visualId = cfg.data['visual_id'];
        return getVisualConfigByVisualId(visualId);
    }
    return null;
}

function getItemConfigStatus(itemId, status) {
    let cfg = getItemConfigByItemId(itemId);
    if (cfg !== null) {
        if (cfg.data['status']) {
            if (cfg.data.status[status]) {
                return cfg.data.status[status]
            }
        }
    }
    return null;
}

function getItemRarity(itemId) {
    let rarity = getItemConfigStatus(itemId, "RARITY")
    if (rarity === null) {
        return ENUMS.rarity.COMMON;
    }
    return ENUMS.rarity[rarity];
}

function getItemQuality(itemId) {
    let rarity = getItemConfigStatus(itemId, "QUALITY")
    if (rarity === null) {
        return ENUMS.quality.BASIC;
    }
    return ENUMS.quality[rarity];
}

function getItemUiStateKey(item) {
    let slotId = item.getStatus(ENUMS.ItemStatus.EQUIPPED_SLOT);
    if (typeof ENUMS.EquipmentSlots[slotId] === 'string') {
        return ENUMS.UiStates.CHARACTER;
    } else if (typeof ENUMS.InventorySlots[slotId] === 'string') {
        return ENUMS.UiStates.INVENTORY;
    }
}



function getItemMaxPotency(item) {
    let quality = item.getStatus(ENUMS.ItemStatus.QUALITY);
    let slotsSteps = potencyMap[quality];
    return getSlotStepMaxCount(slotsSteps);
}

function getItemMaxRank(item) {
    let rarity = item.getStatus(ENUMS.ItemStatus.RARITY);
    let slotsSteps = rankMap[rarity];
    return getSlotStepMaxCount(slotsSteps);
}

function getItemPotencySlotCount(item) {
    let quality = item.getStatus(ENUMS.ItemStatus.QUALITY);
    let slotsSteps = potencyMap[quality];
    return slotsSteps.slots;
}

function getItemRankSlotCount(item) {
    let rarity = item.getStatus(ENUMS.ItemStatus.RARITY);
    let slotsSteps = rankMap[rarity];
    return slotsSteps.slots;
}

let levelFill = {level:0, fill:0}
function getItemPotencyIndicatorLevelFill(item) {
    let quality = item.getStatus(ENUMS.ItemStatus.QUALITY);
    let slotsSteps = potencyMap[quality];
    let pIndex = item.getStatus(ENUMS.ItemStatus.ITEM_POTENCY);
    let slots = slotsSteps.slots;
    let steps = slotsSteps.steps;
    let max = getSlotStepMaxCount(slotsSteps)
    levelFill.level = Math.floor(max * MATH.calcFraction(0, max, pIndex) / (slots)) ;
    levelFill.fill = 1+pIndex - levelFill.level * slots;
    return levelFill;
}

function getItemRankIndicatorLevelFill(item) {
    let rarity = item.getStatus(ENUMS.ItemStatus.RARITY);
    let slotsSteps = rankMap[rarity];
    let rIndex = item.getStatus(ENUMS.ItemStatus.ITEM_RANK);
    let slots = slotsSteps.slots;
    let steps = slotsSteps.steps;
    let max = getSlotStepMaxCount(slotsSteps)
    levelFill.level = Math.floor(max * MATH.calcFraction(0, max, rIndex) / (slots)) ;
    levelFill.fill = 1+rIndex - levelFill.level * slots;
    return levelFill;
}

export {
    getItemRarity,
    getItemQuality,
    getItemConfigStatus,
    getItemIconClass,
    getItemConfigByItemId,
    getVisualConfigByItemId,
    getVisualConfigByVisualId,
    getVisualConfigIconClass,
    getItemUiStateKey,
    getItemMaxPotency,
    getItemMaxRank,
    getItemPotencySlotCount,
    getItemRankSlotCount,
    getItemPotencyIndicatorLevelFill,
    getItemRankIndicatorLevelFill,
    potencyMap,
    rankMap
}