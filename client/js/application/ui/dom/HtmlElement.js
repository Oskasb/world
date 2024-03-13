
let index = 0;

function updateValueElem(key, value, iframe) {
    let valueText = iframe.getElementById(key+'_value');
    if (valueText) {
        valueText.innerHTML = value;
    }
}

function windowResized(iframe, width, height) {
    if (width > height) {
        iframe.body.style.fontSize = height*0.008+'pt';
    } else {
        iframe.body.style.fontSize = width*0.008+'pt';
    }
}

class HtmlElement {
    constructor() {
        this.id = "";
        this.container = null;
        this.iframe = null;
        this.statusMap = null;
        this.editStatus = null;
        let width = null;
        let height = null;
        let iframeDocument = null;
        let update = function() {

            if (!iframeDocument) {
                return;
            }

            if (width !== innerWidth || height !== innerHeight) {
                width = innerWidth;
                height = innerHeight;
                windowResized(iframeDocument, width, height)
            }

            let statusMap = this.statusMap;

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
            width = null;
            height = null;
            iframeDocument = iDoc;
        }

        let getIframe = function() {
            return iframeDocument;
        }

        let getRootElement = function() {
            return DomUtils.getElementById(this.id)
        }.bind(this);

        let getChildElement = function(id) {
            if (iframeDocument) {
                return iframeDocument.getElementById(id);
            }

        }

        this.call = {
            getChildElement:getChildElement,
            setIframe:setIframe,
            getIframe:getIframe,
            getRootElement:getRootElement,
            update:update
        }

    }

    initHtmlElement(url, onCloseCB, statusMap, styleClass, readyCb) {
        let containerClass = styleClass || 'full_screen'

        if (this.container !== null) {
            this.closeHtmlElement();
        }

        this.statusMap = statusMap;
        this.editStatus = {};
        for (let key in statusMap) {
            this.editStatus[key] = statusMap[key];
        }
        index++;
        this.id = url+"_"+index;
    //    this.container = DomUtils.createDivElement(DomUtils.refDiv, this.id, "", "overlay_page")
        let file = "html/"+url+".html";
    //    this.container.innerHTML='<object type="text/html" data='+file+'></object>';

        this.iframe = null;

        let onLoad = function() {

            //    container.style.rotate = "360deg";

            this.showHtmlElement()

            let iframeDocument = this.container.contentDocument || this.container.contentWindow.document;
        //    DomUtils.applyStyleToAllDivs(iframeDocument, 'transform', "translate3d(0, 0, 2pt)")
            this.container.style.transform = "rotate3d(1, 0, 0, 1.0rad) translate3d(0, 400em, 0)";
            this.container.style.scale = 0;
            this.call.setIframe(iframeDocument);
            let closeAnchor = iframeDocument.getElementById('anchor_close');
            if (!closeAnchor) {
                closeAnchor = iframeDocument.getElementById('container');
            }

            if (typeof (onCloseCB) === 'function') {
                let closeButton = DomUtils.createDivElement(closeAnchor, this.id+'_close', "", "button_close")
                closeButton.style.pointerEvents = "auto";
                closeButton.style.cursor = "pointer";
                DomUtils.addClickFunction(closeButton, onCloseClick)
            }

            let backdrop = iframeDocument.getElementById('backdrop')
            if (backdrop) {
                DomUtils.addClickFunction(backdrop, onCloseClick)
            }


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

            if (typeof (readyCb) === 'function') {
                readyCb(this);
            }

            ThreeAPI.addPrerenderCallback(this.call.update);

        }.bind(this)

        let onCloseClick = function(e) {
            console.log("Close Clicked", e, this);
            this.hideHtmlElement();
            onCloseCB();
        }.bind(this);

        this.container = DomUtils.createIframeElement('canvas_window', this.id, file, containerClass, onLoad)
        this.container.style.display = "none";
        this.container.style.visibility = "hidden";
        this.container.style.opacity = 0;
        let rebuild = function() {

            if (this.container) {
                DomUtils.removeElement(this.container);
                this.container = DomUtils.createIframeElement('canvas_window', this.id, file, containerClass, onLoad)
            } else {
                if (reload) {
                    clearInterval(reload);
                }
            }

        }.bind(this);

   //     let reload = setInterval(rebuild, 2000)



        return rebuild;

    }

    showHtmlElement() {
        let container = this.container;
        container.style.transform = "rotate3d(0, 0, 0, 1.0rad) translate3d(0, 0, 0)";
        container.style.display = "";
        setTimeout(function() {
            container.style.visibility = "visible";
            container.style.transition = "all 1.0s cubic-bezier(0.1, 0.4, 0.1, 1.2)"
            container.style.opacity = 1;
            container.style.scale = 1;
            container.style.transform = "rotate3d(0, 0, 0, 1.0rad) translate3d(0, 0, 0)";
        }, 1)
    }

    hideHtmlElement() {
        if (this.container !== null) {
            let container = this.container
            container.style.scale = 0;
            container.style.opacity = 0;
            container.style.transform = "rotate3d(1, 0, 0, 1.0rad) translate3d(0, 400em, 0)";
        }
    }


    closeHtmlElement() {
    //    this.hideHtmlElement();
        if (this.container !== null) {
            DomUtils.removeElement(this.container);
        }
        this.container = null;
        this.statusMap = null;
        this.editStatus = null;
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
    }

}

export {HtmlElement}