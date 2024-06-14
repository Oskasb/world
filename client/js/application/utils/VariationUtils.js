import {applyVariation} from "./DebugUtils.js";


function applyVariationModifiers(modifier, data) {
    for (let key in modifier) {
        data[key] = modifier[key];
        console.log("Modifier applied ", modifier, data)
    }
}

function applyVariationToData(varId, data) {
    for (let key in data) {
        if (key === 'variation') {

            if (data[key].id === varId) {
                let modifiers = data[key]['modify']

                console.log("Variation modifiers", modifiers)
                for (let i = 0; i < modifiers.length; i++) {
                    applyVariationModifiers(modifiers[i], data)
                }
            }
        } else {
            if (typeof (data[key]) === 'object') {
                applyVariationToData(varId, data[key])
            }
        }
    }
}

function processJsonVariation(data, activeVariations) {
    let activeData = data;

    for (let i = 0; i < activeVariations.length; i++) {
        let id = activeVariations[i];
        let apply = applyVariation(id)
        if (apply === true) {
            applyVariationToData(id, activeData);
        }
    }

    return activeData;
}

export {processJsonVariation}