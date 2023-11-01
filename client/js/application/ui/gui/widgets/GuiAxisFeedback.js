import { GuiWidget} from "../elements/GuiWidget.js";

let applyPositionOffset = function(guiAxisSlider) {
    guiAxisSlider.guiWidget.offsetWidgetPosition(guiAxisSlider.offset);
    if (guiAxisSlider.rotation) {
        guiAxisSlider.guiWidget.setWidgetRotation(guiAxisSlider.rotation)
    }

    if (guiAxisSlider.valueText) {
        guiAxisSlider.guiWidget.text.maxRows = 1;
        guiAxisSlider.guiWidget.printWidgetText(guiAxisSlider.valueText)
    }

};

let onFrameUpdate = function(guiAxisSlider, tpf, time) {

    let options = guiAxisSlider.options

    MATH.callAll(guiAxisSlider.onUpdateCallbacks, guiAxisSlider)

    let xValue = guiAxisSlider.feedbackValues[0] * options.axis[0];
    let yValue = guiAxisSlider.feedbackValues[1] * options.axis[1];

    guiAxisSlider.offset.x = options.offsets[0] + xValue*options.range[0];
    guiAxisSlider.offset.y = options.offsets[1] + yValue*options.range[1]
    guiAxisSlider.rotation = xValue*options.rotation[0] + yValue*options.rotation[1]

    let text = "";

    if (options.value_text[0] !== null) {
        text += MATH.numberToDigits(xValue, options.value_text[0], options.value_text[0])
    }

    if (options.value_text[1] !== null) {
        text += MATH.numberToDigits(yValue, options.value_text[1], options.value_text[1])
    }
    guiAxisSlider.valueText = text;
    applyPositionOffset(guiAxisSlider);

};

class GuiAxisFeedback {
    constructor(options) {

        this.options = {
            "anchor": "stick_bottom_right",
            "icon": "directional_arrows",
            "axis": [1, 1],
            "release": [1, 1],
            "range": [0.08, 0.08],
            "rotation": [0, 0],
            "offsets": [0, 0],
            "value_text": [null, null]
        };
        for (let key in options) {
            this.options[key] = options[key];
        }

        this.pos = new THREE.Vector3();
        this.origin = new THREE.Vector3();
        this.offset = new THREE.Vector3();

        this.rotation = 0;

        this.valueText = "";

        this.feedbackValues = [0, 0];
        this.onUpdateCallbacks = [];

        let guiAxisFeedback = this;

        let frameUpdate = function(tpf, time) {
            onFrameUpdate(guiAxisFeedback, tpf, time)
        };

        this.callbacks = {
            onFrameUpdate:frameUpdate
        }
    };

    updateFeedbackValue = function(valueIndex, value) {
        this.feedbackValues[valueIndex] = value;
    }

    initGuiWidget = function(widgetConfig, onReady) {
        let widgetRdy = function(widget) {
            widget.applyWidgetOptions(this.options)
            onReady(this)
        }.bind(this);
        this.guiWidget = new GuiWidget(widgetConfig);
        this.guiWidget.initGuiWidget(null, widgetRdy);
        ThreeAPI.addPrerenderCallback(this.callbacks.onFrameUpdate);
    };

    addUpdateCallback = function(onUpdate) {
        this.onUpdateCallbacks.push(onUpdate)
    };

    removeGuiWidget = function() {
        ThreeAPI.unregisterPrerenderCallback(this.callbacks.onFrameUpdate);
        MATH.emptyArray(this.onUpdateCallbacks);
        this.guiWidget.recoverGuiWidget()
    };

}

export { GuiAxisFeedback }