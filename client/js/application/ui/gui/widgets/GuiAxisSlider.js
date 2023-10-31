import { GuiWidget} from "../elements/GuiWidget.js";


let applyPositionOffset = function(guiAxisSlider) {
    let options = guiAxisSlider.options
    guiAxisSlider.pos.x = options.offsets[0] +guiAxisSlider.offset.x
    guiAxisSlider.pos.y = options.offsets[1] +guiAxisSlider.offset.y

    guiAxisSlider.guiWidget.offsetWidgetPosition(guiAxisSlider.pos);
};

let onPressStart = function(guiAxisSlider, guiPointer) {
    console.log("SLider press start", guiPointer);
};

let onSurfaceRelease = function(guiAxisSlider) {
    guiAxisSlider.activeGuiPointer = null;
    guiAxisSlider.interactiveSurface = null;
    guiAxisSlider.pressActive = false;
    guiAxisSlider.inputIndex = -1;
    guiAxisSlider.releaseTime = 0;
}

let onInputUpdated = function(guiAxisSlider, pointerState) {
    //    console.log("handleSliderInputUpdated", input, pointerState)
    let options = guiAxisSlider.options
    guiAxisSlider.pressActive  = pointerState.action[0] // GuiAPI.readInputBufferValue(input, pointerState, ENUMS.InputState.ACTION_0);
    guiAxisSlider.offset.x = pointerState.dragDistance[0]*0.001 * Math.abs(options.axis[0]);
    guiAxisSlider.offset.y = -pointerState.dragDistance[1]*0.001 * Math.abs(options.axis[1]);
    guiAxisSlider.offset.x = MATH.clamp(guiAxisSlider.offset.x, -options.range[0], options.range[0])
    guiAxisSlider.offset.y = MATH.clamp(guiAxisSlider.offset.y, -options.range[1], options.range[1])

};

let notifyInputUpdated = function(guiAxisSlider) {
    let options = guiAxisSlider.options
    guiAxisSlider.applyValues[0] = MATH.clamp(options.axis[0] * guiAxisSlider.offset.x *1.2 / options.range[0], -1, 1);
    guiAxisSlider.applyValues[1] = MATH.clamp(options.axis[1] * guiAxisSlider.offset.y *1.2 / options.range[1], -1, 1);
    for (let i = 0; i < guiAxisSlider.applyInputCallbacks.length; i++) {
        guiAxisSlider.applyInputCallbacks[i](guiAxisSlider.applyValues);
    }
};

let onFrameUpdate = function(guiAxisSlider, tpf, time) {

    if (!guiAxisSlider.pressActive) {
        let options = guiAxisSlider.options
        guiAxisSlider.releaseTime += tpf;

        let releaseX = guiAxisSlider.options.release[0];
        let releaseY = guiAxisSlider.options.release[1]

        if (releaseX || releaseY) {
            let releaseProgress = guiAxisSlider.releaseTime-guiAxisSlider.releaseDuration;
            let releaseFraction = 1 - MATH.calcFraction(-guiAxisSlider.releaseDuration, guiAxisSlider.releaseDuration, releaseProgress)
            let releaseFactor = MATH.curveSqrt(releaseFraction);

            if (releaseX) {
                guiAxisSlider.offset.x *= releaseX * releaseFactor;
            }
            if (releaseY) {
                guiAxisSlider.offset.y *= releaseY * releaseFactor;
            }

            if (guiAxisSlider.offset.lengthSq() < 0.0000001) {
                guiAxisSlider.offset.set(0, 0, 0);
            }
        }

    }

    applyPositionOffset(guiAxisSlider);
    notifyInputUpdated(guiAxisSlider)

};

class GuiAxisSlider {
    constructor(options) {

        this.options = {
            "anchor": "stick_bottom_right",
            "icon": "directional_arrows",
            "axis": [1, 1],
            "release": [1, 1],
            "range": [0.08, 0.08],
            "offsets": [0, 0]
        };
        for (let key in options) {
            this.options[key] = options[key];
        }

        this.pos = new THREE.Vector3();
        this.origin = new THREE.Vector3();
        this.offset = new THREE.Vector3();

        this.applyValues = [];

        this.releaseTime = 0;
        this.releaseDuration = 0.25;

        this.inputIndex = -1;
        this.pressActive = false;
        this.applyInputCallbacks = [];
        this.activeGuiPointer = null;

        let guiAxisSlider = this;

        let pressStart = function(index, guiPointer) {
            guiAxisSlider.activeGuiPointer = guiPointer;
            if (guiAxisSlider.inputIndex === -1) {
                guiAxisSlider.inputIndex = index;
                onPressStart(guiAxisSlider, guiPointer)
            }
        };

        let inputUpdate = function(index, pointerState) {
            if (guiAxisSlider.activeGuiPointer === pointerState.guiPointer) {
                if (pointerState.action[0]) {
                    onInputUpdated(guiAxisSlider, pointerState)
                } else {
                    onSurfaceRelease(guiAxisSlider)
                }
            }
        };

        let frameUpdate = function(tpf, time) {
            onFrameUpdate(guiAxisSlider, tpf, time)
        };

        this.callbacks = {
            onPressStart:pressStart,
            onInputUpdate:inputUpdate,
            onFrameUpdate:frameUpdate
        }
    };

    initGuiWidget = function(widgetConfig, onReady) {
        let widgetRdy = function(widget) {
            widget.applyWidgetOptions(this.options)
            widget.getWidgetSurface().addOnPressStartCallback(this.callbacks.onPressStart);
            widget.enableWidgetInteraction();
            onReady(this)
        }.bind(this);
        this.guiWidget = new GuiWidget(widgetConfig);
        this.guiWidget.initGuiWidget(null, widgetRdy);
        GuiAPI.addInputUpdateCallback(this.callbacks.onInputUpdate);
        ThreeAPI.addPrerenderCallback(this.callbacks.onFrameUpdate);
    };

    addInputUpdateCallback = function(applyInputUpdate) {
        this.applyInputCallbacks.push(applyInputUpdate)
    };

    removeGuiWidget = function() {
        ThreeAPI.unregisterPrerenderCallback(this.callbacks.onFrameUpdate);
        GuiAPI.removeInputUpdateCallback(this.callbacks.onInputUpdate);
        MATH.emptyArray(this.applyInputCallbacks);
        this.guiWidget.recoverGuiWidget()
    };

}

export { GuiAxisSlider }