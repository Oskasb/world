import { PieceStateProcessor } from "./PieceStateProcessor.js";
import { ConfigData } from "../../application/utils/ConfigData.js";

class PieceState {
    constructor(gamePiece) {
        this.gamePiece = gamePiece;

        this.configData =  new ConfigData("GAME", "GAME_STATS",  'level_table', 'data_key', 'config')

        this.config = {

            xpGain:21,
            turnTime:4,
            sourceFraction:0.15,
            prepFraction:0.25,
            swingFraction:0.30,
            recoverFraction:0.30,
            hasteFactor:1,
            maxActPts:5,
            maxHP: 0
        }

        let getBy = function(key) {
            return gamePiece.getStatusByKey(key)
        }

        this.status = {
            name:'no_name',
            gamePiece:gamePiece,
            getBy:getBy,
            animating:1,
            size:0.5,
            scale:1,
            height: 0.5,
            meleeRange:0.5,
            move_speed:5,
            turn_moves:0,
            aggro_range:7,
            levels:[0, 35, 100, 250, 400, 600, 900, 1200, 1600, 2500, 3200,
                4500, 5350, 6100, 7250, 8400, 9600, 10900, 11200, 13600, 22500, 33200],
            NONE:0,
            FAST:0,
            dmg:1,
            lifetime:0,
            level:0,
            xp:0,
            gold:0,
            gems:0,
            inv:0,
            stash:0,
            charState:ENUMS.CharacterState.IDLE_HANDS,
            targState:ENUMS.CharacterState.IDLE_HANDS,
            atkType:ENUMS.AttackType.NONE,
            trgAtkTyp:ENUMS.AttackType.NONE,
            selectedTarget:null,
            engagingTarget:null,
            combatTarget:null,
            disengagingTarget:null,
            turnProgress:0,
            turn:0,
            attacks:0,
            attack:0,
            appliedAttacks:0,
            atkProg:0,
            source:0,
            prep:0,
            swing:0,
            recover:0,
            animKey:'none',
            action:'none',
            trTime:0,
            maxAPs:0,
            actPts:0,
            activeAPs:0,
            hp:0,
            maxHP:0,
            isItem:0,
            isCharacter:0,
            ability_slots_max: 2,
            ability_slots: 1,
            activeAbility: null,
            xp_value:5,
            status_frozen: 0,
            status_burning: 0,
            status_stunned: 0,
            status_hasted: 0,
            status_empowered: 0,
            status_hardened: 0,
            status_lifesteal: 0,
            status_hidden: 0,
            status_poisoned: 0
        }

        this.levelModifiers = {

        }

        this.equipmentModifiers = {

        }

        this.abilityModifiers = {

        }

        for (let key in gamePiece.config.status) {
            if (key !== 'level') {
                this.status[key] = gamePiece.config.status[key];
            }
        }

        this.lastState = ENUMS.CharacterState.IDLE_HANDS;

    }

    applyEquipmentModifier(key, value) {
        if (typeof(this.equipmentModifiers[key]) === 'undefined') {
            this.equipmentModifiers[key] = 0;
        }
        this.equipmentModifiers[key] += value;
    }

    applyAbilityModifier(key, value) {
        if (typeof(this.abilityModifiers[key]) === 'undefined') {
            this.abilityModifiers[key] = 0;
        }
        this.abilityModifiers[key] += value;
    }

    initPieceState() {
        let gamePiece = this.gamePiece;



        let applyLevelTable = function(levelTables) {
            //    console.log("Level table", levelTables.level_up_status_modifiers);
            this.status.levelTables = levelTables['level_up_status_modifiers'];
            this.processLevelUpTo(pieceLevel, gamePiece)
        }.bind(this);

        let onConfig = function(config) {
            applyLevelTable(config);
        }.bind(this)
        let dataId;
        let pieceLevel;
        if (gamePiece.config.status) {
            dataId = gamePiece.config.status['level_table'];
            pieceLevel = gamePiece.config.status['level'];
        } else {
            let pieceConf = new ConfigData("GAME", "PIECES").parseConfigData()[gamePiece.config.piece].data;
            dataId = pieceConf.status['level_table'];
            pieceLevel = pieceConf.status['level'];
        }
        this.configData.parseConfig(dataId, onConfig)
        this.pieceStateProcessor = new PieceStateProcessor(gamePiece);
    }

    processLevelUpTo(targetLevel, gamePiece) {

        let fromLevel = this.status.level;
    //    console.log("Process Level Up", fromLevel, targetLevel, this.status.levelTables);

        let levelTables = gamePiece.getStatusByKey('levelTables');

        for (let key in levelTables) {
            targetLevel = MATH.clamp(targetLevel,0,  levelTables[key].length)
            this.levelModifiers[key] = 0;
            let amount = 0
            for (let i = 0; i < targetLevel; i++) {
                amount += levelTables[key][i];
            }

            this.levelModifiers[key] = amount;
    //        console.log("increase by", key, amount, gamePiece.getStatusByKey(key));
        }
        this.status.hp = gamePiece.getStatusByKey('maxHP');
    //    console.log(gamePiece.getStatusByKey('maxHP'), gamePiece.getStatusByKey('hp'), gamePiece.getStatusByKey('dmg'), gamePiece.getStatusByKey('FAST'))
        this.status.level = targetLevel;
    }

    isCombatRelatedState(state) {
        return  (state === ENUMS.CharacterState.ENGAGING || state === ENUMS.CharacterState.COMBAT || state === ENUMS.CharacterState.DISENGAGING)
    }
    applyCharStateUpdates() {
        let charState = this.status.charState;
        if (this.isCombatRelatedState(charState)) {
            if (!this.isCombatRelatedState(this.lastState)) {
                this.gamePiece.character.activateCharStatusGui()
            }
        } else {
            if (this.isCombatRelatedState(this.lastState)) {
                this.gamePiece.character.deactivateCharStatusGui()
            }
        }
        this.lastState = charState;

    }



    updateGamePiece(tpf, time) {
        let statePre = this.status.charState;
        this.pieceStateProcessor.processGamePieceState(this.status, this.config, tpf, time)
        if (statePre !== this.status.charState) {
            if (this.gamePiece === GameAPI.getMainCharPiece()) {

                let target = this.gamePiece.getTarget();
                if (target) {
                    if (target.isDead) {
        //                console.log("The dead cant dance, dont worry here")
                        return;
                    }
                }

                evt.dispatch(ENUMS.Event.SET_PLAYER_STATE, this.status.charState);
            }
        }
    }
    tickPieceState(tpf, time) {
        this.updateGamePiece(tpf, time);
        this.applyCharStateUpdates();
    }

}

export { PieceState }