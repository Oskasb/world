
function updateValueElem(key, value, iframe) {
    let valueText = iframe.getElementById(key+'_value');
    if (valueText) {
        valueText.innerHTML = value;
    }
}

class HtmlElement {
    constructor() {
        this.id = "";
        this.container = null;
        this.iframe = null;
        this.statusMap = null;
        this.editStatus = null;
        let iframeDocument = null;
        let update = function() {

            let statusMap = this.statusMap;

            if (!iframeDocument) {
                return;
            }

            for (let key in statusMap) {
                let elem = iframeDocument.getElementById(key);
                if (elem) {
                    if (elem.type === 'range') {
                        statusMap[key] = elem.value;
                        updateValueElem(key, elem.value, iframeDocument)
                    } else {
                        elem.innerHTML = statusMap[key];
                    }
                }
            }

        }.bind(this);

        let setIframe = function(iDoc) {
            iframeDocument = iDoc;
        }

        let getChildElement = function(id) {
            if (iframeDocument) {
                return iframeDocument.getElementById(id);
            }

        }

        this.call = {
            getChildElement:getChildElement,
            setIframe:setIframe,
            update:update
        }

    }

    initHtmlElement(url, onCloseCB, statusMap, styleClass) {
        let containerClass = styleClass || 'full_screen'
        this.statusMap = statusMap;
        this.editStatus = {};
        for (let key in statusMap) {
            this.editStatus[key] = statusMap[key];
        }
        this.id = url;
    //    this.container = DomUtils.createDivElement(DomUtils.refDiv, this.id, "", "overlay_page")
        let file = "html/"+url+".html";
    //    this.container.innerHTML='<object type="text/html" data='+file+'></object>';

        this.iframe = null;

        let onLoad = function() {
            let iframeDocument = this.container.contentDocument || this.container.contentWindow.document;
            this.call.setIframe(iframeDocument);
            let overlay = iframeDocument.getElementById('container');
            let closeButton = DomUtils.createDivElement(overlay, this.id+'_close', "", "button_close")
            closeButton.style.pointerEvents = "auto";
            closeButton.style.cursor = "pointer";
            DomUtils.addClickFunction(closeButton, onCloseClick)
        //    console.log("Iframe Loaded", file, this);
            for (let key in statusMap) {
                let elem = iframeDocument.getElementById(key);
                if (elem) {
                    if (elem.type === 'range') {
                        elem.value = statusMap[key];
                        updateValueElem(key, elem.value, iframeDocument)
                    }
                }
            }

        }.bind(this)

        let onCloseClick = function(e) {
            console.log("Close Clicked", e, this);

            this.closeHtmlElement();
            onCloseCB();
        }.bind(this);

        this.container = DomUtils.createIframeElement('canvas_window', this.id, file, containerClass, onLoad)

        let rebuild = function() {

            if (this.container) {
                DomUtils.removeElement(this.container);
                this.container = DomUtils.createIframeElement('canvas_window', this.id, file, containerClass, onLoad)
            } else {
                clearInterval(reload);
            }

        }.bind(this);

    //    let reload = setInterval(rebuild, 1000)

        ThreeAPI.addPrerenderCallback(this.call.update);

    }



    closeHtmlElement() {
        DomUtils.removeElement(this.container);
        this.container = null;
        this.statusMap = null;
        this.editStatus = null;
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
    }

}

export {HtmlElement}