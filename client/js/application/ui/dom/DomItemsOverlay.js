import {getPlayerActor} from "../../utils/ActorUtils.js";
import {ENUMS} from "../../ENUMS.js";
import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {fetchActiveStashPageItems} from "../../utils/StashUtils.js";

let items = [];
let domItems = [];
let includedItems = [];

function excludeItemsList(itemsList) {
    while (itemsList.length) {
        let item = itemsList.pop();
        MATH.splice(items, item);
        for (let i = 0; i < domItems.length; i++) {
            if (domItems[i].call.getItem() === item) {
                let domItem =  domItems[i];
                domItem.call.close();
                poolReturn(domItem);
                MATH.splice(domItems, domItem);
            }
        }
    }
}

let removeList = []
function includeItemsList(itemsList) {

    for (let i =0; i < items.length; i++) {
        if (itemsList.indexOf(items[i]) === -1) {
            itemsList.push(items[i])
        }
    }

    while (itemsList.length) {
        let item = itemsList.pop();
        if (items.indexOf(item) === -1) {
            items.push(item);
            let domItem = poolFetch('DomItem');
            domItem.call.setItem(item);
            domItems.push(domItem);
        } else {
            console.log("Item already included... something is bad", item, items)
        }
    }

}

let fetchItems = [];

function getActorCharacterItems(actor, store) {
    actor.actorEquipment.getEquippedItems(store);
}

function getActorInventoryItems(actor, store) {
    actor.actorInventory.fetchInventoryItems(store);
}

function getPlayerStashPageItems(actor, store) {
    fetchActiveStashPageItems(store);
}

let uiStateItems = {};

uiStateItems[ENUMS.UiStates.CHARACTER] = getActorCharacterItems;
uiStateItems[ENUMS.UiStates.INVENTORY] = getActorInventoryItems;
uiStateItems[ENUMS.UiStates.STASH] = getPlayerStashPageItems;

let stateItemLists = {};

function updateActorUiState(actor, uiStateKey, open) {
    MATH.emptyArray(fetchItems);
    actor.actorText.say(uiStateKey +' '+open)
    console.log("updateActorUiState", open, uiStateKey, actor.actorStatus.statusMap);
    let getter = uiStateItems[ENUMS.UiStates[uiStateKey]]

    if (!stateItemLists[uiStateKey]) {
        stateItemLists[uiStateKey] = [];
    }

    if (typeof (getter) === 'function') {
        getter(actor, fetchItems);
        if (open === true) {
            MATH.emptyArray(stateItemLists[uiStateKey]);
            MATH.copyArrayValues(fetchItems, stateItemLists[uiStateKey])
            includeItemsList(fetchItems);
        } else {
            excludeItemsList(stateItemLists[uiStateKey]);
        }

    } else {
        console.log("Not yet supported uiState", uiStateKey)
    }

}

let count = 0;

function renderItemIcons() {
    if (count !== domItems.length) {
        count = domItems.length;
        console.log("render item count", domItems.length)
    }
}

class DomItemsOverlay {
    constructor() {

        let currentStates = [];
        function update() {
            let actor = getPlayerActor();
            if (actor) {
                let uiStates = actor.getStatus(ENUMS.ActorStatus.ACTIVE_UI_STATES);
                if (currentStates.length > uiStates.length) {
                    for (let i=0; i < currentStates.length; i++) {
                        if (uiStates.indexOf(currentStates[i]) === -1) {
                            updateActorUiState(actor, currentStates[i], false)
                            MATH.splice(currentStates, currentStates[i]);
                            i--;
                        }
                    }
                }

                for (let i=0; i < uiStates.length; i++) {
                    if (currentStates.indexOf(uiStates[i]) === -1) {
                        currentStates.push(uiStates[i]);
                        updateActorUiState(actor, uiStates[i], true)
                    }
                }
            }

            renderItemIcons()


        }

        ThreeAPI.registerPrerenderCallback(update);

    }

    overlayItemIcon(item) {

    }



}

export { DomItemsOverlay }