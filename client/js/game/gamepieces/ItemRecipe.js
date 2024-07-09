import {detachConfig} from "../../application/utils/ConfigUtils.js";
import {Item} from "./Item.js";
import {getItemConfigByItemId} from "../../application/utils/ItemUtils.js";


function computeAmount(weight, modifiers) {
    let amountBase = MATH.clamp(weight+modifiers['add'], 0, weight+modifiers['add']);
    return amountBase * modifiers['multiply'];
}

function computeComponent(itemConfig, compData, rscHcrConfig) {

    let mat = compData.material
    let matReqList = rscHcrConfig['material_requirement_lists'][mat];
    let compKey = compData.component;
    let reqModKey = rscHcrConfig['requirement_material_modifiers'][compKey];
    let requirementIndex = rscHcrConfig['modifiers'][reqModKey][itemConfig[reqModKey]]
    let materialKey = matReqList[requirementIndex];
    let recipeComponent = rscHcrConfig['components'][compKey][materialKey];

    let amount = compData.weight;

    let templateConfig = getItemConfigByItemId(itemConfig[ENUMS.ItemStatus.TEMPLATE])
    if (templateConfig) {
        let itemSlot = ["equip_slot"]
        if (typeof (itemSlot) === 'string') {
            let slotModifiers = rscHcrConfig['equip_slot_modifiers'][itemSlot]
            amount = computeAmount(amount, slotModifiers)
        }
    }

    return {
        templateId: recipeComponent,
        amount: amount
    }

}

function computeIngredients(itemConfig, components, rscHcrConfig, ingredients) {
    for (let i = 0; i < components.length; i++) {
        let component = computeComponent(itemConfig, components[i], rscHcrConfig)
        if (component.amount > 0) {
            ingredients.push(component)
        }
    }
}

function attachIngredients(config, rscHcrConfig, ingredients) {
    if (!config[ENUMS.ItemStatus.ITEM_TYPE]) {
        console.log("No ITEM_TYPE for item config", config);
        return;
    }
    let itemType = config[ENUMS.ItemStatus.ITEM_TYPE];
    let matComps = rscHcrConfig["item_type_material_components"];
    if (matComps[itemType]) {
        computeIngredients(config, matComps[itemType], rscHcrConfig, ingredients)
    }
}

class ItemRecipe {

    constructor(templateId, config, resourceHierarchyConfig) {
        let ingredients = [];
        this.ingredients = ingredients;
        if (config['status']) {
            attachIngredients(config['status'], resourceHierarchyConfig, ingredients)
            if (ingredients.length !== 0) {
                let recipeId = 'RECIPE_'+templateId;
                config.edit_id = recipeId;
                let recipeStatus = detachConfig(config);
                this.item = new Item(templateId, recipeStatus)
                this.item.config = recipeStatus;
                this.item.id = recipeId;
                this.item.setStatusKey(ENUMS.ItemStatus.ITEM_ID, recipeId)
                this.item.setStatusKey(ENUMS.ItemStatus.ITEM_TYPE, ENUMS.itemTypes.RECIPE)
            }
        } else {
            console.log("No config.status in template item", templateId, config);
        }

        function getIngredientsList() {
            return ingredients;
        }

        this.call = {
            getIngredientsList:getIngredientsList
        }

    }

    getIngredients() {
        return this.call.getIngredientsList();
    }

}

export { ItemRecipe }