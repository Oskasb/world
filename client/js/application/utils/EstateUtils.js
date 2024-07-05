import {detachConfig, saveWorldModelEdits} from "./ConfigUtils.js";


function createByTemplate(templateId, pos) {
    console.log("createByTemplate", templateId, pos);
    let loadedTemplates = GameAPI.worldModels.getLoadedTemplates();
    console.log("Selected Model Template ", templateId, loadedTemplates)
    let map = loadedTemplates[templateId];
    let newConfig = detachConfig(map.config);
    newConfig.edit_id = "";
    MATH.vec3ToArray(pos, newConfig.pos, 1);
    let newWmodel = GameAPI.worldModels.addConfigModel(newConfig, newConfig.edit_id)
    MATH.vec3FromArray(newWmodel.getPos(),  newConfig.pos);
    saveWorldModelEdits(newWmodel);
    return newConfig;
}

export {
    createByTemplate
}