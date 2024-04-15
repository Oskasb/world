import {ENUMS} from "../../ENUMS.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {poolReturn} from "../../utils/PoolUtils.js";

let tempVec = new Vector3();
let frustumFactor = 0.828;

class DomWorldButtonLayer {
    constructor() {

        let visibleElements = [];
        let worldElements = null;

        let buttonDivs = [];

        let label = "init";
        let onClick = null;

        function init(wElements, lbl, clickFunc) {
            label = lbl;
            onClick = clickFunc;
            worldElements = wElements;
            MATH.emptyArray(visibleElements);
            ThreeAPI.registerPrerenderCallback(update)
        }

        function update() {

            MATH.emptyArray(visibleElements);

                let camCursorDist = MATH.distanceBetween(ThreeAPI.getCameraCursor().getPos(), ThreeAPI.getCamera().position)
                for (let i = 0; i < worldElements.length; i++) {
                    let pos = worldElements[i].getPos();
                    let distance = MATH.distanceBetween(ThreeAPI.getCameraCursor().getPos(), pos)
                    if (distance < 25 + camCursorDist * 0.5) {
                        if (ThreeAPI.testPosIsVisible(pos)) {
                            visibleElements.push(worldElements[i]);
                        }
                    }
                }

                while (buttonDivs.length < visibleElements.length) {
                    let div = DomUtils.createDivElement(document.body, 'wbl_' + visibleElements.length, label, 'button')
                    DomUtils.addClickFunction(div, onClick);
                    buttonDivs.push(div);
                }


            while (buttonDivs.length > visibleElements.length) {
                DomUtils.removeDivElement(buttonDivs.pop());
            }

            for (let i = 0; i < visibleElements.length; i++) {
                let worldElement = visibleElements[i];
                let div = buttonDivs[i];
                let pos = worldElement.getPos();
                div.value = worldElement;

                ThreeAPI.toScreenPosition(pos, tempVec);
                div.style.top = 50-tempVec.y*(100/frustumFactor)+"%";
                div.style.left = 50+tempVec.x*(100/frustumFactor)+"%";

                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:pos, color:'YELLOW'});
                tempVec.x = pos.x;
                tempVec.z = pos.z;
                tempVec.y = 0;
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:pos, to:tempVec, color:'YELLOW'});
            }

        }

        let close = function() {
            ThreeAPI.unregisterPrerenderCallback(update)
            while (buttonDivs.length) {
                DomUtils.removeDivElement(buttonDivs.pop());
            }
            poolReturn(this);
        }.bind(this);

        this.call = {
            init:init,
            update:update,
            close:close
        }

    }

    initWorldButtonLayer(elementList, label, onClick) {
        this.call.init(elementList, label, onClick);
    }

    closeWorldButtonLayer() {
        this.call.close();
    }

}


export {DomWorldButtonLayer}