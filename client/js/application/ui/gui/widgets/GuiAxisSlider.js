import { GuiWidget} from "../elements/GuiWidget.js";

class GuiAxisSlider {
    constructor(options) {

        this.options = {
            "anchor": "stick_bottom_right",
            "icon": "directional_arrows",
            "axis": [1, 1],
            "release": [1, 1],
            "range": [0.08, 0.08]
        };
        for (let key in options) {
            console.log("Apply Options")
            this.options[key] = options[key];
            console.log("Apply Options", options)
        }

        this.pos = new THREE.Vector3();
        this.origin = new THREE.Vector3();
        this.offset = new THREE.Vector3();

        this.applyValues = [];

        this.releaseTime = 0;
        this.releaseProgress = 0;
        this.releaseDuration = 0.25;
        this.maxRange = 0.08;

        this.inputIndex = null;

        this.applyInputCallbacks = [];

        let onPressStart = function(index, widget) {
            this.inputIndex = index;
            this.onPressStart(index, widget)
        }.bind(this);

        let onInputUpdate = function(input, pointerState) {
            console.log(pointerState)
            if (pointerState.index === this.inputIndex) {
                this.onInputUpdated(input, pointerState)
            }
        }.bind(this);

        let onReleasedUpdate = function(tpf, time) {
        //    if (pointerState.inputIndex === this.inputIndex) {
                this.onReleasedUpdate(tpf, time)
        //    }
        }.bind(this);

        let notifyInputUpdated = function() {
            this.notifyInputUpdated()
        }.bind(this);

        this.callbacks = {
            onPressStart:onPressStart,
            onInputUpdate:onInputUpdate,
            onReleasedUpdate:onReleasedUpdate,
            notifyInputUpdated:notifyInputUpdated
        }

    };

    initGuiWidget = function(widgetConfig, onReady) {

        let widgetRdy = function(widget) {
            widget.applyWidgetOptions(this.options)
            widget.addOnPressStartCallback(this.callbacks.onPressStart);
            widget.enableWidgetInteraction();
            onReady(this)
        }.bind(this);

        this.guiWidget = new GuiWidget(widgetConfig);
        this.guiWidget.initGuiWidget(null, widgetRdy);

    };

    applyPositionOffset = function() {

    //    this.inputAngle = MATH.vectorXYToAngleAxisZ(this.offset);
    //    this.inputDistance = this.offset.length() / this.maxRange;
        this.guiWidget.offsetWidgetPosition(this.offset);

    };

    onPressStart = function(inputIndex, guiWidget) {
        console.log("SLider press start", inputIndex, guiWidget);
        ThreeAPI.unregisterPostrenderCallback(this.callbacks.onReleasedUpdate);
        GuiAPI.addInputUpdateCallback(this.callbacks.onInputUpdate);
        ThreeAPI.addPostrenderCallback(this.callbacks.notifyInputUpdated);
    };

    onInputUpdated = function(input, pointerState) {
    //    console.log("handleSliderInputUpdated", input, pointerState)
        let pressActive = pointerState.action[0] // GuiAPI.readInputBufferValue(input, pointerState, ENUMS.InputState.ACTION_0);

        if (!pressActive) {

            GuiAPI.removeInputUpdateCallback(this.callbacks.onInputUpdate);
            ThreeAPI.addPostrenderCallback(this.callbacks.onReleasedUpdate);
            this.releaseTime = 0;

        } else {
            this.offset.x = pointerState.dragDistance[0]*0.001 * Math.abs(this.options.axis[0]);
            this.offset.y = -pointerState.dragDistance[1]*0.001 * Math.abs(this.options.axis[1]);

            this.offset.x = MATH.clamp(this.offset.x, -this.options.range[0], this.options.range[0])
            this.offset.y = MATH.clamp(this.offset.y, -this.options.range[1], this.options.range[1])
        }

        this.applyPositionOffset();

    };

    onReleasedUpdate = function(tpf, time) {
        this.releaseTime += tpf;

        let releaseX = this.options.release[0];
        let releaseY = this.options.release[1]

        if (releaseX || releaseY) {
            let releaseProgress = this.releaseTime-this.releaseDuration;
            let releaseFraction = 1 - MATH.calcFraction(-this.releaseDuration, this.releaseDuration, releaseProgress)
            let releaseFactor = MATH.curveSqrt(releaseFraction);

            if (releaseX) {
                this.offset.x *= releaseX * releaseFactor;
            }
            if (releaseY) {
                this.offset.y *= releaseY * releaseFactor;
            }

            if (this.offset.lengthSq() < 0.0000001) {
                this.offset.set(0, 0, 0);
                ThreeAPI.unregisterPostrenderCallback(this.callbacks.onReleasedUpdate);
                ThreeAPI.unregisterPostrenderCallback(this.callbacks.notifyInputUpdated);
            }

            this.applyPositionOffset();
        } else {
            ThreeAPI.unregisterPostrenderCallback(this.callbacks.onReleasedUpdate);
            ThreeAPI.unregisterPostrenderCallback(this.callbacks.notifyInputUpdated);
        }

    };

    notifyInputUpdated = function() {
        this.applyValues[0] = MATH.clamp(this.options.axis[0] * this.offset.x *1.2 / this.options.range[0], -1, 1);
        this.applyValues[1] = MATH.clamp(this.options.axis[1] * this.offset.y *1.2 / this.options.range[1], -1, 1);
        for (let i = 0; i < this.applyInputCallbacks.length; i++) {
            this.applyInputCallbacks[i](this.applyValues);
        }
    };

    addInputUpdateCallback = function(applyInputUpdate) {
        this.applyInputCallbacks.push(applyInputUpdate)
    };

    removeGuiWidget = function() {
        MATH.emptyArray(this.applyInputCallbacks);
        this.guiWidget.recoverGuiWidget()
    };




}
export { GuiAxisSlider }