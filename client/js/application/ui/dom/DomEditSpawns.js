import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {ConfigData} from "../../utils/ConfigData.js";
import {colorMapFx} from "../../../game/visuals/Colors.js";

let tempVec = new Vector3();
let frustumFactor = 0.828;

let configData;
let spawns = []
let patterns = {}
let onConfig = function(configs) {
    console.log(configs)
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
            id:""
        };

        let statusMap = this.statusMap;
        let rootElem = null;
        let htmlElem;
        let config = null;
        let activeEncounterGrid = null;
        let selectSpawnPattern = null;
        let selectActivePattern = null;
        let tileDiv = null;
        let operateButtonDiv = null;

        let activePatterns = [];

        function operateSelection() {
            console.log("operateSelection")
        }

        function gridLoaded(encGrid) {
            activeEncounterGrid = encGrid;
            ThreeAPI.registerPrerenderCallback(update);
        }
        let htmlReady = function(htmlEl) {
               console.log(configData)
            htmlElem = htmlEl;
            rootElem = htmlEl.call.getRootElement();
            selectSpawnPattern = htmlElem.call.getChildElement('spawns');
            selectActivePattern = htmlElem.call.getChildElement('active_spawns');
            tileDiv =   htmlElem.call.getChildElement('tile_value');
            htmlElem.call.populateSelectList('spawns', spawns)
            operateButtonDiv = htmlElem.call.getChildElement('operate_button');
            DomUtils.addClickFunction(operateButtonDiv, operateSelection)
            console.log("Edit encounter spawns", this.encounter);
            statusMap.id = this.encounter.id;
            let json = JSON.stringify(this.encounter.config);
            config = JSON.parse(json);
            this.encounter.config = config;
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

        function indicateTilePatternNodes(tile) {
            MATH.emptyArray(patternNodeTiles);
            let pattern = getSpawnByTile(tile)
            let patternId = pattern.pattern_id;
            let patternConfig = patterns[patternId];
            let spawnTiles = patternConfig['spawn_tiles'];
            for (let i = 0; i < spawnTiles.length; i++) {
                let spawnTile = spawnTiles[i];
                let x = spawnTile[0];
                let y = spawnTile[1];
                let gridTile = activeEncounterGrid.gridTiles[tile.gridI+x][tile.gridJ+y];
                if (patternNodeTiles.indexOf(gridTile) === -1) {
                    patternNodeTiles.push(gridTile);
                } else {
                    console.log("Tile Occupied")
                }
            }

            for (let i = 0; i < patternNodeTiles.length; i++){
                let pos = patternNodeTiles[i].getPos();
                indicateSpawnPointRadius(pos, 0.3, colorMapFx.DAMAGE_FX)

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

                let cursorTile = activeEncounterGrid.getTileAtPosition(ThreeAPI.getCameraCursor().getPos());
                if (lastCursorTile !== null) {
                    if (lastCursorTile.visualTile) {
                        lastCursorTile.clearPathIndication()
                    }
                }
                if (cursorTile.visualTile) {
                    cursorTile.indicatePath()
                    tileDiv.innerHTML = "i:"+cursorTile.gridI+" j:"+cursorTile.gridJ;
                    if (spawnerTiles.indexOf(cursorTile) !== -1) {
                        let pattern = getSpawnByTile(cursorTile);
                        selectActivePattern.value = pattern.pattern_id;
                    }
                }
                lastCursorTile = cursorTile;

                for (let i = 0; i < spawnerTiles.length; i++) {
                    let pos = spawnerTiles[i].getPos();
                    indicateSpawnPointRadius(pos, 0.5, colorMapFx.GLITTER_FX)
                    indicateTilePatternNodes(spawnerTiles[i]);
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