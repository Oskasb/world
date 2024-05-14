import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {MATH} from "../../MATH.js";
import {paletteKeys} from "../../../game/visuals/Colors.js";
import {detachConfig, saveAdventureEdits} from "../../utils/ConfigUtils.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {addNodeToAdventureAtPos} from "../../utils/AdventureUtils.js";

let operationsList = [
    "ADD_NODE"
]

let tempVec = new Vector3();
let tempVec2 = new Vector3();

class DomEditAdventureNodes {
    constructor() {

        let stausMap = {
            header:"xx",
            operation:"xx"
        };
        this.statusMap = stausMap;
        let rootElem = null;

        let htmlElem;
        let applyOperationDiv = null;
        let selectedOperation = "";

        let visualEdgeCircle;

        let adventure = null;
        let operationSelect = null;

        let pathLineToNext = null;

        let pathLines = [];
        let pathPoints = [];

        let lastDst = new Vector3();

        let updateSelectedOperation = function() {
       //     closeEditAttach()
            console.log("updateSelectedOperation", selectedOperation)
            if (selectedOperation === "") {
                applyOperationDiv.style.opacity = "0.4";
            } else {
                applyOperationDiv.style.opacity = "1";
            }
            applyOperationDiv.innerHTML = selectedOperation;

            if (selectedOperation === "ATTACH") {

            }

        }


        let applyOperation = function(e) {
            console.log("Apply", selectedOperation);

            if (selectedOperation === 'ADD_NODE') {
                let pos = ThreeAPI.getCameraCursor().getLookAroundPoint();
                addNodeToAdventureAtPos(adventure, pos);
            }

        }

        let htmlReady = function(htmlEl) {
            selectedOperation = operationsList[0];
            htmlElem = htmlEl;
            rootElem = htmlEl.call.getRootElement();

            applyOperationDiv = htmlElem.call.getChildElement('apply_operation');
            operationSelect = htmlElem.call.getChildElement('operation');
            operationSelect.value = selectedOperation;
            DomUtils.addClickFunction(applyOperationDiv, applyOperation)

            rootElem.style.transition = 'none';
            htmlElem.call.populateSelectList('operation', operationsList)
            updateSelectedOperation();
        }

        function setAdventure(adv) {
            adventure = adv;
            visualEdgeCircle = poolFetch('VisualEdgeCircle')
            visualEdgeCircle.on();

            ThreeAPI.registerPrerenderCallback(update);
        }


        function getAdventure() {
            return adventure;
        }

        function clearIndicators() {
            visualEdgeCircle.off();
            poolReturn(visualEdgeCircle);
            visualEdgeCircle = null;

            if (pathLineToNext !== null) {
                pathLineToNext.off();
                poolReturn(pathLineToNext);
                pathLineToNext = null;
            }

            while (pathLines.length) {
                let line = pathLines.pop();
                line.off();
                poolReturn(line);
            }

            while (pathPoints.length) {
                let circle = pathPoints.pop();
                circle.off();
                poolReturn(circle);
            }
        }

        function update() {

            let pos = adventure.getPos();
            let radius = adventure.config.radius;

            let nodes = adventure.config.nodes

            tempVec.copy(pos);
            for (let i = 0; i < nodes.length; i++) {

                if (pathLines.length < i) {
                    MATH.vec3FromArray(tempVec2, nodes[i].pos)

                    let circle = poolFetch('VisualEdgeCircle')
                    circle.on();
                    circle.setPosition(tempVec2);
                    circle.setRadius(2);
                    pathPoints.push(circle);
                    let line = poolFetch(('VisualEdgeLine'))
                    line.on();
                    line.from.copy(tempVec);
                    line.to.copy(tempVec2);
                    tempVec.copy(tempVec2);
                    pathLines.push(line);
                }
                MATH.vec3FromArray(tempVec, nodes[i].pos)
            }

            if (nodes.length !== 0) {
                MATH.vec3FromArray(tempVec, nodes[nodes.length -1].pos)
            }

        //    if (adventure !== null) {

        //    }
        //    MATH.roundVectorPlane(ThreeAPI.getCameraCursor().getPos(), targetObj3d.position, drawResolution);
            visualEdgeCircle.setPosition(pos);
            visualEdgeCircle.setRadius(radius);


            if (selectedOperation === 'ADD_NODE') {
                let dst = ThreeAPI.getCameraCursor().getLookAroundPoint();

                if (MATH.distanceBetween(tempVec, dst) > 0.5) {
                    if (pathLineToNext === null) {
                        pathLineToNext = poolFetch(('VisualEdgeLine'))
                        pathLineToNext.on()
                    }
                    if ( lastDst.distanceToSquared(dst) > 0.001) {
                        pathLineToNext.from.copy(tempVec);
                        pathLineToNext.to.copy(dst);
                        pathLineToNext.recalcPoints = true;
                    }

                } else {
                    if (pathLineToNext !== null) {
                        pathLineToNext.off();
                        poolReturn(pathLineToNext);
                        pathLineToNext = null;
                    }
                }

                lastDst.copy(dst);

            }

        }

        let close = function() {

            clearIndicators()




        }

        this.call = {
            close:close,
            update:update,
            htmlReady:htmlReady,
            setAdventure:setAdventure,
            getAdventure:getAdventure
        }

    }

    initEditTool(closeCb) {
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_adventure_nodes', closeCb, this.statusMap, 'edit_frame edit_frame_taller', this.call.htmlReady);
    }

    closeEditTool() {
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.call.close();
        this.htmlElement.closeHtmlElement();
        if (!this.htmlElement) {
            console.log("Element already removed")
        } else {
            poolReturn(this.htmlElement);
        }
        this.htmlElement = null;
    }

}

export { DomEditAdventureNodes }