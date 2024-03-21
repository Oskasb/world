import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";

let tempVec = new Vector3();
let frustumFactor = 0.828;
class DomEditLocations {
    constructor() {
        this.statusMap = {};

        let htmlReady = function() {
            let locationsData = GameAPI.worldModels.getActiveLocationData();
            let worldModels = GameAPI.worldModels.getActiveWorldModels();
            console.log([worldModels, locationsData]);
            ThreeAPI.registerPrerenderCallback(update);
        }

        let visibleWorldModels = [];
        let locationModelDivs = [];

        let divClicked = function(e) {
            let model = e.target.value
            console.log("Edit Activated", model);
        }

        let update = function() {
            let locationsData = GameAPI.worldModels.getActiveLocationData();
            let worldModels = GameAPI.worldModels.getActiveWorldModels();
            MATH.emptyArray(visibleWorldModels);
            for (let i = 0; i < worldModels.length; i++) {

                let pos = worldModels[i].getPos();

                if (ThreeAPI.testPosIsVisible(pos)) {
                    visibleWorldModels.push(worldModels[i]);
                }


            }



            while (locationModelDivs.length < visibleWorldModels.length) {
                let div = DomUtils.createDivElement(document.body, 'model_'+visibleWorldModels.length, 'EDIT', 'button')
                DomUtils.addClickFunction(div, divClicked);
                locationModelDivs.push(div);
            }

            while (locationModelDivs.length > visibleWorldModels.length) {
                DomUtils.removeDivElement(locationModelDivs.pop());
            }



            for (let i = 0; i < visibleWorldModels.length; i++) {
                let model = visibleWorldModels[i];
                let div = locationModelDivs[i];
                let pos = model.getPos();
                div.value = model;
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:pos, color:'YELLOW'});
                ThreeAPI.toScreenPosition(pos, tempVec);
                div.style.top = 50-tempVec.y*(100/frustumFactor)+"%";
                div.style.left = 50+tempVec.x*(100/frustumFactor)+"%";
            }

        }

        let close = function() {
            while (locationModelDivs.length) {
                DomUtils.removeDivElement(locationModelDivs.pop());
            }
        }

        this.call = {
            htmlReady:htmlReady,
            update:update,
            close:close
        }

    }

    initDomEditLocations(closeCb) {
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.hideOtherRootElements();
        this.htmlElement.initHtmlElement('edit_locations', closeCb, this.statusMap, 'edit_frame', this.call.htmlReady);
    }

    closeDomEditLocations() {
        this.call.close();
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.htmlElement.revealHiddenRootElements();
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEditLocations }