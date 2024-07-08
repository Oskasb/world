import {detachConfig, saveWorldModelEdits} from "./ConfigUtils.js";
import {getPlayerStatus} from "./StatusUtils.js";
import {ENUMS} from "../ENUMS.js";
import {getPlayerActor} from "./ActorUtils.js";


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

function itemListHasEstateDeed(estate, itemList) {
    let estWorldLevel = estate.call.getStatusWorldLevel();
    let estWPos = estate.call.getStatusPos();
    let checkSum = MATH.stupidChecksumArray(estWPos)

    for (let i = 0; i < itemList.length; i++) {
        let item = GameAPI.getItemById(itemList[i]);
        if (item.getStatus(ENUMS.ItemStatus.ITEM_TYPE) === ENUMS.itemTypes.DEED) {
            let wLevel = item.getStatus(ENUMS.ItemStatus.WORLD_LEVEL);
            if (wLevel === estWorldLevel) {
                let deedChecksum = MATH.stupidChecksumArray(item.getStatus(ENUMS.ItemStatus.POS))
                if (checkSum === deedChecksum) {
                    return estate;
                }
            }
        }
    }
    return false;
}

function hasEstateDeed(actor, estate) {

    let invItemIDs = actor.getStatus(ENUMS.ActorStatus.INVENTORY_ITEMS);
    let deedEstate = itemListHasEstateDeed(estate, invItemIDs);

    if (deedEstate === false) {
        deedEstate = itemListHasEstateDeed(estate, getPlayerStatus(ENUMS.PlayerStatus.STASH_TAB_HOUSING));
    }

    return deedEstate;
}

function isPlayerManagedEstate(estate) {
    return hasEstateDeed(getPlayerActor(), estate);
}

function canBuildConstructionKit(item, actor) {
    let iwl = item.getStatus(ENUMS.ItemStatus.WORLD_LEVEL)
    if (iwl !== actor.getStatus(ENUMS.ActorStatus.WORLD_LEVEL)) {
        return false;
    }

    let activeEstate = GameAPI.worldModels.getActiveEstateAtPosition(actor.getPos())
    if (!activeEstate) {
        return false;
    } else {
        return isPlayerManagedEstate(activeEstate)
    }

}

export {
    createByTemplate,
    canBuildConstructionKit,
    isPlayerManagedEstate

}