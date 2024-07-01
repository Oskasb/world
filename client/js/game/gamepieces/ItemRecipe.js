

function computeAmount(weight) {
    return weight;
}

function computeComponent(itemConfig, compData, rscHcrConfig) {

    let mat = compData.material
    let matReqList = rscHcrConfig['material_requirement_lists'][mat];
    let materialKey = matReqList[0];
    let compKey = compData.component;
    let recipeComponent = rscHcrConfig['components'][compKey][materialKey];

    let amount = computeAmount(compData.weight)

    return {
        templateId: recipeComponent,
        amount: amount
    }

}

function computeIngredients(itemConfig, components, rscHcrConfig, ingredients) {
    for (let i = 0; i < components.length; i++) {
        ingredients.push(computeComponent(itemConfig, components[i], rscHcrConfig))
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