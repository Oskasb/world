import {GuiThumbstick} from "../../application/ui/gui/widgets/GuiThumbstick.js";

let classNames = {
    'GuiThumbstick':GuiThumbstick
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
                actor.setControlKey(controls[i], values[i])
            }
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