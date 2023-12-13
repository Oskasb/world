import {paletteMap} from "./Colors.js";

class VisualModelPalette {

    constructor() {
        this.instance = null;
    }

    applyPaletteSelection(selection, instance) {

        if (!selection) {
            selection = 'DEFAULT'
        }

        let palette = paletteMap[selection];
        instance.setAttributev4('texelRowSelect', palette)

    }



}

export {VisualModelPalette}