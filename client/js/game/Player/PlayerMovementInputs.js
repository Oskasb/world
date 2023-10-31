import {GuiAxisSlider} from "../../application/ui/gui/widgets/GuiAxisSlider.js";
import { GuiAxisFeedback } from "../../application/ui/gui/widgets/GuiAxisFeedback.js";

let classNames = {
    'GuiAxisSlider':GuiAxisSlider,
    'GuiAxisFeedback':GuiAxisFeedback
}


class PlayerMovementInputs {
    constructor() {
        this.inputWidgets = [];
    }


    attachInputWidget(inputConfig, actor) {

        let widgets = this.inputWidgets;
        let controls = inputConfig['controls'];
        let onUpdate = function(values) {
            for (let i = 0; i < values.length; i++) {
                if (controls[i]) {
                    actor.setControlKey(controls[i], values[i])
                }
            }
        }

        let widgetReadyCB = function(inputWidget) {
            console.log("WidgetReady:", inputWidget);
        //    inputWidget.guiWidget.applyWidgetOptions(inputConfig['options'])
            inputWidget.addInputUpdateCallback(onUpdate)
            widgets.push(inputWidget)
        }

        let widget = new classNames[inputConfig['class_name']](inputConfig['options'])
        widget.initGuiWidget(inputConfig['widget_config'], widgetReadyCB)
    }

    attachFeedbackWidget(feedbackConfig, actor) {
        let widgets = this.inputWidgets;
        let status = feedbackConfig['status'];
        let onUpdate = function(feedbackWidget) {
            for (let i = 0; i < status.length; i++) {
                if (status[i]) {
                    let value = actor.getStatus(status[i])
                    feedbackWidget.updateFeedbackValue(i, value)
                }
            }
        }

        let widgetReadyCB = function(inputWidget) {
            console.log("WidgetReady:", inputWidget);
            //    inputWidget.guiWidget.applyWidgetOptions(inputConfig['options'])
            inputWidget.addUpdateCallback(onUpdate)
            widgets.push(inputWidget)
        }

        let widget = new classNames[feedbackConfig['class_name']](feedbackConfig['options'])
        widget.initGuiWidget(feedbackConfig['widget_config'], widgetReadyCB)
    }

    applyInputSamplingConfig(config, actor) {
        console.log('applyInputSamplingConfig', config)

        let cameraMode = config['camera_mode']
        if (cameraMode) {
            evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:cameraMode})
        }


        let inputs = config['inputs']
        if (inputs) {
            for (let i = 0; i < inputs.length; i++) {
                this.attachInputWidget(inputs[i], actor)
            }
        }

        let feedback = config['feedback']

        if (feedback) {
            for (let i = 0; i < feedback.length; i++) {
                this.attachFeedbackWidget(feedback[i], actor)
            }
        }

    }


    updatePlayerMovementControls() {

    }

    activatePlayerMovementControls() {
        ThreeAPI.addPrerenderCallback(this.updatePlayerMovementControls)
    }

    deactivatePlayerMovementControls() {
        while (this.inputWidgets.length) {
            this.inputWidgets.pop().removeGuiWidget();
        }
        ThreeAPI.unregisterPrerenderCallback(this.updatePlayerMovementControls)
    }

}

export {PlayerMovementInputs}