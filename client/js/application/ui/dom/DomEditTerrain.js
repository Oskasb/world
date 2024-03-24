import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {paletteKeys} from "../../../game/visuals/Colors.js";


let tempVec = new Vector3();
let frustumFactor = 0.828;


let tools = [
    "FLATTEN",
    "ADD",
    "SUBTRACT"
]

let editEvent = {};

function operateEdit(tool, pos, statusMap) {
    editEvent.operation = tool;
    editEvent.pos = pos;
    editEvent.radius = statusMap.radius;
    editEvent.sharpness = statusMap.sharpness;
    editEvent.strength = statusMap.strength;
    evt.dispatch(ENUMS.Event.TERRAIN_APPLY_EDIT, editEvent);
}

class DomEditTerrain {
    constructor() {

        let targetObj3d = new Object3D();
        this.updateObj3d = new Object3D();

        this.statusMap = {
            radius:5,
            sharpness:0,
            strength:25
        };

        let visualEdgeCircle = null;

        let statusMap = this.statusMap;

        let rootElem = null;

        let htmlElem;
        let applyOperationDiv = null;
        let selectedTool = "";
        let toolSelect = null;


        let updateSelectedTool = function() {
            console.log("updateSelectedOperation")
            if (selectedTool === "") {
                applyOperationDiv.style.opacity = "0.4";
            } else {
                applyOperationDiv.style.opacity = "1";
            }
            applyOperationDiv.innerHTML = selectedTool;
        }

        let applyOperation = function(e) {
            console.log("Apply", selectedTool);
            operateEdit(selectedTool, targetObj3d.position, statusMap)
        }


        let htmlReady = function(htmlEl) {
            htmlElem = htmlEl;
            rootElem = htmlEl.call.getRootElement();
            htmlElem.call.populateSelectList('tool', tools)
            toolSelect = htmlElem.call.getChildElement('tool');
            applyOperationDiv = htmlElem.call.getChildElement('apply_tool');
            DomUtils.addClickFunction(applyOperationDiv, applyOperation);
            visualEdgeCircle = poolFetch('VisualEdgeCircle')
            visualEdgeCircle.on();
            ThreeAPI.registerPrerenderCallback(update);
        }

        let update = function() {
        //    rootElem.style.transition = 'none';
            targetObj3d.position.copy(ThreeAPI.getCameraCursor().getPos());
            visualEdgeCircle.setPosition(targetObj3d.position);
            visualEdgeCircle.setRadius(statusMap.radius);

            if (toolSelect.value !== selectedTool) {
                selectedTool = toolSelect.value
                updateSelectedTool()
            }



        };

        let close = function() {
            visualEdgeCircle.off();
            poolReturn(visualEdgeCircle);
            visualEdgeCircle = null;
        }

        this.call = {
            htmlReady:htmlReady,
            update:update,
            close:close
        }

    }


    initDomEditTerrain(closeCb) {
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_terrain', closeCb, this.statusMap, 'edit_frame edit_terrain', this.call.htmlReady);
    }

    closeDomEditTerrain() {
        this.call.close();
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEditTerrain }