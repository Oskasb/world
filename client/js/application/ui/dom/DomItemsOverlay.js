import {getPlayerActor} from "../../utils/ActorUtils.js";
import {ENUMS} from "../../ENUMS.js";
import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";

let items = [];
let domItems = [];

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

function includeItemsList(itemsList, uiStateKey) {
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

let uiStateItems = {};

uiStateItems[ENUMS.UiStates.CHARACTER] = getActorCharacterItems;
uiStateItems[ENUMS.UiStates.INVENTORY] = getActorInventoryItems;

function updateActorUiState(actor, uiStateKey, open) {
    MATH.emptyArray(fetchItems);
    actor.actorText.say(uiStateKey +' '+open)
    console.log("updateActorUiState", open, uiStateKey, actor.actorStatus.statusMap);
    let getter = uiStateItems[ENUMS.UiStates[uiStateKey]]

    if (typeof (getter) === 'function') {
        getter(actor, fetchItems);
        if (open === true) {
            includeItemsList(fetchItems, uiStateKey);
        } else {
            excludeItemsList(fetchItems);
        }

    } else {
        console.log("Not yet supported uiState", uiStateKey)
    }
}

function renderItemIcons() {
    console.log("render item count", domItems.length)
    for (let i = 0; i < domItems.length; i++) {
        let domItem = domItems[i];
        let item = domItem.call.getItem();

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