import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {ENUMS} from "../../ENUMS.js";
import {detachConfig, listifyConfig, saveAdventureEdits, saveWorldModelEdits} from "../../utils/ConfigUtils.js";
import {ConfigData} from "../../utils/ConfigData.js";
import {WorldModel} from "../../../game/gameworld/WorldModel.js";
import {WorldAdventure} from "../../../game/gamescenarios/WorldAdventure.js";

let applyContainerDiv = null;
let idLabelDiv = null;

let buttonLayer = null;

let toolsList = [
    "EDIT",
    "ADD",
    "CONFIG"
]

let adventures = [""];
let configs = null;

class DomEditAdventure {
    constructor() {

        let addToolStatusMap = {}
        addToolStatusMap.activateSelection = applySelection;
        addToolStatusMap.selectionUpdate = selectionUpdate;
        addToolStatusMap.loadTemplate = loadTemplate;
        addToolStatusMap.root = "world";
        addToolStatusMap.folder = "adventure";

        let editObj3d = new Object3D();

        if (configs === null) {
            configs = {};
            listifyConfig("WORLD_ADVENTURE","ADVENTURES", adventures, configs)
            addToolStatusMap.selectList = adventures;
        }

        this.statusMap = {
            selectedTool: "",
            selection: "--select--"
        };

        let statusMap = this.statusMap;
        let rootElem = null;
        let htmlElem;
        let selectedTool = "";
        let editCursors = {};
        let activeCursor = null;
        let applyOperationDiv = null;
        let toolSelectDiv = null;
        let visibleWorldModels = [];
        let locationModelDivs = [];
        let activeTool = null;


        function onClick(e) {
            console.log("Model Cursor Click", e)
        }

        function applyCursorUpdate(obj3d, elevate, grid) {
            /*
            modelConfig.grid = grid;
            modelConfig.elevate = elevate;
            MATH.vec3ToArray(obj3d.position, modelConfig.pos, 100)
            MATH.rotObj3dToArray(obj3d, modelConfig.rot, 1000);
            if (previewModel !== null) {
                previewModel.call.applyEditCursorUpdate(obj3d);
            }

             */
        }

        function closeActiveCursor() {
            activeCursor.closeDomEditCursor();
            poolReturn(activeCursor);
            activeCursor = null;
        }

        function activateCursor() {
            activeCursor = poolFetch('DomEditCursor')
            activeCursor.initDomEditCursor(closeActiveCursor, editObj3d, applyCursorUpdate, onClick);
            if (typeof (modelConfig.grid) === 'number') {
                activeCursor.call.setGrid(modelConfig.grid)
            }
        }

        function applySelection(id) {
            console.log("Apply Selection ", id, configs[id]);
            // saveAdventureEdits(newWmodel);
        }

        function selectionUpdate(id) {

            if (id !== "") {

            }

        }

        function loadTemplate(statMap) {
            console.log("loadTemplate:", statMap, addToolStatusMap);
            let pos = ThreeAPI.getCameraCursor().getLookAroundPoint();
            MATH.vec3ToArray(pos, addToolStatusMap.config.pos);
            statMap.parent.call.applyLoadedConfig(addToolStatusMap.config, statMap.id, true);
            saveAdventureEdits(statMap.parent);
        }



        function closeTool() {

            if (activeCursor !== null) {
                activeCursor.closeDomEditCursor()
                poolReturn(activeCursor);
                activeCursor = null;
            }

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

            if (selectedTool === "ADD") {
                activeTool = poolFetch('DomEditAdd');


                let parent = new WorldAdventure()
                parent.getPos().copy(ThreeAPI.getCameraCursor().getLookAroundPoint())
                let config = detachConfig(parent.config)
                MATH.vec3ToArray(parent.getPos(), config.pos, 1);
                config.edit_id = "tpl_"+config.edit_id
                addToolStatusMap.parent = parent;
                addToolStatusMap.config = config;
                activeTool.call.setStatusMap(addToolStatusMap)
                activeTool.initEditTool(closeTool);
            }

            if (selectedTool === "CONFIG" || selectedTool === "EDIT") {
                buttonLayer = poolFetch('DomWorldButtonLayer');
                buttonLayer.initWorldButtonLayer(GameAPI.worldModels.getActiveWorldModels(), selectedTool, divClicked)
            }

        }

        let htmlReady = function(el) {
            htmlElem = el;
            let locationsData = GameAPI.worldModels.getActiveLocationData();
            let worldModels = GameAPI.worldModels.getActiveWorldModels();
            toolSelectDiv = htmlElem.call.getChildElement('tool');
            applyOperationDiv = htmlElem.call.getChildElement('apply_tool');
            applyContainerDiv = htmlElem.call.getChildElement('apply_container');
            idLabelDiv = htmlElem.call.getChildElement('selection_value');
            htmlElem.call.populateSelectList('tool', toolsList)
            console.log([worldModels, locationsData]);
            rootElem = htmlElem.call.getRootElement();
            ThreeAPI.registerPrerenderCallback(update);

            let selectedActor = GameAPI.getGamePieceSystem().selectedActor;
            if (selectedActor) {
                selectedActor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_INACTIVE)
            }

        }


