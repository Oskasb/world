import {getReversedConfigs} from "./ConfigUtils.js";
import {getItemConfigs} from "./ActorUtils.js";
import {getPlayerStatus, setPlayerStatus} from "./StatusUtils.js";
import {ENUMS} from "../ENUMS.js";
import {loadItemStatus, saveItemStatus, savePlayerStatus} from "../setup/Database.js";
import {evt} from "../event/evt.js";
import {getItemRecipe} from "./CraftingUtils.js";


function itemLoaded(item) {
    let itemStatus = loadItemStatus(item.getStatus(ENUMS.ItemStatus.ITEM_ID));
    for (let key in itemStatus) {
        item.setStatusKey(key, itemStatus[key]);
    }
    let slot = item.getStatus(ENUMS.ItemStatus.EQUIPPED_SLOT);
    console.log("Stash Item Loaded ", slot, item.getStatus(ENUMS.ItemStatus.ITEM_ID), item.getStatus());
    saveItemStatus(item.getStatus());
}
function loadStashItem(item) {
    let itemStatus = item.getStatus();
    evt.dispatch(ENUMS.Event.LOAD_ITEM,  {id: itemStatus[ENUMS.ItemStatus.TEMPLATE], itemId:itemStatus[ENUMS.ItemStatus.ITEM_ID], callback:itemLoaded})
}

function stashItem(item) {

    let itemId = item.getStatus(ENUMS.ItemStatus.ITEM_ID)
    let itemType = item.getStatus(ENUMS.ItemStatus.ITEM_TYPE);

    let page = ENUMS.PlayerStatus.STASH_TAB_ITEMS;
    if (itemType === ENUMS.itemTypes.MATERIAL) {
        page =  ENUMS.PlayerStatus.STASH_TAB_MATERIALS;
        if (item.getStatus(ENUMS.ItemStatus.STACK_SIZE) === 0) {
            item.setStatusKey(ENUMS.ItemStatus.STACK_SIZE, Math.floor(MATH.randomBetween(5, 1000)))
        }

    } else if (itemType === ENUMS.itemTypes.CURRENCY) {
        page =  ENUMS.PlayerStatus.STASH_TAB_CURRENCIES;
        if (item.getStatus(ENUMS.ItemStatus.STACK_SIZE) === 0) {
            item.setStatusKey(ENUMS.ItemStatus.STACK_SIZE, Math.floor(MATH.randomBetween(5, 1000)))
        }
    } else if (itemType === ENUMS.itemTypes.LORE) {
        page =  ENUMS.PlayerStatus.STASH_TAB_LORE
    } else if (itemType === ENUMS.itemTypes.RECIPE) {
        console.log("Stash Recipe", item);
        page =  ENUMS.PlayerStatus.STASH_TAB_CRAFT
    } else {
        if (typeof (item.config['equip_slot']) !== 'string') {
            console.log("No stash tab defined for item ", item);
        }
    }

    let itemStash = getPlayerStatus(ENUMS.PlayerStatus[page]) || [];

    if (itemStash.indexOf(itemId) === -1) {
        itemStash.push(itemId);
    } else {
        console.log("Double stash same itemId not ok", item);
        return;
    }

    item.setStatusKey(ENUMS.ItemStatus.EQUIPPED_SLOT, 'STASH_SLOT_'+itemStash.indexOf(itemId))
    setPlayerStatus(ENUMS.PlayerStatus[page], itemStash);

    saveItemStatus(item.getStatus())
    loadStashItem(item)

    if (itemType !== ENUMS.itemTypes.RECIPE) {
        getItemRecipe(item, stashItem);
    }

}




function stashAllConfigItems() {
    let configs = getItemConfigs();
    console.log("Item Configs ", configs);

    for (let key in configs) {
        let cfg = configs[key]
        if (typeof(cfg['visual_id']) === 'string') {
            let templateId = key;
            evt.dispatch(ENUMS.Event.LOAD_ITEM,  {id: templateId, callback:stashItem})
        }
    }

}

let stashViewState = {};
stashViewState[ENUMS.PlayerStatus.ACTIVE_STASH_TAB] = null;
stashViewState[ENUMS.PlayerStatus.ACTIVE_STASH_FILTERS] = [];
stashViewState[ENUMS.PlayerStatus.ACTIVE_STASH_SUBPAGE] = null;
stashViewState[ENUMS.PlayerStatus.SLOTS_PER_PAGE] = null;
let viewStashItems = [];

function checkUpdate() {
    let update = false;
    for (let key in stashViewState) {
        let state = getPlayerStatus(ENUMS.PlayerStatus[key]);
        if (key === ENUMS.PlayerStatus.ACTIVE_STASH_FILTERS) {
            for (let i = 0; i < state.length; i++) {
                if (state[i] !== stashViewState[key][i]) {
                    update = true;
                }
            }
        } else if (state !== stashViewState[key]) {
            update = true;
            stashViewState[key] = state;
        }
    }

    if (update === true) {
        MATH.emptyArray(stashViewState[ENUMS.PlayerStatus.ACTIVE_STASH_FILTERS])
        MATH.copyArrayValues(getPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_FILTERS), stashViewState[ENUMS.PlayerStatus.ACTIVE_STASH_FILTERS])

    }

    return update;
}

function fetchActiveStashPageItems(store) {
    let currentTab = getPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_TAB)
    let slotsPerPage = getPlayerStatus(ENUMS.PlayerStatus.SLOTS_PER_PAGE)
    let subpageIndex = getPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_SUBPAGE)
    let activeFilters = getPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_FILTERS)
    let itemIds = getPlayerStatus(ENUMS.PlayerStatus[currentTab]);

    let update = checkUpdate();

    if (update === true) {
        while (viewStashItems.length) {
            MATH.splice(store, viewStashItems.pop());
        }

        let startIndex = subpageIndex*slotsPerPage;
        let matchedCount = 0;
        for (let i = 0; i < itemIds.length; i++) {
            let id=itemIds[i];
            if (id !== "" && matchedCount < startIndex+slotsPerPage) {
                matchedCount++;
                if (matchedCount > startIndex) {
                    let item = GameAPI.getItemById(itemIds[i])
                    if (item !== null) {
                        viewStashItems.push(item);
                    }
                }
            }
        }

    }
    for (let i = 0; i < viewStashItems.length; i++) {
        store.push(viewStashItems[i])
    }
    return update;
}

export {stashAllConfigItems,
    fetchActiveStashPageItems
}