import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {ENUMS} from "../../ENUMS.js";


let tempVec = new Vector3();
let tempObj3d = new Object3D()
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
        let rotYDiv = null;
        let rotYSlider = null;
        this.onUpdateCallbacks = [];
        this.onClickCallbacks = [];

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


        let dragY = 0;
        let dragX = 0;
        let startDragX = 0;
        let startDragY = 0;
        let startOffsetTop = 0;
        let startOffsetLeft = 0;
        let dragDistanceY = 0;
        let dragDistanceX = 0;
        let moveX = 0;
        let moveY = 0;
        let dragActive = false;

        let mouseMove = function(e) {
            if (dragActive === true) {

                dragDistanceY = rootElem.offsetTop-startOffsetTop;
                dragDistanceX = rootElem.offsetLeft-startOffsetLeft

                if (e.touches) {
                    moveY = e.touches[0].pageY;
                    moveX = e.touches[0].pageX;
                } else {
                    moveY = e.pageY;
                    moveX = e.pageX;
                }


                dragY = moveY -startDragY + dragDistanceY;
                dragX = moveX -startDragX + dragDistanceX;
                tempObj3d.position.copy(ThreeAPI.getCamera().position);
                tempObj3d.position.y = targetObj3d.position.y;
                tempObj3d.lookAt(targetObj3d.position);
                updateObj3d.position.set(dragX * -0.1, 0, dragY* -0.1);
                updateObj3d.position.applyQuaternion(tempObj3d.quaternion);

            }
        }


        let centerClicked = function() {
            if (Math.abs(dragDistanceY) + Math.abs(dragDistanceX) < 0.5) {
                MATH.callAll(this.onClickCallbacks, this)
            }
            dragDistanceY = 0;
            dragDistanceX = 0;
        }.bind(this)

        let sourceTransition = null;

        let startDrag = function(e) {
            dragY = 0;
            dragX = 0;
            updateObj3d.position.set(0, 0, 0);
            dragActive = true;
            if (e.touches) {
                startDragY = e.touches[0].pageY;
                startDragX = e.touches[0].pageX;
            } else {
                startDragY = e.pageY;
                startDragX = e.pageX;
            }

            startOffsetTop = rootElem.offsetTop;
            startOffsetLeft = rootElem.offsetLeft;
            console.log("Drag Cursor", e);
            rootElem.style.zIndex = 5000;
        }

        let endDrag = function(e) {
            dragActive = false;
            rootElem.style.zIndex = '';
            dragY = 0;
            dragX = 0;
            console.log("endDrag Cursor", e);
            this.initObj3d.copy(targetObj3d);
            initEditStatus(this.initObj3d);
        }.bind(this);

        let initEditStatus = function(obj3d) {
            targetObj3d.copy(obj3d);
            updateObj3d.position.set(0, 0, 0);
            updateObj3d.scale.set(1, 1, 1);
            updateObj3d.quaternion.set(0, 0, 0, 1);
            this.statusMap.rotX = 0;
            this.statusMap.rotY = 0;
            this.statusMap.rotZ = 0;
            rotYSlider.value = "0"
        }.bind(this);

        let htmlReady = function(htmlEl) {
            htmlElem = htmlEl;
            rootElem = htmlEl.call.getRootElement();
            let translateDiv = htmlEl.call.getChildElement('translate')
            rotYDiv = htmlEl.call.getChildElement('rot_y')
            rotYSlider = htmlElem.call.getChildElement('rotY');
            DomUtils.addPressStartFunction(translateDiv, startDrag)
            DomUtils.addMouseMoveFunction(translateDiv, mouseMove);
            DomUtils.addPressEndFunction(translateDiv, endDrag);
            DomUtils.addClickFunction(translateDiv, centerClicked);
            DomUtils.addPointerExitFunction(translateDiv, endDrag);
            DomUtils.addPressEndFunction(rotYSlider, endDrag);
            DomUtils.addPointerExitFunction(rotYSlider, endDrag);
            initEditStatus(this.initObj3d);

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

            if (dragActive === true) {
                console.log("mouse Move", updateObj3d.position);
                targetObj3d.position.copy(this.initObj3d.position);
                targetObj3d.position.add(updateObj3d.position);
            }

            targetObj3d.position.y = Math.max(ThreeAPI.terrainAt(targetObj3d.position), 0)
            targetObj3d.quaternion.copy(this.initObj3d.quaternion);
            targetObj3d.quaternion.multiply(updateObj3d.quaternion);

            MATH.callAll(this.onUpdateCallbacks, targetObj3d);

            rotYDiv.style.rotate = -updateObj3d.rotation.y+"rad"

            let pos = targetObj3d.position;
            ThreeAPI.toScreenPosition(pos, tempVec);
            rootElem.style.top = 50-tempVec.y*(100/frustumFactor)+"%";
            rootElem.style.left = 50+tempVec.x*(100/frustumFactor)+"%";

        }.bind(this);

        let close = function() {
            while (nodeDivs.length) {
                DomUtils.removeDivElement(nodeDivs.pop());
            }
        }.bind(this);

        this.call = {
            htmlReady:htmlReady,
            update:update,
            close:close
        }

    }

    initDomEditCursor(closeCb, initObj3d, onUpdate, onClick) {
        this.closeCb = closeCb;
        this.onClickCallbacks.push(onClick);
        this.onUpdateCallbacks.push(onUpdate);
        this.initObj3d.copy(initObj3d);
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_cursor', closeCb, this.statusMap, 'edit_cursor', this.call.htmlReady);
    }

    closeDomEditCursor() {
        MATH.emptyArray(this.onUpdateCallbacks);
        MATH.emptyArray(this.onClickCallbacks);
        this.call.close();
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEditCursor }