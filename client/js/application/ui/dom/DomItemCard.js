import {HtmlElement} from "./HtmlElement.js";
import {ENUMS} from "../../ENUMS.js";
import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {
    getItemMaxPotency,
    getItemMaxRank,
    getItemPotencySlotCount,
    getItemRankSlotCount,
    getVisualConfigByVisualId,
    getVisualConfigIconClass, styleIconDivByTemplateId, updateItemProgressUiStatus, updatePotencyDivs, updateRankDivs
} from "../../utils/ItemUtils.js";
import {saveItemStatus} from "../../setup/Database.js";
import {getItemRecipe} from "../../utils/CraftingUtils.js";
import {getStashItemCountByTemplateId} from "../../utils/StashUtils.js";

let activeDomItems = [];




class DomItemCard {
    constructor() {

        let htmlElement = new HtmlElement();
        let item = null;
        let targetElement = null;
        let targetRoot = null;
        let rootElement = null;

        let potencyContainer = null;
        let rankContainer = null;
        let dynDivs = [];
        let potencyDivs = [];
        let rankDivs = [];

        let statusMap = {   }





        function updateCardPosition() {
            let bodyRect = DomUtils.getWindowBoundingRect();
            let rootRect = targetRoot.getBoundingClientRect();
            let elemRect = targetElement.getBoundingClientRect();

            let width = elemRect.width;
            let height = elemRect.height;

            let pTop  = bodyRect.height - rootRect.top - bodyRect.top;
            if (pTop > bodyRect.height*0.5) {
                pTop -= (rootRect.height*2+height*2);
            }


            let pLeft = elemRect.left + rootRect.left - bodyRect.left;

            if (pLeft > bodyRect.width * 0.5) {
                pLeft -= (rootRect.width*2 - width)
            } else {
                pLeft += rootRect.width*2
            }

            setTargetCoordinates(pTop, pLeft)
        }


        let update = function() {
            if (targetRoot === null) {
                return;
            }

            let rootSize = DomUtils.rootFontSize()
            if ( rootElement.style.fontSize !== rootSize) {
                rootElement.style.fontSize = rootSize;
            }

        //    statusMap['PALETTE_VALUES'] = item.getStatus(ENUMS.ItemStatus.PALETTE_VALUES);

            updateCardPosition()
            updateItemProgressUiStatus(item, statusMap, rankContainer, rankDivs, potencyContainer, potencyDivs)

            if (item.visualItem !== null) {
                let instance = item.visualItem.call.getInstance()

                if (instance !== null) {
                    let modelPalette = item.visualItem.call.getPalette()

                    modelPalette.setFromValuearray(statusMap['PALETTE_VALUES']);
                    modelPalette.applyPaletteToInstance(instance)
                }
            }

        }

        let rebuild = function() {
            clearIframe();
        //    setTimeout(function() {
                setItem(item);
                setTargetElement(targetElement, targetRoot);
         //   }, 500)
        }

        let paletteEdit = null;

        let paletteEditReady = function(ple) {

            console.log("paletteEditReady", ple)
        }



        let editPalette = function() {

        //    let palette = item.getStatus(ENUMS.ItemStatus.PALETTE_VALUES);

            if (paletteEdit !== null) {
                paletteEdit.closeDomPalette()
                poolReturn(paletteEdit);
                paletteEdit = null;
                item.status.call.pulseStatusUpdate();
                saveItemStatus(item.status.statusMap);
                // item.setStatusKey(ENUMS.ItemStatus.PALETTE_VALUES, statusMap['PALETTE_VALUES'])
                return;
            } else {
                paletteEdit = poolFetch('DomPalette');
                paletteEdit.initDomPalette(statusMap['PALETTE_VALUES'], paletteEditReady, editPalette)
            }

        }





        function activateRankUp() {
            let rank = item.getStatus(ENUMS.ItemStatus.ITEM_RANK)
            let echelon = item.getStatus(ENUMS.ItemStatus.RANK_ECHELON);

            let maxSlots = getItemRankSlotCount(item);

            if (echelon < maxSlots) {
                console.log("activateRankUp", item);
                item.setStatusKey(ENUMS.ItemStatus.RANK_ECHELON, echelon+1);
            } else {
                let maxRank = getItemMaxRank(item);
                if (rank < ENUMS.echelon['ECHELON_'+maxRank]) {
                    item.setStatusKey(ENUMS.ItemStatus.RANK_ECHELON, 0);
                    item.setStatusKey(ENUMS.ItemStatus.ITEM_RANK, rank+1);
                } else {
                    console.log("Item Rank progress Max reached")
                    let empowerDiv = htmlElement.call.getChildElement("rank_up");
                    empowerDiv.style.pointerEvents = 'none'
                    empowerDiv.innerHTML = 'MAX';
                }
            }
            saveItemStatus(item.getStatus())
        }

        function activateEmpower() {

            let potency = item.getStatus(ENUMS.ItemStatus.ITEM_POTENCY)
            let echelon = item.getStatus(ENUMS.ItemStatus.POTENCY_ECHELON);

            let maxSlots = getItemPotencySlotCount(item);

            if (echelon < maxSlots) {
                console.log("activateRankUp", item);
                item.setStatusKey(ENUMS.ItemStatus.POTENCY_ECHELON, echelon+1);
            } else {
                let maxRank = getItemMaxPotency(item);
                if (potency < ENUMS.echelon['ECHELON_'+maxRank]) {
                    item.setStatusKey(ENUMS.ItemStatus.POTENCY_ECHELON, 0);
                    item.setStatusKey(ENUMS.ItemStatus.ITEM_POTENCY, potency+1);
                } else {
                    console.log("Item Rank progress Max reached")
                    let empowerDiv = htmlElement.call.getChildElement("empower");
                    empowerDiv.style.pointerEvents = 'none'
                    empowerDiv.innerHTML = 'MAX';
                }
            }
            saveItemStatus(item.getStatus())
        }

        let readyCb = function() {
            rootElement = htmlElement.call.getRootElement();
            rootElement.style.scale = 0.3;
            let bodyRect = DomUtils.getWindowBoundingRect();
            let width = bodyRect.width;
            let height = bodyRect.height;
            setTargetCoordinates(height*0.5,width *0.5)
            let container = htmlElement.call.getChildElement('container')
            let panel = htmlElement.call.getChildElement('item_card_panel')
            container.style.visibility = "visible";
            container.style.display = "";
        //    DomUtils.addClickFunction(container, rebuild)

            potencyContainer = htmlElement.call.getChildElement('container_item_potency')
            rankContainer = htmlElement.call.getChildElement('container_item_rank')

            let rankUpDiv = htmlElement.call.getChildElement("rank_up");
            let empowerDiv = htmlElement.call.getChildElement("empower");
            DomUtils.addClickFunction(rankUpDiv, activateRankUp);
            DomUtils.addClickFunction(empowerDiv, activateEmpower);

            let paramText = htmlElement.call.getChildElement("param_TEXT");
            let paramEquipSlot = htmlElement.call.getChildElement("param_EQUIPPED_SLOT");
            let paramModifiers = htmlElement.call.getChildElement("param_MODIFIERS");
            let paramPalVals = htmlElement.call.getChildElement("param_PALETTE_VALUES");
            let paramRank = htmlElement.call.getChildElement("param_RANK");
            let paramPotency = htmlElement.call.getChildElement("param_POTENCY");

            let paramRecIngredients = htmlElement.call.getChildElement("param_INGREDIENTS");
            let paramCraft = htmlElement.call.getChildElement("param_CRAFT");
            if (typeof(item.config['equip_slot']) !== 'string' ) {
                paramRank.style.display = 'none'
                paramPotency.style.display = 'none'
                paramEquipSlot.style.display = 'none'
                paramPalVals.style.display = 'none'
                paramModifiers.style.display = 'none'
                paramRecIngredients.style.display = 'none'
                paramCraft.style.display = 'none'
            } else if (item.getStatus(ENUMS.ItemStatus.ITEM_TYPE) === ENUMS.itemTypes.RECIPE) {
                paramRank.style.display = 'none'
                paramPotency.style.display = 'none'
                paramPalVals.style.display = 'none'

                let ingredients = getItemRecipe(item).getIngredients();
                if (ingredients.length !== 0) {
                    let container = htmlElement.call.getChildElement("container_ingredients");
                    for (let i = 0; i < ingredients.length; i++) {
                        let div = DomUtils.createDivElement(container, 'ingredients_'+i, '', 'ingredient_icon_frame')
                        styleIconDivByTemplateId(div, ingredients[i].templateId)
                        //    let iHtml = '<h4>'+ingredients[i].templateId+'</h4>';
                        let count = getStashItemCountByTemplateId(ingredients[i].templateId);
                        let iHtml = '<h2>'+ingredients[i].amount+'</h2>'
                        iHtml += '<p>/</p>'
                        iHtml += '<h3>'+count+'</h3>'
                        let textDiv = DomUtils.createDivElement(div, 'label_'+i, iHtml, "ingredient_icon_label")

                    //    div.innerHTML = iHtml;
                    }
                } else {
                    paramRecIngredients.style.display = 'none'
                }

            } else {
                paramRecIngredients.style.display = 'none'
                paramCraft.style.display = 'none'
                let maxRank = getItemMaxRank(item);
                let maxPotency = getItemMaxPotency(item);
                if (maxRank === ENUMS.echelon.ECHELON_0) {
                    paramRank.style.display = 'none'
                }
                if (maxPotency === ENUMS.echelon.ECHELON_0) {
                    paramPotency.style.display = 'none'
                }
            }

            if (item.getStatus(ENUMS.ItemStatus.TEXT) === "") {
                paramText.style.display = 'none';
            }



            let paletteDiv = htmlElement.call.getChildElement("palette_edit");
            if (statusMap['PALETTE_VALUES'].length) {
                console.log(statusMap['PALETTE_VALUES'])
                DomUtils.addClickFunction(paletteDiv, editPalette);
            } else {
                paletteDiv.style.display = "none";
            }

        //    let slotId = item.getStatus(ENUMS.ItemStatus.EQUIPPED_SLOT);
            let backplate = htmlElement.call.getChildElement("backplate");

            let itemDiv = htmlElement.call.getChildElement("item_icon");

            let visualConfig = getVisualConfigByVisualId(item.config['visual_id'])
            let iconClass = getVisualConfigIconClass(visualConfig);

            if (!iconClass) {
                iconClass = 'NYI_ICON'
            }

            let rarity = item.getStatus(ENUMS.ItemStatus.RARITY);
            DomUtils.addElementClass(panel, rarity);
            DomUtils.addElementClass(backplate, rarity);
            DomUtils.addElementClass(itemDiv, iconClass);
            ThreeAPI.registerPrerenderCallback(update);
        }

        let setItem = function(itm, closeItemCard) {
            item = itm;
            statusMap['ITEM_ID'] = item.getStatus(ENUMS.ItemStatus.ITEM_ID);
            statusMap['TEMPLATE'] = item.getStatus(ENUMS.ItemStatus.TEMPLATE);
            statusMap['NAME'] = item.getStatus(ENUMS.ItemStatus.NAME);
            statusMap['ITEM_LEVEL'] = item.getStatus(ENUMS.ItemStatus.ITEM_LEVEL);
            statusMap['ITEM_TYPE'] = item.getStatus(ENUMS.ItemStatus.ITEM_TYPE);
            statusMap['QUALITY'] = item.getStatus(ENUMS.ItemStatus.QUALITY);
            statusMap['RARITY'] = item.getStatus(ENUMS.ItemStatus.RARITY);
            statusMap['ACTIVATION_STATE'] = item.getStatus(ENUMS.ItemStatus.ACTIVATION_STATE);
            statusMap['EQUIPPED_SLOT'] = item.getStatus(ENUMS.ItemStatus.EQUIPPED_SLOT);
            statusMap['PALETTE_VALUES'] = item.getStatus(ENUMS.ItemStatus.PALETTE_VALUES);
            statusMap['MODIFIERS'] = item.getStatus(ENUMS.ItemStatus.MODIFIERS);
            statusMap['SLOT_ID'] = item.getEquipSlotId()
            statusMap['ITEM_RANK'] = -1;
            statusMap['ITEM_POTENCY'] = -1;
            statusMap['RANK_ECHELON'] = -1;
            statusMap['POTENCY_ECHELON'] = -1;
            statusMap['INGREDIENTS'] = getItemRecipe(item).getIngredients();
            statusMap['TEXT'] = item.getStatus(ENUMS.ItemStatus.TEXT) || "";
            htmlElement.initHtmlElement('item_card', closeItemCard, statusMap, 'item_card', readyCb);
        }

        let getItem = function() {
            return item;
        }

        let setTargetCoordinates = function(bottom, left) {
            rootElement.style.transform = "translate3d(-50%, 0, 0)";
            rootElement.style.bottom = bottom+'px';
            rootElement.style.left = left+'px';
        }

        let setTargetElement = function(target, root) {
            targetElement = target;
            targetRoot = root;
        }

        let clearIframe = function() {
            htmlElement.closeHtmlElement();
        //    console.log("Clear DomItem ", htmlElement)
            let rootElem = htmlElement.call.getRootElement()
            if (rootElem) {
                DomUtils.removeDivElement(rootElem);
            }
        }

        let close = function() {
            DomUtils.clearDivArray(dynDivs);
            DomUtils.clearDivArray(potencyDivs);
            DomUtils.clearDivArray(rankDivs);
            item = null;
            ThreeAPI.unregisterPrerenderCallback(update);
            clearIframe();
        }

        this.call = {
            setItem:setItem,
            getItem:getItem,
            setTargetElement:setTargetElement,
            close:close
        }

    }


}



export {DomItemCard}