import {HtmlElement} from "./HtmlElement.js";
import {ENUMS} from "../../ENUMS.js";
import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {
    getItemMaxPotency,
    getItemMaxRank,
    getItemPotencySlotCount,
    getItemRankSlotCount,
    getVisualConfigByVisualId,
    getVisualConfigIconClass, updateItemProgressUiStatus, updatePotencyDivs, updateRankDivs
} from "../../utils/ItemUtils.js";
import {saveItemStatus} from "../../setup/Database.js";
import {getItemRecipe} from "../../utils/CraftingUtils.js";

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
            console.log("Clear DomItem ", htmlElement)
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