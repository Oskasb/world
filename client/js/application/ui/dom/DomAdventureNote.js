import {HtmlElement} from "./HtmlElement.js";
import {poolReturn} from "../../utils/PoolUtils.js";

let noticeQueue = [];

function clearDivArray(array) {
    while(array.length) {
        DomUtils.removeDivElement(array.pop());
    }
}

class DomAdventureNote {
    constructor() {

        let worldAdventure = null;

        let closeTimeout = null;
        if (closeTimeout !== null) {
            clearTimeout(closeTimeout);
            closeTimeout = null;
        }


        let htmlElement = new HtmlElement();

        let nodesContainer;

        let statusMap = {
            selected:false
        }
        let sortingIndex = -1;

        let closeCb = function () {
            console.log("Close...")
        }

        let container;

        let rootElement = null;

        let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();



        let applySelect = function() {

            let selectedAdv = GameAPI.gameAdventureSystem.call.getSelectedAdventure();
            if (selectedAdv === worldAdventure) {
                GameAPI.gameAdventureSystem.call.setSelectedAdventure(null)
            } else {
                GameAPI.gameAdventureSystem.call.setSelectedAdventure(worldAdventure)
            }

        }

        function applySelected(bool) {
            if (bool) {
                statusMap.selected = true;
                DomUtils.addElementClass(container, 'adventure_panel_selected')
            } else {
                statusMap.selected = false;
                DomUtils.removeElementClass(container, 'adventure_panel_selected')
            }
        }

        let nodeIndicatorDivs = [];



        function attachNodeIndicators() {
            clearDivArray(nodeIndicatorDivs)

            let nodes = worldAdventure.adventureNodes;

            for (let i = 0; i < nodes.length; i++) {
                DomUtils.createDivElement(nodesContainer, worldAdventure.id+'_node_'+i, '', 'adventure_node_indicator')
            }

        }

            let readyCb = function () {
                rootElement = htmlElement.call.getRootElement()
                container = htmlElement.call.getChildElement('notice_container')
                nodesContainer = htmlElement.call.getChildElement('nodes_container')
                attachNodeIndicators();
            //    DomUtils.addElementClass(container, statusMap.rarity)
                let header = htmlElement.call.getChildElement('header')
                DomUtils.addClickFunction(container, applySelect)
                ThreeAPI.registerPrerenderCallback(update);
            }

            let rebuild // = htmlElement.initHtmlElement('loot_notice', closeCb, statusMap, 'loot_notice', readyCb);


            let activate = function() {
                lastSortIdx = -1;
                rebuild = htmlElement.initHtmlElement('adventure_note', null, statusMap, 'adventure_note', readyCb);
                statusMap.header = worldAdventure.config.name || worldAdventure.id;
                htmlElement.showHtmlElement();
            }

            let lastSortIdx = -1;
            let idxOffset = 60;


            let update = function () {

                if (lastSortIdx !== sortingIndex) {
                    lastSortIdx = sortingIndex;
                    let offset = sortingIndex * idxOffset;
                    rootElement.style.top = offset +  270 + 'em'
                }

                statusMap.distance = MATH.numberToDigits(worldAdventure.call.getCursorDistance(), 1, 1)+'m'
                let lvl = worldAdventure.config.level || '??';
                statusMap.level = 'Level: ' + lvl

                let selectedAdv = GameAPI.gameAdventureSystem.call.getSelectedAdventure();
                if (selectedAdv !== worldAdventure) {
                    if (statusMap.selected === true) {
                        applySelected(false);
                    }
                } else  {
                    if (statusMap.selected === false) {
                        applySelected(true);
                    }
                }


            }

        let clearIframe = function() {
            htmlElement.closeHtmlElement()
            poolReturn(this);
        }.bind(this)

        let close = function () {
            ThreeAPI.unregisterPrerenderCallback(update);
            htmlElement.hideHtmlElement()
            closeTimeout = setTimeout(clearIframe,1500)
            clearDivArray(nodeIndicatorDivs)
        }.bind(this);

        let setSortingIndex = function(idx) {
            sortingIndex = idx;
        }


        let setWorldAdventure = function(wAdv) {
            worldAdventure = wAdv;
            activate()
        }

        let getWorldAdventure = function() {
            return worldAdventure;
        }

        this.call = {
            close: close,
            setWorldAdventure:setWorldAdventure,
            getWorldAdventure:getWorldAdventure,
            setSortingIndex:setSortingIndex
        }
    }


}

export { DomAdventureNote }