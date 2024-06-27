import {getReversedConfigs} from "./ConfigUtils.js";
import {getItemConfigs} from "./ActorUtils.js";
import {getPlayerStatus, setPlayerStatus} from "./StatusUtils.js";
import {ENUMS} from "../ENUMS.js";
import {loadItemStatus, saveItemStatus, savePlayerStatus} from "../setup/Database.js";
import {evt} from "../event/evt.js";


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

    let page = ENUMS.PlayerStatus.STASH_PAGE_ITEMS;
    if (itemType === ENUMS.itemTypes.MATERIAL) {
        page =  ENUMS.PlayerStatus.STASH_PAGE_MATERIALS
    } else if (itemType === ENUMS.itemTypes.CURRENCY) {
        page =  ENUMS.PlayerStatus.STASH_PAGE_CURRENCIES
    } else if (itemType === ENUMS.itemTypes.LORE) {
        page =  ENUMS.PlayerStatus.STASH_PAGE_LORE
    }

    let itemStash = getPlayerStatus(ENUMS.PlayerStatus[page]) || [];

    itemStash.push(itemId);
    item.setStatusKey(ENUMS.ItemStatus.EQUIPPED_SLOT, 'STASH_SLOT_'+itemStash.indexOf(itemId))
    setPlayerStatus(ENUMS.PlayerStatus[page], itemStash);
    loadStashItem(item)
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


function fetchActiveStashPageItems(store) {
    let currentPage = ENUMS.PlayerStatus.STASH_PAGE_ITEMS

    let itemIds = getPlayerStatus(ENUMS.PlayerStatus[currentPage]);

    for (let i = 0; i < itemIds.length; i++) {
        let id=itemIds[i];
        if (id !== "") {
            let item = GameAPI.getItemById(itemIds[i])
            store.push(item);
        }
    }
}

export {stashAllConfigItems,
    fetchActiveStashPageItems
}