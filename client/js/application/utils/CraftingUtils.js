import {ENUMS} from "../ENUMS.js";
import {ItemRecipe} from "../../game/gamepieces/ItemRecipe.js";

let resourceHierarchyConfig;

let recipes = {};

function applyResourceHierarchy(cfg) {
    resourceHierarchyConfig = cfg;
}


function generateItemRecipe(templateId, config) {
   return new ItemRecipe(templateId, config, resourceHierarchyConfig)
}

function getItemRecipe(item, recipeCallback) {
    if (!item.config) {
        console.log("No config for item:", item)
        return;

    }
    if (resourceHierarchyConfig) {
        let templateId = item.getStatus(ENUMS.ItemStatus.TEMPLATE);
        if (!recipes[templateId]) {
            recipes[templateId] = generateItemRecipe(templateId, item.config);
        }
        if (recipes[templateId].item) {
            if (typeof (recipeCallback) === 'function') {
                recipeCallback(recipes[templateId].item)
            }

        }
        return recipes[templateId];
    }
}


export {
    applyResourceHierarchy,
    getItemRecipe,
    generateItemRecipe
}