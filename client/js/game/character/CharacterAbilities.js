import {ConfigData} from "../../application/utils/ConfigData.js";

class CharacterAbilities{
    constructor() {
        this.gamePiece = null;
    }

    initCharacterAbilities(gamePiece) {
        this.gamePiece = gamePiece;
    }


    addCharacterAbility(abilityId, abilityStatus) {

        let gamePiece = this.gamePiece;

        let onData = function(config) {
            gamePiece.getAbilitySystem().registerPieceAbility(abilityId, config);
            gamePiece.getAbilitySystem().setAbilityStatus(abilityId, abilityStatus);
        }

        let configData =  new ConfigData("GAME", "GAME_ABILITIES",  'ability_config', 'data_key', 'config')
        configData.addUpdateCallback(onData);
        configData.parseConfig(abilityId, onData)
    }

}

export { CharacterAbilities }