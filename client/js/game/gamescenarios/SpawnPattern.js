import {ConfigData} from "../../application/utils/ConfigData.js";
import * as ScenarioUtils from "../gameworld/ScenarioUtils.js";
class SpawnPattern {
    constructor(config) {
//        console.log("Spawn Pattern", config)
        this.dataId = config['dataId'];
        this.params = config['params'];
        this.configData =  new ConfigData("SPAWN", "SPAWN_PATTERNS",  'spawn_main_data', 'data_key', 'config')

    }

    applySpawnPattern(encounterGrid, scenarioCharacters, scenarioPieces) {
        let onConfig = function(config, updateCount) {
            if (updateCount) {
                console.log("REFLOW SPAWN PATTERN")
                for (let i = 0; i < scenarioCharacters.length; i++) {

                    while (scenarioPieces.length) {
                        let piece = scenarioPieces.pop();
                        piece.disbandGamePiece()
                    }

                    while (scenarioCharacters.length) {
                        let char = scenarioCharacters.pop();
                        char.dismissCharacter();
                    }
                }
            }
            this.applySpawnConfig(encounterGrid, config, scenarioCharacters, updateCount);
        }.bind(this)
        this.configData.parseConfig(this.dataId, onConfig)
    }

    applySpawnConfig(encounterGrid, config, scenarioCharacters, updateCount) {
 //       console.log("Spawn Pattern", config)
        let spawnTiles = config['spawn_tiles'];

        for (let i = 0; i < spawnTiles.length;i++) {
            let tileX = spawnTiles[i][0]+this.params['tile_x'];
            let tileY = spawnTiles[i][1]+this.params['tile_y'];
            let tile = encounterGrid.getTileByRowCol(tileX, tileY);
            let pos = tile.getPos();
            let rotY = MATH.getRandomArrayEntry(this.params['rotations']);
            let stateName = MATH.getRandomArrayEntry(this.params['states']);
            let spawnConf = {
                pos: [pos.x, pos.y, pos.z],
                rot: [0, rotY, 0],
                state: ENUMS.CharacterState[stateName]
            }
            let charId = MATH.getRandomArrayEntry(this.params['characters']);
            ScenarioUtils.buildScenarioCharacter(charId, scenarioCharacters, spawnConf)
        }

    }

}

export { SpawnPattern }