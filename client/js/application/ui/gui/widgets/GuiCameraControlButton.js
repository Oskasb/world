import {GuiButtonFrame} from "./GuiButtonFrame.js";

let labelMap = {}
labelMap[ENUMS.CameraStatus.CAMERA_MODE] = 'Camera';
labelMap[ENUMS.CameraStatus.LOOK_AT] = 'Focus';
labelMap[ENUMS.CameraStatus.LOOK_FROM] = 'Source';
labelMap[ENUMS.CameraStatus.POINTER_ACTION] = 'World';


class GuiCameraControlButton {
    constructor(statusKey, layoutConfId, onActivate, testActive, x, y, onReady, frameWidgetId, hpProgressId) {

        this.name = labelMap[statusKey];
        this.portraitContainer;

        let activate = function() {
            onActivate(statusKey);
        }

        let isActive = function() {
            return testActive(statusKey)
        }

        let updateButtonState = function(tpf) {
            this.updateButtonState(tpf);
        }.bind(this)

        this.call = {
            isActive:isActive,
            updateButtonState:updateButtonState
        }

        let buttonReady = function(button) {
            this.button = button;
            this.container = this.portraitContainer;
            this.guiWidget = button.guiWidget;
            this.buttonFrame = new GuiButtonFrame(this.guiWidget, frameWidgetId);
            ThreeAPI.addPrerenderCallback(this.call.updateButtonState)
            onReady(this)
        }.bind(this)



        let anchorReady = function(element) {
            this.portraitContainer = element;

            let opts = {
                widgetClass:'GuiSimpleButton',
                widgetCallback:buttonReady,
                configId: layoutConfId,
                onActivate: activate,
                testActive: isActive,
                interactive: true,
                set_parent:element.guiWidget,
                text: this.name,
            };

            evt.dispatch(ENUMS.Event.BUILD_GUI_ELEMENT, opts)
        }.bind(this);

        let contopts = GuiAPI.buildWidgetOptions(
            {
                widgetClass:'GuiExpandingContainer',
                widgetCallback:anchorReady,
                offset_x:  x,
                offset_y:  y,
                configId:'widget_gui_anchor'
            }
        );

        evt.dispatch(ENUMS.Event.BUILD_GUI_ELEMENT, contopts)

    }

    setButtonIcon(iconKey) {
        if (this.iconKey !== iconKey) {
            this.iconKey = iconKey;
            this.guiWidget.setWidgetIconKey(this.iconKey)
        }
    }

    updateButtonState(tpf) {

        this.guiWidget.getWidgetSurface().updateInterativeState();
        this.buttonFrame.updateButtonFrame(tpf);

    }

    removeGuiWidget() {
        ThreeAPI.unregisterPrerenderCallback(this.call.updateButtonState)
        this.guiWidget.recoverGuiWidget()
    }


}

export { GuiCameraControlButton }