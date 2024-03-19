import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";

class DomEnvEdit {
    constructor() {

    }

    initDomEnvEdit(statusMap, closeCb) {
        this.htmlElement = poolFetch('HtmlElement')
        console.log("initDomEnvEdit", statusMap);
        this.htmlElement.initHtmlElement('env_edit', closeCb, statusMap, 'edit_frame');
        this.htmlElement.hideOtherRootElements();
    }

    closeDomEnvEdit() {
        this.htmlElement.revealHiddenRootElements();
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEnvEdit }