import {paletteMap} from "./Colors.js";

class VisualModelPalette {

    constructor() {
        this.instance = null;

        this.onUpdateCallbacks = [];

        this.colorParams = {x:0, y:0, z:0, w:0};
        this.settings = {x:0, y:0, z:0, w:0};

    }

    applyPaletteSelection(selection, instance) {

        if (!selection) {
            selection = 'DEFAULT'
        }

        let palette = paletteMap[selection];
        this.colorParams.x = palette.colors.x;
        this.colorParams.y = palette.colors.y;
        this.colorParams.z = palette.colors.z;
        this.colorParams.w = palette.colors.w;

        this.settings.x = palette.settings.x;
        this.settings.y = palette.settings.y;
        this.settings.z = palette.settings.z;
        this.settings.w = palette.settings.w;

        if (instance) {
            this.applyPaletteToInstance(instance);
        }
    }

    applyPaletteToInstance(instance) {
        if (instance.getSpatial().call.isInstanced()) {
            instance.setAttributev4('texelRowSelect', this.colorParams);
            // solidity, saturation, blendStrength, skew (makes color go across rows)
            instance.setAttributev4('sprite', this.settings);
            MATH.callAll(this.onUpdateCallbacks, this.colorParams, this.settings);
        }

    }

    setFromValuearray(array) {
        this.colorParams.x = array[0];
        this.colorParams.y = array[1];
        this.colorParams.z = array[2];
        this.colorParams.w = array[3];

        this.settings.x = array[4];
        this.settings.y = array[5];
        this.settings.z = array[6];
        this.settings.w = array[7];
        MATH.callAll(this.onUpdateCallbacks, this.colorParams, this.settings);
    }

    closePalette() {
        MATH.emptyArray(this.onUpdateCallbacks);
    }

}

export {VisualModelPalette}