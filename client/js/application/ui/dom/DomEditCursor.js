import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";

let tempVec = new Vector3();
let frustumFactor = 0.828;

let index = 0;

function applyStatusUpdate(statusMap, updateObj3d) {
    // MATH.eulerFromQuaternion()
    updateObj3d.rotation.x = statusMap.rotX // - model.obj3d.rotation.x)
    updateObj3d.rotation.y = statusMap.rotY
    updateObj3d.rotation.z = statusMap.rotZ

}

class DomEditCursor {
    constructor() {
        index++;
        this.id = "edit_cursor_"+index;

        this.initObj3d = new Object3D();
        let targetObj3d = new Object3D();
        let updateObj3d = new Object3D();
        this.onUpdateCallbacks = [];

        this.statusMap = {
            rotX:0,
            rotY:0,
            rotZ:0,
            posX:0,
            posY:0,
            posZ:0
        };

        let rootElem = null;

        let htmlElem;

        let initEditStatus = function(obj3d) {
            targetObj3d.copy(obj3d);
            updateObj3d.position.set(0, 0, 0);
            updateObj3d.scale.set(1, 1, 1);
            updateObj3d.quaternion.set(0, 0, 0, 1);
            this.statusMap.rotX = 0;
            this.statusMap.rotY = 0;
            this.statusMap.rotZ = 0;

        }.bind(this);

        let worldModel = null;



        let htmlReady = function(htmlEl) {
            initEditStatus(this.initObj3d);
            htmlElem = htmlEl;
            rootElem = htmlEl.call.getRootElement();
            rootElem.style.transition = 'none';
            ThreeAPI.registerPrerenderCallback(update);
        }.bind(this);


        let nodeDivs = [];

        let applyEdits = function() {
            applyStatusUpdate(this.statusMap, updateObj3d)
        }.bind(this);

        let update = function() {

            rootElem.style.transition = 'none';
            rootElem.style.transform = "translate3d(-50%, -50%, 0)";
            applyEdits()

                let div = rootElem;
                let pos = targetObj3d.position;
                ThreeAPI.toScreenPosition(pos, tempVec);
                div.style.top = 50-tempVec.y*(100/frustumFactor)+"%";
                div.style.left = 50+tempVec.x*(100/frustumFactor)+"%";

        };

        let close = function() {
            while (nodeDivs.length) {
                DomUtils.removeDivElement(nodeDivs.pop());
            }
        }

        this.call = {
            htmlReady:htmlReady,
            update:update,
            close:close
        }

    }

    initDomEditCursor(closeCb, initObj3d, onUpdate) {
        this.onUpdateCallbacks.push(onUpdate);
        this.initObj3d.copy(initObj3d);
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_cursor', closeCb, this.statusMap, 'edit_cursor', this.call.htmlReady);
    }

    closeDomEditCursorl() {
        MATH.emptyArray(this.onUpdateCallbacks);
        this.call.close();
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEditCursor }