import { InputSystem } from "./systems/InputSystem.js";
import { TextSystem } from "./systems/TextSystem.js";
import { GuiButtonSystem } from "./systems/GuiButtonSystem.js";
import { GuiAnchors } from "./widgets/GuiAnchors.js";
import { UiTestSetup } from "./UiTestSetup.js";

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

            let textSysCb = function() {
                callback('textSysCb loaded');
            };
            let inputReady = function() {

                GuiAPI.getTextSystem().initTextSystem(textSysCb);
            };

            GuiAPI.getInputSystem().initInputSystem(inputReady);

        };

        setupDefaultUi = function() {
            this.guiAnchors.initGuiAnchors();
            GuiAPI.getGuiDebug().setupDebugControlContainer();
            GuiAPI.getGuiDebug().setupDebugControlContainer2();
            GuiAPI.debugView.initDebugView();
        };

    }

    export { UiSetup }