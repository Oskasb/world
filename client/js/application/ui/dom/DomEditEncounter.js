import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {ENUMS} from "../../ENUMS.js";
import {physicalAlignYGoundTest, testProbeFitsAtPos} from "../../utils/PhysicsUtils.js";


let tempVec = new Vector3();
let frustumFactor = 0.828;
let encounterConfigs = null;
let worldEncounters = null;

let toolsList = [
    "MOVE",
    "GRID",
    "SPAWN",
    "ADD"
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
            selectedTool: "",
            encounter: "--select--"
        };

        let statusMap = this.statusMap;

        let rootElem = null;
        let htmlElem;
        let applyOperationDiv = null;
        let nodeDivs = [];

        let worldModel = null;
        let toolSelect = null;
        let selectedTool = "";
        let editCursors = {};
        let encounterEdit = null;
        let visibleWorldEncounters = [];
        let worldEncounterDivs = [];
        let applyContainerDiv = null;
        let idLabelDiv = null;
        let activeTool = null;

        function closeTool() {
            if (activeTool !== null) {
                activeTool.closeEditTool();
                poolReturn(activeTool);
                activeTool = null;
            }
        }

        let setSelectedTool = function(tool) {
            close()
            selectedTool = tool;
            statusMap.selectedTool = tool;
            if (activeTool !== null) {
                closeTool();
            }
            console.log("setSelectedTool", tool)
            if (tool === "ADD") {
                applyOperationDiv.innerHTML = tool;
                applyContainerDiv.style.display = ""
            } else {
                applyContainerDiv.style.display = "none"
            }

        }




        let htmlReady = function(htmlEl) {
            htmlElem = htmlEl;
            encounterConfigs = GameAPI.worldModels.getEncounterConfigs();
            worldEncounters = GameAPI.worldModels.getWorldEncounters();
            toolSelect = htmlElem.call.getChildElement('tool');
            applyOperationDiv = htmlElem.call.getChildElement('apply_tool');
            applyContainerDiv = htmlElem.call.getChildElement('apply_container');
            idLabelDiv = htmlElem.call.getChildElement('encounter_value');
            htmlElem.call.populateSelectList('tool', toolsList)
            console.log(worldEncounters, encounterConfigs);
            rootElem = htmlElem.call.getRootElement();
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
            idLabelDiv.innerHTML = encounter.id;
            if (selectedTool === "MOVE") {
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

            if (selectedTool === "GRID") {
                closeTool();
                activeTool = poolFetch('DomEditGrid');
                activeTool.setWorldEncounter(encounter)
                activeTool.initEditTool(closeTool);
            }

            if (selectedTool === "SPAWN") {
                ThreeAPI.getCameraCursor().getLookAroundPoint().copy(encounter.getPos())
                closeTool();
                activeTool = poolFetch('DomEditSpawns');
                activeTool.setWorldEncounter(encounter)
                activeTool.initEditTool(closeTool);
            }

        }

        let update = function() {
        //    rootElem.style.transition = 'none';

            if (selectedTool !== toolSelect.value) {
                setSelectedTool(toolSelect.value)
            }

            MATH.emptyArray(visibleWorldEncounters)

            if (selectedTool !== "ADD") {
                if (activeTool === null) {
                    if (selectedTool !== "MOVE") {
                        idLabelDiv.innerHTML = "--No Selection--";
                    }
                    worldEncounters = GameAPI.worldModels.getWorldEncounters();
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
                        let div = DomUtils.createDivElement(document.body, 'encounter_'+visibleWorldEncounters.length, selectedTool, 'button button_encounter_edit')
                        DomUtils.addClickFunction(div, divClicked);
                        worldEncounterDivs.push(div);
                    }
                }
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

        function closeEditCursors() {
            for (let key in editCursors) {
                if (typeof (editCursors[key]) === 'object') {
                    editCursors[key].closeCb(editCursors[key].htmlElement)
                }
            }
        }

        let close = function() {
            idLabelDiv.innerHTML = "--No Selection--";
            while (worldEncounterDivs.length) {
                DomUtils.removeDivElement(worldEncounterDivs.pop());
            }
            closeEditCursors()
        }

        this.call = {
            htmlReady:htmlReady,
            update:update,
            close:close
        }

    }


    initEditTool(closeCb) {
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_encounter', closeCb, this.statusMap, 'edit_frame edit_encounter', this.call.htmlReady);
    }

    closeEditTool() {
        this.call.close();
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEditEncounter }