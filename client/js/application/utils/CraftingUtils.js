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

function getItemRecipe(item) {
    if (resourceHierarchyConfig) {
        let templateId = item.getStatus(ENUMS.ItemStatus.TEMPLATE);
        if (!recipes[templateId]) {
            recipes[templateId] = generateItemRecipe(templateId, item.config);
        }
        return recipes[templateId];
    }
}


export {
    applyResourceHierarchy,
    getItemRecipe,
    generateItemRecipe
}