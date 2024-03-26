import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";

class DomEnvEdit {
    constructor() {
        this.statusMap = {};
    }

    setStatusMap(statusMap) {
        this.statusMap = statusMap;
    }

    initEditTool(closeCb) {
        this.htmlElement = poolFetch('HtmlElement')
        console.log("initDomEnvEdit");
        this.htmlElement.initHtmlElement('env_edit', closeCb, this.statusMap, 'edit_frame edit_env');
    }

    closeEditTool() {
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEnvEdit }