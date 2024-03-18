import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";

class DomPalette {
    constructor() {

    }

    initDomPalette(paletteValue, readyCb) {
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('palette', null, paletteValue, 'full_screen', readyCb);
    }

    closeDomPalette() {
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomPalette }