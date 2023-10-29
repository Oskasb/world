import { GuiWidget} from "../elements/GuiWidget.js";

class GuiThumbstick {
    constructor(options) {

        this.options = {
            anchor: "stick_bottom_left",
            icon: "directional_arrows"
        };

        for (let key in options) {
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

        this.inputAngle = 0;
        this.inputDistance = 0;

        this.activeInputIndex = null;

        this.applyInputCallbacks = [];

        let onPressStart = function(index, widget) {
            this.onPressStart(index, widget)
        }.bind(this);

        let onInputUpdate = function(input, pointerState) {
            this.onInputUpdated(input, pointerState)
        }.bind(this);

        let onReleasedUpdate = function(tpf, time) {
            this.onReleasedUpdate(tpf, time)
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
        this.activeInputIndex = inputIndex;
        console.log("Thumbstick press start", inputIndex, guiWidget);
        ThreeAPI.unregisterPostrenderCallback(this.callbacks.onReleasedUpdate);
        GuiAPI.addInputUpdateCallback(this.callbacks.onInputUpdate);
        ThreeAPI.addPostrenderCallback(this.callbacks.notifyInputUpdated);
    };

    onInputUpdated = function(input, pointerState) {
        console.log("handleThumbstickInputUpdated", input, pointerState)
        let pressActive = pointerState.action[0] // GuiAPI.readInputBufferValue(input, pointerState, ENUMS.InputState.ACTION_0);

        if (!pressActive) {

            GuiAPI.removeInputUpdateCallback(this.callbacks.onInputUpdate);
            ThreeAPI.addPostrenderCallback(this.callbacks.onReleasedUpdate);
            this.releaseTime = 0;

        } else {
            this.offset.x = pointerState.dragDistance[0]*0.001;
            this.offset.y = -pointerState.dragDistance[1]*0.001;

            let length = this.offset.length();
            if (length > this.maxRange) {
                this.offset.normalize();
                this.offset.multiplyScalar(this.maxRange);
            }

        }

        this.applyPositionOffset();

    };

    onReleasedUpdate = function(tpf, time) {
        this.releaseTime += tpf;

        this.releaseProgress = MATH.curveSqrt(1 - MATH.calcFraction(-this.releaseDuration, this.releaseDuration, this.releaseTime-this.releaseDuration));

        this.offset.multiplyScalar(this.releaseProgress);

        //    this.offset.multiplyScalar(this.releaseProgress);

        if (this.offset.lengthSq() < 0.0000001) {
            this.offset.set(0, 0, 0);
            ThreeAPI.unregisterPostrenderCallback(this.callbacks.onReleasedUpdate);
            ThreeAPI.unregisterPostrenderCallback(this.callbacks.notifyInputUpdated);
        }

        this.applyPositionOffset();
    };

    notifyInputUpdated = function() {
        this.applyValues[0] = MATH.clamp(this.offset.x *1.6 / this.maxRange, -1, 1);
        this.applyValues[1] = MATH.clamp(this.offset.y *1.6 / this.maxRange, -1, 1);
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
export { GuiThumbstick }