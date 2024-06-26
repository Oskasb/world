import {readConfig} from "./ConfigUtils.js";

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
    let rarity = item.getStatus(ENUMS.ItemStatus.QUALITY);
    let level = item.getStatus(ENUMS.ItemStatus.ITEM_LEVEL);
    let randomValue = Math.floor(MATH.randomBetween(1, 30))
    return ENUMS.potency['POTENCY_'+randomValue];

}

function getItemMaxRank(item) {
    let quality = item.getStatus(ENUMS.ItemStatus.QUALITY);
    let rarity = item.getStatus(ENUMS.ItemStatus.QUALITY);
    let level = item.getStatus(ENUMS.ItemStatus.ITEM_LEVEL);
    let randomValue = Math.floor(MATH.randomBetween(1, 30))
    return ENUMS.potency['RANK_'+randomValue];
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
    getItemMaxRank
}