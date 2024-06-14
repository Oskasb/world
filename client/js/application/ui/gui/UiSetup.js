import { InputSystem } from "./systems/InputSystem.js";
import { TextSystem } from "./systems/TextSystem.js";
import { GuiButtonSystem } from "./systems/GuiButtonSystem.js";
import { GuiAnchors } from "./widgets/GuiAnchors.js";
import { UiTestSetup } from "./UiTestSetup.js";
import { PartyUiSystem } from "./systems/PartyUiSystem.js";
import { ActorActionUiSystem} from "./systems/ActorActionUiSystem.js";
import {WorldInteractUiSystem} from "./systems/WorldInteractUiSystem.js";
import {DomMinimap} from "../dom/DomMinimap.js";
import {isDev} from "../../utils/DebugUtils.js";


let partyUiSystem = null;
let actorActionUpSystem = new ActorActionUiSystem();
let minimap = null;

class UiSetup {
    constructor() {
            this.uiTestSetup = new UiTestSetup();
            this.guiAnchors = new GuiAnchors();
        };

        initUiSetup = function(callback) {

            GuiAPI.setInputSystem( new InputSystem());
            GuiAPI.setTextSystem( new TextSystem());
            let buttonSystem = new GuiButtonSystem();
            buttonSystem.initGuiButtonSystem();
            GuiAPI.setButtonSystem(buttonSystem);
            partyUiSystem = new PartyUiSystem()
            let textSysCb = function() {
                callback('textSysCb loaded');
            };
            let inputReady = function() {

                GuiAPI.getTextSystem().initTextSystem(textSysCb);
                minimap = new DomMinimap();
            };

            GuiAPI.getInputSystem().initInputSystem(inputReady);



        };

        setupDefaultUi = function() {
            this.guiAnchors.initGuiAnchors();

            if (isDev() === true) {
                GuiAPI.getGuiDebug().setupDebugControlContainer();
                GuiAPI.getGuiDebug().setupDebugControlContainer2();
                GuiAPI.debugView.initDebugView();
            }


            partyUiSystem.activatePartyUiSystem();
            actorActionUpSystem.activateActorActionUiSystem()
        };

    }

    export { UiSetup }