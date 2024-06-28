import {HtmlElement} from "./HtmlElement.js";
import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {getPlayerStatus} from "../../utils/StatusUtils.js";
import {ENUMS} from "../../ENUMS.js";

let defaultAdsr = {
    attack: {duration:0.5, from:0, to: 1.2, easing:"cubic-bezier(0.7, 0.2, 0.85, 1.15)"},
    decay:  {duration:0.2, to: 1, easing:"ease-in-out"},
    sustain: {duration: 2, to: 1, easing:"ease-in-out"},
    release: {duration:0.4, to: 0, easing:"cubic-bezier(0.4, -0.2, 0.7, -0.2)"}
}


class DomStash {
    constructor() {
        let actor = null;

        let htmlElement = new HtmlElement();
        let buttonDiv = null;
        let adsrEnvelope;
        let rootElem;
        let statusMap = {
            name : ".."
        }

        let setInitTransforms = function() {
            rootElem = htmlElement.call.getRootElement();
            rootElem.style.transform = "translate3d(-50%, 0, 0)";
        }

        let retrigger = function() {
            close();
            setTimeout(function() {
                activate( GameAPI.getActorById(statusMap.id))
            }, 1500);
        }

        let mouseMove = function(e) {
        //    console.log("mouse Move ", e.target);
            e.target.style.borderColor = "rgba(155, 225, 255, 0.2)";
        }

        let mouseOut = function(e) {
        //    console.log("mouse Out ", e.target);
            e.target.style.borderColor = "";
        }

        let stashContainerDiv;

        function attachStashSlot(slotIndex) {

        }

        let readyCb = function() {

            let items = actor.actorInventory.items;
            stashContainerDiv = htmlElement.call.getChildElement('stash_container');

            MATH.emptyArray(lastFrameState); // For debugging



            let reloadDiv = htmlElement.call.getChildElement('reload');
            if (reloadDiv) {
                DomUtils.addClickFunction(reloadDiv, retrigger)
            }

        }

        let rebuild;
        let lastFrameState = [];
        let slotDivs = [];

        function updateActivePageSlots(slotCount) {
            DomUtils.clearDivArray(slotDivs);
            for (let i = 0; i < slotCount; i++) {

                let slotKey ='STASH_SLOT_'+i;
                    ENUMS.StashSlots[slotKey] = slotKey;
                let div = DomUtils.createDivElement(stashContainerDiv, slotKey, ''+i, "item_container stash_slot")
                slotDivs.push(div);
                DomUtils.addMouseMoveFunction(div, mouseMove)
                DomUtils.addPointerExitFunction(div, mouseOut)
            }
        }

        let update = function() {

            let page = ENUMS.PlayerStatus.STASH_TAB_ITEMS;
            let stashState = getPlayerStatus(page);
            if (slotDivs.length !== getPlayerStatus(ENUMS.PlayerStatus.SLOTS_PER_PAGE)) {
                updateActivePageSlots(getPlayerStatus(ENUMS.PlayerStatus.SLOTS_PER_PAGE));
            }

            statusMap[ENUMS.PlayerStatus.ACTIVE_STASH_TAB] = getPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_TAB)
            statusMap[ENUMS.PlayerStatus.ACTIVE_STASH_SUBPAGE] = getPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_SUBPAGE)
            statusMap[ENUMS.PlayerStatus.STASH_TAB_ITEMS] = getPlayerStatus(ENUMS.PlayerStatus.STASH_TAB_ITEMS).length
            statusMap[ENUMS.PlayerStatus.STASH_TAB_MATERIALS] = getPlayerStatus(ENUMS.PlayerStatus.STASH_TAB_MATERIALS).length
            statusMap[ENUMS.PlayerStatus.STASH_TAB_CURRENCIES] = getPlayerStatus(ENUMS.PlayerStatus.STASH_TAB_CURRENCIES).length
            statusMap[ENUMS.PlayerStatus.STASH_TAB_LORE] = getPlayerStatus(ENUMS.PlayerStatus.STASH_TAB_LORE).length


            for (let i = 0; i < stashState.length; i++) {
                let itemId = stashState[i];
                if (lastFrameState[i] !== itemId) {
                    if (itemId) {
                        let item = GameAPI.getItemById(itemId);
                        console.log("Stash state updated", i, itemId, item);
                    }
                }
            }
            MATH.copyArrayValues(stashState, lastFrameState);

        }

        let close = function() {
            ThreeAPI.unregisterPrerenderCallback(update);
            actor.deactivateUiState(ENUMS.UiStates.STASH);
            actor = null;
            htmlElement.closeHtmlElement();
            poolReturn(htmlElement);
        }

        let htmlReady = function() {
            readyCb()
            htmlElement.container.style.visibility = 'visible';
            GuiAPI.setUiStatusHtmlElement(ENUMS.UiStates.STASH, htmlElement)
            statusMap.id = actor.getStatus(ENUMS.ActorStatus.ACTOR_ID);
            statusMap.name = actor.getStatus(ENUMS.ActorStatus.NAME);

            setTimeout(function() {
                ThreeAPI.registerPrerenderCallback(update);
                setInitTransforms();
                actor.activateUiState(ENUMS.UiStates.STASH);
            },1)
        }


        let activate = function(actr, btnDiv, onClose) {
            buttonDiv = btnDiv;
            console.log("Player Stash", actr)
            DomUtils.addElementClass(buttonDiv, 'bar_button_active')
            adsrEnvelope = defaultAdsr;
            actor = actr;
            htmlElement = poolFetch('HtmlElement');
            rebuild = htmlElement.initHtmlElement('stash', onClose, statusMap, 'stash', htmlReady);
        }

        let release = function() {
            htmlElement.hideHtmlElement();
            if (buttonDiv !== null) {
                DomUtils.removeElementClass(buttonDiv, 'bar_button_active')
            }
            buttonDiv = null;
            setTimeout(function() {
                close();
            }, adsrEnvelope.release.duration*1000+200)
        }

        this.call = {
            close:close,
            activate:activate,
            release:release
        }
    }
}

export {DomStash}