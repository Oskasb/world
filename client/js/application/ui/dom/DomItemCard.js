import {HtmlElement} from "./HtmlElement.js";
import {ENUMS} from "../../ENUMS.js";
import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {
    getItemMaxPotency,
    getItemMaxRank, getItemPotencyIndicatorLevelFill, getItemPotencySlotCount,
    getItemRankIndicatorLevelFill, getItemRankSlotCount,
    getVisualConfigByVisualId,
    getVisualConfigIconClass
} from "../../utils/ItemUtils.js";
import {saveItemStatus} from "../../setup/Database.js";

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

        let statusMap = {
            ITEM_RANK:0,
            ITEM_POTENCY: 0
        }


        function updateRankDivs() {

                let levelFill = getItemRankIndicatorLevelFill(item);
                let indicatorLevel = levelFill.level;
                let filledIndicators = levelFill.fill;

                for (let i = 0; i < rankDivs.length; i++) {
                    let iconClass = 'rank_'+indicatorLevel;
                    if (i < filledIndicators) {
                        iconClass+='_set'
                    } else {
                        iconClass+='_unset'
                    }

                    if (rankDivs[i].indicatorClass !== iconClass) {
                        if (typeof (rankDivs[i].indicatorClass) === 'string') {
                            DomUtils.removeElementClass(rankDivs[i], rankDivs[i].indicatorClass)
                        }
                        rankDivs[i].indicatorClass = iconClass
                        DomUtils.addElementClass(rankDivs[i], rankDivs[i].indicatorClass)
                    }
                }

        }


        function updatePotencyDivs() {

                let levelFill = getItemPotencyIndicatorLevelFill(item);
                let indicatorLevel = levelFill.level;
                let filledIndicators = levelFill.fill;

                for (let i = 0; i < potencyDivs.length; i++) {
                    let iconClass = 'icon_potency';
                    if (i < filledIndicators) {
                        iconClass+='_set_'
                    } else {
                        iconClass+='_unset_'
                    }
                    iconClass+=indicatorLevel

                    if (potencyDivs[i].indicatorClass !== iconClass) {
                        if (typeof (potencyDivs[i].indicatorClass) === 'string') {
                            DomUtils.removeElementClass(potencyDivs[i], potencyDivs[i].indicatorClass)
                        }
                        potencyDivs[i].indicatorClass = iconClass
                        DomUtils.addElementClass(potencyDivs[i], potencyDivs[i].indicatorClass)
                    }
                }
            }


        let update = function() {
            if (targetRoot === null) {
                return;
            }
            let bodyRect = DomUtils.getWindowBoundingRect();
            let rootRect = targetRoot.getBoundingClientRect();
            let elemRect = targetElement.getBoundingClientRect();

            let width = elemRect.width;
            let height = elemRect.height;

            let pTop  = bodyRect.height - rootRect.top - bodyRect.top;
            let pLeft = elemRect.left + rootRect.left - bodyRect.left;

            rootElement.style.fontSize = DomUtils.rootFontSize();
        //    statusMap['PALETTE_VALUES'] = item.getStatus(ENUMS.ItemStatus.PALETTE_VALUES);

            let rank = item.getStatus(ENUMS.ItemStatus.ITEM_RANK)
            if (statusMap['ITEM_RANK'] !== rank) {
                statusMap['ITEM_RANK'] = rank
                updateRankDivs()
            }

            let potency = item.getStatus(ENUMS.ItemStatus.ITEM_POTENCY)
            if (statusMap['ITEM_POTENCY'] !== potency) {
                statusMap['ITEM_POTENCY'] = potency
                updatePotencyDivs()
            }

            if (item.visualItem !== null) {
                let instance = item.visualItem.call.getInstance()

                if (instance !== null) {
                    let modelPalette = item.visualItem.call.getPalette()

                    modelPalette.setFromValuearray(statusMap['PALETTE_VALUES']);
                    modelPalette.applyPaletteToInstance(instance)
                }
            }



            setTargetCoordinates(pTop, pLeft+width*0.5)
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

        let rankSlots = 0;
        let potencySlots = 0;

        function attachPotencySlots() {
            for (let i = 0; i < potencySlots; i++) {
                let div = DomUtils.createDivElement(potencyContainer, 'potency_slot_'+i, '', 'item_potency_slot')
                potencyDivs.push(div);
            }
        }
        function attachRankSlots() {
            for (let i = 0; i < rankSlots; i++) {
                let div = DomUtils.createDivElement(rankContainer, 'rank_slot_'+i, '', 'item_rank_slot')
                rankDivs.push(div);
            }
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
            attachPotencySlots()
            attachRankSlots()


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
            potencySlots = getItemPotencySlotCount(item);
            rankSlots = getItemRankSlotCount(item);
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