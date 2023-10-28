import { GuiWidget} from "../elements/GuiWidget.js";

class GuiThumbstick {
    constructor(options) {

        this.options = {};
        for (let key in options) {
            this.options[key] = options[key];
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
            this.handleThumbstickPressStart(index, widget)
        }.bind(this);

        let onStickInputUpdate = function(input, pointerState) {
            this.handleThumbstickInputUpdated(input, pointerState)
        }.bind(this);

        let onStickReleasedUpdate = function(tpf, time) {
            this.handleThumbstickReleasedUpdate(tpf, time)
        }.bind(this);


        let notifyInputUpdated = function() {
            this.applyValues[0] = MATH.clamp(this.offset.x *1.6 / this.maxRange, -1, 1);
            this.applyValues[1] = MATH.clamp(this.offset.y *1.6 / this.maxRange, -1, 1);
            this.notifyInputUpdated(this.applyValues)
        }.bind(this);

        this.callbacks = {
            onPressStart:onPressStart,
            onStickInputUpdate:onStickInputUpdate,
            onStickReleasedUpdate:onStickReleasedUpdate,
            notifyInputUpdated:notifyInputUpdated
        }

    };


    initGuiWidget = function(widgetConfig, onReady) {

        let widgetRdy = function(widget) {
            widget.attachToAnchor('bottom_right');
            widget.setWidgetIconKey('directional_arrows');
            widget.addOnPressStartCallback(this.callbacks.onPressStart);
            widget.enableWidgetInteraction();
            onReady(this)
        }.bind(this);

        this.guiWidget = new GuiWidget(widgetConfig);
        this.guiWidget.initGuiWidget(null, widgetRdy);

    };

    setGuiWidget = function(widget) {
        this.guiWidget = widget;
        widget.addOnPressStartCallback(this.callbacks.onPressStart);
        widget.enableWidgetInteraction();
    };

    applyPositionOffset = function() {

    //    this.inputAngle = MATH.vectorXYToAngleAxisZ(this.offset);
    //    this.inputDistance = this.offset.length() / this.maxRange;
        this.guiWidget.offsetWidgetPosition(this.offset);

    };

    handleThumbstickPressStart = function(inputIndex, guiWidget) {
        this.activeInputIndex = inputIndex;
        console.log("Thumbstick press start", inputIndex, guiWidget);
        ThreeAPI.unregisterPostrenderCallback(this.callbacks.onStickReleasedUpdate);
        GuiAPI.addInputUpdateCallback(this.callbacks.onStickInputUpdate);
        ThreeAPI.addPostrenderCallback(this.callbacks.notifyInputUpdated);
    };

    handleThumbstickInputUpdated = function(input, pointerState) {
        console.log("handleThumbstickInputUpdated", input, pointerState)
        let pressActive = pointerState.action[0] // GuiAPI.readInputBufferValue(input, pointerState, ENUMS.InputState.ACTION_0);

        if (!pressActive) {

            GuiAPI.removeInputUpdateCallback(this.callbacks.onStickInputUpdate);
            ThreeAPI.addPostrenderCallback(this.callbacks.onStickReleasedUpdate);
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

    handleThumbstickReleasedUpdate = function(tpf, time) {
        this.releaseTime += tpf;

        this.releaseProgress = MATH.curveSqrt(1 - MATH.calcFraction(-this.releaseDuration, this.releaseDuration, this.releaseTime-this.releaseDuration));

        this.offset.multiplyScalar(this.releaseProgress);

        //    this.offset.multiplyScalar(this.releaseProgress);

        if (this.offset.lengthSq() < 0.0000001) {
            this.offset.set(0, 0, 0);
            ThreeAPI.unregisterPostrenderCallback(this.callbacks.onStickReleasedUpdate);
            ThreeAPI.unregisterPostrenderCallback(this.callbacks.notifyInputUpdated);
        }

        this.applyPositionOffset();
    };


    addInputUpdateCallback = function(applyInputUpdate) {
        this.applyInputCallbacks.push(applyInputUpdate)
    };

    notifyInputUpdated = function(values) {

        for (let i = 0; i < this.applyInputCallbacks.length; i++) {
            this.applyInputCallbacks[i](values);
        }
    };

    removeGuiWidget = function() {
        MATH.emptyArray(this.applyInputCallbacks);
        this.guiWidget.recoverGuiWidget()
    };




}
export { GuiThumbstick }