        let closeActiveTool = function() {
            console.log("Adventure Edit Closed");
            if (activeTool !== null) {
                activeTool.closeEditTool();
                poolReturn(activeTool)
                activeTool = null;
            }
        }

        let closeEditCursor = function(htmlElem) {
            let cursor = htmlElem.cursor;
            let model = htmlElem.model;
            if (model === null) {
                return;
            }
            editCursors[model.id] = false;
            htmlElem.cursor = null;
            htmlElem.model = null;
            cursor.closeDomEditCursor();
            poolReturn(cursor);
        }

        let divClicked = function(e) {
            let model = e.target.value
            console.log("Activated", selectedTool, model);
            idLabelDiv.innerHTML = model.id;
            model.config = detachConfig(model.config);

            if (selectedTool === "EDIT") {
                if (typeof (editCursors[model.id]) !== 'object') {
                    e.target.style.visibility = "hidden";
                    let cursor = poolFetch('DomEditCursor')

                    let onClick = function(crsr) {
                        console.log("Clicked Cursor", crsr)
                        closeEditCursor(crsr.htmlElement);
                        idLabelDiv.innerHTML = model.id;
                        if (activeTool === null) {
                            activeTool = poolFetch('DomEditWorldModel')
                            activeTool.call.setWorldModel(model);
                            activeTool.initDomEditWorldModel(closeActiveTool)
                        } else {
                            let mdl = activeTool.call.getWorldModel();
                            if (mdl === model) {
                                closeActiveTool();
                            } else {
                                activeTool.call.setWorldModel(model);
                            }
                        }
                    }

                    cursor.initDomEditCursor(closeEditCursor, model.obj3d, model.call.applyEditCursorUpdate, onClick);
                    if (typeof (model.config.grid) === 'number') {
                        cursor.call.setGrid(model.config.grid)
                    }
                    cursor.htmlElement.cursor = cursor;
                    cursor.htmlElement.model = model;
                    editCursors[model.id] = cursor;
                }
            }

            if (selectedTool === 'CONFIG') {
                closeActiveTool();
                activeTool = poolFetch('DomEditConfig');
                let map = {
                    id:model.id,
                    root:"model",
                    folder: GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL),
                    parent:model,
                    config:model.config,
                    onEditCB:model.call.applyLoadedConfig
                }
                activeTool.initEditTool(closeActiveTool, map)
            }
        }

        let update = function() {

            editObj3d.position.copy(ThreeAPI.getCameraCursor().getLookAroundPoint());

            if (toolSelectDiv.value !== selectedTool) {
                statusMap.tool = toolSelectDiv.value
                selectedTool = statusMap.tool;
                setSelectedTool(toolSelectDiv.value)
            }

        }

        function closeEditCursors() {
            for (let key in editCursors) {
                if (editCursors[key] !== false) {
                    if (typeof(editCursors[key].closeCb) !== 'function' ) {
                        console.log("Bad Edit cursor close",editCursors[key], key, editCursors)
                        return
                    }
                    editCursors[key].closeCb(editCursors[key].htmlElement)
                    editCursors[key] = false;
                }
            }
        }

        let close = function() {

            idLabelDiv.innerHTML = "--No Selection--";
            while (locationModelDivs.length) {
                DomUtils.removeDivElement(locationModelDivs.pop());
            }
            closeEditCursors()
            if (buttonLayer !== null) {
                buttonLayer.closeWorldButtonLayer();
                buttonLayer = null;
            }
        }

        this.call = {
            htmlReady:htmlReady,
            update:update,
            close:close
        }

    }


    initEditTool(closeCb, onReady) {

        let readyCb = function() {
            this.call.htmlReady(this.htmlElement)
            if (typeof (onReady) === 'function') {
                onReady(this);
            }
        }.bind(this)
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('tool_selector', closeCb, this.statusMap, 'edit_frame tool_selector', readyCb);
    }

    closeEditTool() {
        this.call.close();
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEditAdventure }