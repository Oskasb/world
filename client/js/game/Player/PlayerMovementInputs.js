import {GuiThumbstick} from "../../application/ui/gui/widgets/GuiThumbstick.js";
import {pitchYawInput} from "../piece_functions/InputFunctions.js";


let classNames = {
    'GuiThumbstick':GuiThumbstick
}

let updateFunctions = {
    "pitchYawInput":pitchYawInput
}

class PlayerMovementInputs {
    constructor() {
        this.inputWidgets = [];
    }


    attachInputWidget(inputConfig, actor) {

        let widgets = this.inputWidgets;

        let onUpdate = function(values) {
            updateFunctions[inputConfig['on_update']](values, actor)
        }

        let widgetReadyCB = function(guiWidget) {
            console.log("WidgetReady:", guiWidget);
            guiWidget.addInputUpdateCallback(onUpdate)
            widgets.push(guiWidget)
        }

        let widget = new classNames[inputConfig['class_name']]()
        widget.initGuiWidget(inputConfig['widget_config'], widgetReadyCB)
    }

    applyInputSamplingConfig(config, actor) {
        console.log('applyInputSamplingConfig', config)
        let inputs = config['inputs']
        if (inputs) {
            for (let i = 0; i < inputs.length; i++) {
                this.attachInputWidget(inputs[i], actor)
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