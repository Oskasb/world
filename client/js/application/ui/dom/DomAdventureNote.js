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
            selected:false,
            active:false,
            sortindex:-1
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


        function applyActive(bool)  {
            if (bool) {
                statusMap.active = true;
                DomUtils.addElementClass(container, 'adventure_panel_active')
                closeAnchor.style.display = "";
            } else {
                statusMap.active = false;
                DomUtils.removeElementClass(container, 'adventure_panel_active')
                closeAnchor.style.display = "none";
            }
        }

        let nodeIndicatorDivs = [];


        let nodes = null;
        function attachNodeIndicators() {
            clearDivArray(nodeIndicatorDivs)



            for (let i = 0; i < nodes.length; i++) {
                let div = DomUtils.createDivElement(nodesContainer, worldAdventure.id+'_node_'+i, '', 'adventure_node_indicator')
                nodeIndicatorDivs.push(div);
            }

        }

        let closeAnchor;

            let readyCb = function () {
                rootElement = htmlElement.call.getRootElement()
                closeAnchor =  htmlElement.call.getChildElement('anchor_close')
                closeAnchor.style.display = "none";
                container = htmlElement.call.getChildElement('notice_container')
                nodesContainer = htmlElement.call.getChildElement('nodes_container')
            //    DomUtils.addElementClass(container, statusMap.rarity)
                let header = htmlElement.call.getChildElement('header')
                DomUtils.addClickFunction(container, applySelect)
                ThreeAPI.registerPrerenderCallback(update);
            }

            let rebuild // = htmlElement.initHtmlElement('loot_notice', closeCb, statusMap, 'loot_notice', readyCb);


            let activate = function() {
                lastSortIdx = -1;
                statusMap.selected = false;
                statusMap.active = false;
                rebuild = htmlElement.initHtmlElement('adventure_note', close, statusMap, 'adventure_note', readyCb);
                statusMap.header = worldAdventure.config.name || worldAdventure.id;
                htmlElement.showHtmlElement();
            }

            let lastSortIdx = -1;
            let idxOffset = 60;


            let update = function () {
                let activeActor = GameAPI.getGamePieceSystem().selectedActor;
                nodes = worldAdventure.adventureNodes;
                statusMap.sortindex = sortingIndex;
                if (lastSortIdx !== sortingIndex) {
                        lastSortIdx = sortingIndex;
                        let offset = sortingIndex * idxOffset;
                        rootElement.style.top = offset +  270 + 'em'
                }

                if (sortingIndex === -1) {
                    close()
                }

                statusMap.distance = MATH.numberToDigits(worldAdventure.call.getCursorDistance(), 1, 1)+'m'
                let lvl = worldAdventure.config.level || '??';
                statusMap.level = 'Level: ' + lvl

                let isActive = false;

                if (activeActor) {
                    let activeAdvId = activeActor.getStatus(ENUMS.ActorStatus.ACTIVE_ADVENTURE)
                    if (activeAdvId === worldAdventure.id) {
                        isActive = true;
                    }
                }

                if (isActive === false) {
                    if (statusMap.active === true) {
                        applyActive(false);
                    }
                } else  {
                    if (statusMap.active === false) {
                        applyActive(true);
                    }
                }

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

                if (nodes.length !== nodeIndicatorDivs.length) {
                    attachNodeIndicators()
                }


                if (nodeIndicatorDivs.length) {


                    let progress = 0;

                    if (activeActor) {
                        progress = activeActor.getAdventureProgress(worldAdventure.id);
                    }

                    for (let i = 0; i < nodes.length; i++) {
                        let node = nodes[i];
                        let div = nodeIndicatorDivs[i];

                        if (node.isActive) {
                            if (div.isActive !== true) {
                                div.isActive = true;
                                DomUtils.addElementClass(div, 'indicator_active')
                            }

                        } else {
                            if (div.isActive === true) {
                                DomUtils.removeElementClass(div, 'indicator_active')
                                div.isActive = false;
                            }
                        }

                        if (progress === i) {

                            if (div.isCurrent !== true) {
                                div.isCurrent = true;
                                DomUtils.addElementClass(div, 'indicator_current')
                            }

                        } else {
                            if (div.isCurrent === true) {
                                DomUtils.removeElementClass(div, 'indicator_current')
                                div.isCurrent = false;
                            }

                            if (progress > i) {
                                if (div.isCompleted !== true) {
                                    div.isCompleted = true;
                                    DomUtils.addElementClass(div, 'indicator_completed')
                                }
                            } else {
                                if (div.isCompleted === true) {
                                    DomUtils.removeElementClass(div, 'indicator_completed')
                                    div.isCompleted = false;
                                }
                            }

                        }

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
            statusMap.selected = false;

            if (statusMap.active === true) {
                GameAPI.gameAdventureSystem.call.playerAdventureDeActivated(worldAdventure);
            }

            statusMap.active = false;
            sortingIndex = -1;
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