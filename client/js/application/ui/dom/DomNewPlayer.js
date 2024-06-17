import {poolFetch} from "../../utils/PoolUtils.js";
import {setPlayerStatus} from "../../utils/StatusUtils.js";
import {ENUMS} from "../../ENUMS.js";
import {getConfigByEditId} from "../../utils/ConfigUtils.js";

class DomNewPlayer {
    constructor() {


        let isValid = false;

        let mainPanelDiv;
        let buttonCharDiv;
        let buttonNameDiv;
        let buttonPlayDiv;
        let editString = null;
        let charListDiv;
        let isReady = false;
        let actorSelectDivs = [];


        let newPlayerCharOptions;

        function switchSelection() {
            DomUtils.removeElementClass(buttonCharDiv, 'bar_button_active')
            DomUtils.removeElementClass(buttonNameDiv, 'bar_button_active')
            DomUtils.removeElementClass(charListDiv, 'character_list_active')
        }

        function onUpdate(inValue, validationCb) {

            setTimeout(function() {
                if (inValue.length > 2) {

                    if (!/[^a-zA-Z]/.test(inValue)) {
                        validationCb(inValue, 'Name is Ok!')
                        isValid = true;
                    } else {
                        validationCb(statusMap.out, 'Standard letters please')
                        isValid = false;
                    }
                } else {
                    validationCb(statusMap.out, 'Name too short')
                    isValid = false;
                }
            }, 1000)

        }

        let validName = false;

        function onSubmit(inValue, sMap) {

            if (isValid === true) {
                setPlayerStatus(ENUMS.PlayerStatus.PLAYER_NAME, inValue);
                statusMap.NAME = inValue;
                editString.closeEditTool();
                editString = null;
                validName = true;
            }

        }

        let statusMap = {
            id:"PLAYER_NAME",
            in:"",
            out:"",
            status:"",
            value:"",
            header:"Name",
            context:"Select a display name.",
            from:"input",
            NAME:"no_name_yet",
            onUpdate:onUpdate,
            onSubmit:onSubmit
        }


        function selectName() {
            switchSelection()

            if (editString === null) {
            DomUtils.addElementClass(buttonNameDiv, 'bar_button_active')

            let stringEditClose = function() {
                console.log("Close String Edit")
                switchSelection();
                editString = null;
            }


            let stringEditReady = function() {
                console.log("String Edit Ready")
                //    editString = null;
            }

                editString = poolFetch('DomEditString')
                editString.initEditTool(stringEditClose, statusMap, stringEditReady)
            } else {
                editString.closeEditTool();
                editString = null;
            }


        }

        function selectChar() {
            if (editString !== null) {
                editString.closeEditTool();
                editString = null;
            }
            switchSelection()
            DomUtils.addElementClass(buttonCharDiv, 'bar_button_active')
            DomUtils.addElementClass(charListDiv, 'character_list_active')
        }

        let selectedCharDiv = null;
        let selectedCharacterId = null;
        function charSelected(div, id) {
            selectedCharacterId = id;
            if (selectedCharDiv !== null) {
                DomUtils.removeElementClass(selectedCharDiv, 'character_select_active')
            }
            selectedCharDiv = div;
            console.log("charSelected", selectedCharacterId, div);
            DomUtils.addElementClass(div, 'character_select_active')
        }

        function enterWorld() {
            console.log("Enter World ", selectedCharacterId, statusMap.NAME, statusMap);
        }


        function poopulateActorList(actors) {
            for (let i = 0; i < actors.length; i++) {

                let actorId = actors[i];
                let div = DomUtils.createDivElement(charListDiv, 'select_'+actorId, actorId, 'character_select')
                DomUtils.addElementClass(div, 'character_'+actorId);
                actorSelectDivs.push(div)
                let onClick = function() {
                    charSelected(div, actorId)
                }
                DomUtils.addClickFunction(div, onClick)

            }
        }

        function update() {

            if (!newPlayerCharOptions) {
                newPlayerCharOptions = getConfigByEditId('new_player_character_options')
                console.log(newPlayerCharOptions);
            } else {
                let actors = newPlayerCharOptions.actors;
                if (actorSelectDivs.length !== actors.length) {
                    poopulateActorList(actors)
                }
            }

            if (isReady === false) {
                if (selectedCharacterId !== null && validName === true) {
                    isReady = true;
                    DomUtils.removeElementClass(buttonPlayDiv, 'bar_button_disabled')
                    DomUtils.addElementClass(buttonPlayDiv, 'animate_button_border')
                }
            }


        }

            let readyCb = function() {

                let nameDiv = htmlElement.call.getChildElement('NAME');
                mainPanelDiv = htmlElement.call.getChildElement('equipment_container');
               charListDiv = htmlElement.call.getChildElement('character_list');
                buttonNameDiv = htmlElement.call.getChildElement('button_name');
                buttonCharDiv = htmlElement.call.getChildElement('button_character');
                buttonPlayDiv = htmlElement.call.getChildElement('button_play');

                DomUtils.addClickFunction(buttonNameDiv, selectName)
                DomUtils.addClickFunction(buttonCharDiv, selectChar)
                DomUtils.addClickFunction(buttonPlayDiv, enterWorld)

                DomUtils.addElementClass(buttonPlayDiv, 'bar_button_disabled')

                //    headerDiv = htmlElement.call.getChildElement('header_container');
                //    topDiv = htmlElement.call.getChildElement('top_container');
                //    bottomDiv = htmlElement.call.getChildElement('bottom_container');
                let reloadDiv = htmlElement.call.getChildElement('reload');
                //    DomUtils.addClickFunction(invDiv, openInventory)
                DomUtils.addClickFunction(reloadDiv, init)

                ThreeAPI.registerPrerenderCallback(update);

            }


        let htmlElement = poolFetch('HtmlElement')
        function init() {
            htmlElement.initHtmlElement('new_player', null, statusMap, 'full_screen', readyCb);
        }
        init()
    }

}

export { DomNewPlayer }