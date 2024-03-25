import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {paletteKeys} from "../../../game/visuals/Colors.js";
import {ENUMS} from "../../ENUMS.js";
import {physicalAlignYGoundTest, testProbeFitsAtPos} from "../../utils/PhysicsUtils.js";

let tempVec = new Vector3();
let frustumFactor = 0.828;
let encounterConfigs = null;
let worldEncounters = null;

let operationsList = [
    "",
    "FLATTEN",
    "ELEVATE",
    "HIDE"
]

function worldModelOperation(wModel, operation) {

    if (operation === "ELEVATE") {
        wModel.obj3d.position.y += 1;
        wModel.applyObj3dUpdate()
    }

    if (operation === "HIDE") {
        if (wModel.hidden !== true) {
            wModel.setHidden(true);
        } else {
            wModel.setHidden(false);
        }
    }

    if (operation === "FLATTEN") {
        wModel.applyObj3dUpdate();
        let box = wModel.box;
        ThreeAPI.alignGroundToAABB(box);
    }

}


class DomEditEncounter {
    constructor() {

        this.targetObj3d = new Object3D();
        this.updateObj3d = new Object3D();

        this.statusMap = {

        };

        let statusMap = this.statusMap;

        let rootElem = null;
        let htmlElem;
        let applyOperationDiv = null;
        let nodeDivs = [];
        let selectedOperation = "";

        let initEditStatus = function(obj3d) {

        }.bind(this);
        let paletteVal = null;
        let worldModel = null;
        let operationSelect = null;

        let editCursors = {};
        let encounterEdit = null;
        let visibleWorldEncounters = [];
        let worldEncounterDivs = [];

        let updateSelectedOperation = function() {
            console.log("updateSelectedOperation")
            if (selectedOperation === "") {
                applyOperationDiv.style.opacity = "0.4";
            } else {
                applyOperationDiv.style.opacity = "1";
            }
            applyOperationDiv.innerHTML = selectedOperation;
        }

        let applyOperation = function(e) {
            console.log("Apply", selectedOperation);
            worldModelOperation(worldModel, selectedOperation);
        }

        let getWorldModel = function() {
            return worldModel;
        }


        let htmlReady = function(htmlEl) {
            encounterConfigs = GameAPI.worldModels.getEncounterConfigs();
            worldEncounters = GameAPI.worldModels.getWorldEncounters();
            console.log(worldEncounters, encounterConfigs);
            htmlElem = htmlEl;
            rootElem = htmlEl.call.getRootElement();
            ThreeAPI.registerPrerenderCallback(update);
        }

        let closeEditCursor = function(htmlElem) {
            let cursor = htmlElem.cursor;
            let encounter = htmlElem.encounter;
            editCursors[encounter.id] = false;
            htmlElem.cursor = null;
            htmlElem.encounter = null;
            cursor.closeDomEditCursor();
            poolReturn(cursor);
        }



        let divClicked = function(e) {
            let encounter = e.target.value
            console.log("Edit Activated", encounter);

            if (typeof (editCursors[encounter.id]) !== 'object') {
                e.target.style.visibility = "hidden";
                let cursor = poolFetch('DomEditCursor')

                let onClick = function(crsr) {
                    console.log("Clicked Cursor", crsr)
                }

                let onCursorUpdate = function(obj3d) {
                    physicalAlignYGoundTest(obj3d.position, obj3d.position, 3)
                    let fits = testProbeFitsAtPos(obj3d.position, 2)
                    if (fits === true) {
                        encounter.obj3d.copy(obj3d);
                        encounter.getHostActor().setSpatialPosition(obj3d.position);
                        encounter.getHostActor().setSpatialQuaternion(obj3d.quaternion);
                    }
                }

                cursor.initDomEditCursor(closeEditCursor, encounter.obj3d, onCursorUpdate, onClick);
                cursor.htmlElement.cursor = cursor;
                cursor.htmlElement.encounter = encounter;
                editCursors[encounter.id] = cursor;
            }
        }

        let update = function() {
        //    rootElem.style.transition = 'none';

            worldEncounters = GameAPI.worldModels.getWorldEncounters();
            MATH.emptyArray(visibleWorldEncounters)
            let camCursorDist = MATH.distanceBetween(ThreeAPI.getCameraCursor().getPos(), ThreeAPI.getCamera().position)
            for (let i = 0; i < worldEncounters.length; i++) {
                let pos = worldEncounters[i].getPos();
                let distance = MATH.distanceBetween(ThreeAPI.getCameraCursor().getPos(), pos)
                if (distance < 25 + camCursorDist*0.5) {
                    if (ThreeAPI.testPosIsVisible(pos)) {
                        visibleWorldEncounters.push(worldEncounters[i]);
                    }
                }
            }

            while (worldEncounterDivs.length < visibleWorldEncounters.length) {
                let div = DomUtils.createDivElement(document.body, 'encounter_'+visibleWorldEncounters.length, 'EDIT', 'button button_encounter_edit')
                DomUtils.addClickFunction(div, divClicked);
                worldEncounterDivs.push(div);
            }

            while (worldEncounterDivs.length > visibleWorldEncounters.length) {
                DomUtils.removeDivElement(worldEncounterDivs.pop());
            }

            for (let i = 0; i < visibleWorldEncounters.length; i++) {
                let encounter = visibleWorldEncounters[i];
                let div = worldEncounterDivs[i];
                let pos = encounter.getPos();
                div.value = encounter;

                ThreeAPI.toScreenPosition(pos, tempVec);
                div.style.top = 50-tempVec.y*(100/frustumFactor)+"%";
                div.style.left = 50+tempVec.x*(100/frustumFactor)+"%";

                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:pos, color:'RED'});
                tempVec.x = pos.x;
                tempVec.z = pos.z;
                tempVec.y = 0;
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:pos, to:tempVec, color:'RED'});
            }

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


    initDomEditEncounter(closeCb) {
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_encounter', closeCb, this.statusMap, 'edit_frame edit_encounter', this.call.htmlReady);
    }

    closeDomEditEncounter() {
        this.call.close();
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEditEncounter }