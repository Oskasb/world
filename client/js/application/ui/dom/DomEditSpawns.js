import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {ConfigData} from "../../utils/ConfigData.js";
import {colorMapFx} from "../../../game/visuals/Colors.js";
import {filterForWalkableTiles} from "../../../game/gameworld/ScenarioUtils.js";
import {detachConfig, loadSavedConfig, saveConfigEdits, saveEncounterEdits} from "../../utils/ConfigUtils.js";
import {ENUMS} from "../../ENUMS.js";

let tempVec = new Vector3();
let frustumFactor = 0.828;
let configData;

let spawnPresentEdits = [
    "MOVE",
    "COPY",
    "REMOVE"
]

let noSpawnEdits = [
    "ADD"
]

let spawns = [];
let patterns = {}
let onConfig = function(configs) {
 //   console.log(configs)
    for (let i = 0; i < configs.length; i++) {
        let id = configs[i].id;
        if (spawns.indexOf(id) === -1) {
            spawns.push(id);
        }
        patterns[id] = configs[i].data[0].config;
    }
}

setTimeout(function() {
    configData = new ConfigData("SPAWN", "SPAWN_PATTERNS",  false, false, false, onConfig)
}, 2000)

let radiusEvent = {}

let indicateSpawnPointRadius = function(pos, radius, rgba) {
    radiusEvent.heads = 1;
    radiusEvent.speed = 24;
    radiusEvent.radius = radius;
    radiusEvent.pos = pos;
    radiusEvent.rgba = rgba || colorMapFx.GLITTER_FX
    radiusEvent.elevation = 0;
    evt.dispatch(ENUMS.Event.INDICATE_RADIUS, radiusEvent)
}

class DomEditSpawns {
    constructor() {

        this.targetObj3d = new Object3D();
        this.updateObj3d = new Object3D();

        this.encounter = null;

        this.statusMap = {
            config_id:"",
            id:""
        };
        let cursorTile = null;
        let selectedPattern = null;
        let selectedPatternId = "";
        let statusMap = this.statusMap;
        let rootElem = null;
        let htmlElem;
        let config = null;
        let activeEncounterGrid = null;
        let selectSpawnPattern = null;
        let selectActivePattern = null;
        let tileDiv = null;
        let operateButtonDiv = null;

        let activeOperation = {
            operation:"",
            pattern:null
        }

        function removeSelectedPattern() {
            MATH.splice(config.spawn.patterns, selectedPattern);
            updatePatternAtCursor(null);
            saveEdits();
        }


        function addPatternAtTile(patternId, tile) {
            console.log("addPatternAtTile", patternId);
            let addPatternConfig = {
                pattern_id:patternId,
                tile:[tile.gridI, tile.gridJ]
            }
            config.spawn.patterns.push(addPatternConfig);
            let pattern = getSpawnByTile(tile);
            updatePatternAtCursor(pattern);
            saveEdits();
        }

        function operateSelection() {
            let operation = selectActivePattern.value;

            console.log("operateSelection", [cursorTile, operation, selectedPattern, config.spawn.patterns]);

            if (operation === "ADD") {
                console.log("Add Pattern ", [cursorTile, selectedPattern]);
                addPatternAtTile(selectSpawnPattern.value, cursorTile);
            }

            if (operation === "REMOVE") {
                removeSelectedPattern()
            }

            if (operation === "COPY") {
                activeOperation.operation = operation;
                activeOperation.pattern = selectedPattern;
            }
        }

        function gridLoaded(encGrid) {
            activeEncounterGrid = encGrid;
            ThreeAPI.registerPrerenderCallback(update);
        }

        let saveEdits = function() {
        //    this.encounter.config = config;
            saveEncounterEdits(this.encounter);
        }.bind(this);

        let configLoaded = function(cfg) {
            console.log("Config Loaded", cfg);
            if (cfg !== null) {
                config = cfg;
                this.encounter.config = config;
            }
        }.bind(this)

        let htmlReady = function(htmlEl) {
            console.log(configData)
            htmlElem = htmlEl;
            rootElem = htmlEl.call.getRootElement();
            selectSpawnPattern = htmlElem.call.getChildElement('spawns');
            selectActivePattern = htmlElem.call.getChildElement('active_spawns');
            tileDiv =   htmlElem.call.getChildElement('tile_value');
            htmlElem.call.populateSelectList('spawns', spawns)
            htmlElem.call.populateSelectList('active_spawns', noSpawnEdits)
            operateButtonDiv = htmlElem.call.getChildElement('operate_button');
            DomUtils.addClickFunction(operateButtonDiv, operateSelection)
            console.log("Edit encounter spawns", this.encounter);
            statusMap.id = this.encounter.id;
            statusMap.config_id = statusMap.id;
            config = this.encounter.config;
        //    config = detachConfig(this.encounter.config);
        //    this.encounter.config = config;
        //    loadSavedConfig(statusMap.config_id, configLoaded);
            let loadGrid = poolFetch('EncounterGrid');
            loadGrid.initEncounterGrid(config.grid_id, getPos(), gridLoaded)
        }.bind(this);

        let getPos = function() {
            return this.encounter.getPos();
        }.bind(this)

        function closeGrid() {

            lastCursorTile = null;
            if (activeEncounterGrid !== null) {
                activeEncounterGrid.removeEncounterGrid();
                poolReturn(activeEncounterGrid);
                activeEncounterGrid = null;
            }
        }

        let lastCursorTile = null;
        let spawnerTiles = [];

        function getSpawnByTile(tile) {
            let patterns = config.spawn.patterns;
            for (let i = 0; i < patterns.length; i++) {
                let gridI = patterns[i].tile[0];
                let gridJ = patterns[i].tile[1];
                if (tile.gridI === gridI && tile.gridJ === gridJ) {
                    return patterns[i]
                }
            }
            return null;
        }

        function updatePatternAtCursor(pattern) {
            if (pattern === null) {
                htmlElem.call.populateSelectList('active_spawns', noSpawnEdits)
                console.log("updatePatternAtCursor", selectSpawnPattern.value, patterns)
                selectedPattern = patterns[selectSpawnPattern.value];
                selectActivePattern.value = "ADD"
            } else {
                htmlElem.call.populateSelectList('active_spawns', spawnPresentEdits)
                selectActivePattern.value = "REMOVE"
                selectedPattern = pattern;
            }

        }

        function updateSelectedPatternId() {
            if (cursorTile !== null) {
                let pattern = getSpawnByTile(cursorTile);
                if (pattern !== null) {
                    if (pattern.pattern_id === selectSpawnPattern.value) {
                        return;
                    }

                    selectedPattern = pattern;
                    removeSelectedPattern();
                    console.log("addPatternAtTile", selectSpawnPattern.value, patterns)
                    selectedPattern = patterns[selectSpawnPattern.value];
                    selectedPatternId = selectedPattern.pattern_id;
                    addPatternAtTile(selectSpawnPattern.value, cursorTile);
                }
            }
        }

        let updateActivePatterns = function() {
            MATH.emptyArray(spawnerTiles)
            let patterns = config.spawn.patterns;
            for (let i = 0; i < patterns.length; i++) {
                let gridI = patterns[i].tile[0];
                let gridJ = patterns[i].tile[1];
                let tile = activeEncounterGrid.gridTiles[gridI][gridJ];
                if (spawnerTiles.indexOf(tile) === -1) {
                    spawnerTiles.push(tile)
                }
            }
        }

        let patternNodeTiles = [];

        function findFreeWalkableTile(conflictTile, gridTiles, occupiedTiles) {
            let i = conflictTile.gridI;
            let j = conflictTile.gridJ;
            let walkableTiles = filterForWalkableTiles(gridTiles);
            let testCount = walkableTiles.length - occupiedTiles.length;
            if (testCount < 1) {
                console.log("All tiles Taken... bigger grid or less spawns to fix");
                return null;
            }

            let minDist = 99999;
            let foundTile = null;
            while (walkableTiles.length) {
                let candidate = walkableTiles.pop();
                if (occupiedTiles.indexOf(candidate) === -1) {
                    let distance = MATH.distanceBetween(candidate.getPos(), conflictTile.getPos());
                    if (distance < minDist) {
                        foundTile = candidate;
                        minDist = distance;
                    }
                }
            }

            return foundTile;

        }

        function indicateTilePatternNodes(tile, nodeTiles) {

            let pattern = getSpawnByTile(tile)
            if (pattern === null) {
                return;
            }
            let patternId = pattern.pattern_id;
        //    console.log(pattern, patterns);
            let patternConfig = patterns[patternId];
            let spawnTiles = patternConfig['spawn_tiles'];
            for (let i = 0; i < spawnTiles.length; i++) {
                let spawnTile = spawnTiles[i];
                let x = spawnTile[0];
                let y = spawnTile[1];
                let tiles = activeEncounterGrid.gridTiles;
                let ix = MATH.clamp(tile.gridI+x, 0, tiles.length-1);
                let jy = MATH.clamp(tile.gridJ+y, 0, tiles[ix].length-1);
                let gridTile = tiles[ix][jy];

                if (nodeTiles.indexOf(gridTile) !== -1) {
                    gridTile = findFreeWalkableTile(gridTile, tiles, nodeTiles);
                } else if (gridTile.walkable !== true) {
                    gridTile = findFreeWalkableTile(gridTile, tiles, nodeTiles);
                }

                if (gridTile === null) {
                    console.log("No Free Tile found, bad grid + spawns combo")
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tile.getPos(), color:'YELLOW', size:0.35})
                }

                if (nodeTiles.indexOf(gridTile) === -1) {
                    nodeTiles.push(gridTile);
                } else {
                    console.log("This should not nhappen, check it out!")
                //    gridTile.text.say("Tile Claimed")

                }
            }

            for (let i = 0; i < patternNodeTiles.length; i++){
                let pos = patternNodeTiles[i].getPos();
                indicateSpawnPointRadius(pos, 0.2, colorMapFx.DAMAGE_FX)

                if (i !== 0) {
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:pos, to:patternNodeTiles[i-1].getPos(), color:'RED'});
                }
            }
        }

            let update = function() {

            if (activeEncounterGrid !== null) {

                if (config.spawn.patterns) {
                    updateActivePatterns();
                } else {
                    config.spawn.patterns = [];
                }

                if (selectSpawnPattern.value !== selectedPatternId) {
                    selectedPatternId = selectSpawnPattern.value;
                    updateSelectedPatternId()
                }

                if (operateButtonDiv.innerHTML !== selectActivePattern.value) {
                    operateButtonDiv.innerHTML = selectActivePattern.value;
                }

                cursorTile = activeEncounterGrid.getTileAtPosition(ThreeAPI.getCameraCursor().getPos());

                if (lastCursorTile !== cursorTile) {
                    if (lastCursorTile !== null) {
                        if (lastCursorTile.visualTile) {
                            lastCursorTile.clearPathIndication()
                        }
                    }
                    if (cursorTile.visualTile) {
                        cursorTile.indicatePath()
                        tileDiv.innerHTML = cursorTile.gridI+" | "+cursorTile.gridJ;
                        let pattern = getSpawnByTile(cursorTile);
                        if (pattern !== null) {
                            selectSpawnPattern.value = pattern.pattern_id;
                        }
                        updatePatternAtCursor(pattern);
                    }
                    lastCursorTile = cursorTile;
                }

                MATH.emptyArray(patternNodeTiles);
                for (let i = 0; i < spawnerTiles.length; i++) {
                    let pos = spawnerTiles[i].getPos();
                    indicateSpawnPointRadius(pos, 0.5, colorMapFx.GLITTER_FX)
                    indicateTilePatternNodes(spawnerTiles[i], patternNodeTiles);
                }

            }

        }.bind(this);

        let close = function() {
            closeGrid()
        }

        this.call = {
            htmlReady:htmlReady,
            update:update,
            close:close
        }

    }

    setWorldEncounter(encounter) {
        this.encounter = encounter;
    }

    initEditTool(closeCb) {
        GameAPI.worldModels.deactivateEncounters();
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_spawns', closeCb, this.statusMap, 'edit_frame edit_spawns', this.call.htmlReady);
    }

    closeEditTool() {
        GameAPI.worldModels.activateEncounters();
        this.encounter = null;
        this.call.close();
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEditSpawns }