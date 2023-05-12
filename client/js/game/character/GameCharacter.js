import { CharacterInventory } from "./CharacterInventory.js";
import { CharacterEquipment } from "./CharacterEquipment.js";
import { CharacterStatus } from "./CharacterStatus.js";
import { CharacterMovement } from "./CharacterMovement.js";
import { CharacterAbilities } from "./CharacterAbilities.js";
import { CharacterStatusGui } from "../../application/ui/gui/game/CharacterStatusGui.js";
import { CharacterIndicator } from "../../application/ui/gui/game/CharacterIndicator.js";
import { CharacterAbilityGui } from "../../application/ui/gui/game/CharacterAbilityGui.js";

class GameCharacter {
    constructor(config) {
        this.characterName = config.status.name;
        this.gamePiece = null;
        this.config = config;
        this.characterInventory = new CharacterInventory();
        this.characterStatus = new CharacterStatus();
        this.characterStatusGui = new CharacterStatusGui();
        this.characterIndicator = new CharacterIndicator();
        this.characterAbilities = new CharacterAbilities();
        this.characterAbilityGui = new CharacterAbilityGui();

        let pickupComplete = function(itemPiece) {
            this.getInventory().addItemToInventory(itemPiece);
        }.bind(this);


        this.callbacks= {
            pickupComplete:pickupComplete
        }

    }

    setCharacterPiece(gamePiece, equipSlotConfigId) {
        this.gamePiece = gamePiece;
        gamePiece.character = this;
        this.characterStatus.activateCharacterStatus(gamePiece);



        let size = gamePiece.getStatusByKey('size');
        gamePiece.getSpatial().setBaseSize(size)
        gamePiece.pieceAnimator.setSizeForJoints(size);

        this.characterEquipment = new CharacterEquipment(gamePiece, equipSlotConfigId);
        this.characterMovement = new CharacterMovement(gamePiece);
        this.characterStatusGui.initStatusGui(this);
        this.characterAbilityGui.initAbilityGui(this);
        this.characterIndicator.initCharacterIndicator(gamePiece);

        gamePiece.getAbilitySystem().initAbilitySlots(gamePiece.getStatusByKey('ability_slots_max'))
        let unlockedSlotCount = gamePiece.getStatusByKey('ability_slots');
        for (let i = 0; i < unlockedSlotCount; i++) {
            gamePiece.getAbilitySystem().unlockAbilitySlot(i)
        }

        if (this.config['abilities']) {
            let activeSlot = 0;
            this.characterAbilities.initCharacterAbilities(gamePiece);
            let abilities = this.config['abilities']
            for (let key in abilities) {
                this.characterAbilities.addCharacterAbility(key, abilities[key]);
                gamePiece.getAbilitySystem().slotActiveAbility(activeSlot, key);
                activeSlot++;
            }
        }


    }

    getCharacterPiece() {
        return this.gamePiece;
    }

    activateCharAbilityGui(containerId, x, y) {
        return this.characterAbilityGui.activateCharacterAbilityGui(containerId, x, y)
    }

    deactivateCharAbilityGui() {
        this.characterAbilityGui.deactivateCharacterAbilityGui()
    }

    activateCharStatusGui() {
        this.characterStatusGui.activateCharacterStatusGui()
    }

    deactivateCharStatusGui() {
        this.characterStatusGui.deactivateCharacterStatusGui()
    }

    deactivateCharIndicator() {
        this.characterIndicator.removeIndicatorFromPiece(this.gamePiece);
    }
    pickupItem(gamePiece, time) {
        gamePiece.getPieceMovement().moveToTargetAtTime('grab_loot', gamePiece, this.gamePiece.getSpatial(), time, this.callbacks.pickupComplete);
    }

    getInventory() {
        return this.characterInventory;
    }

    getEquipment() {
        return this.characterEquipment;
    }

    dismissCharacter() {
        this.getEquipment().removeAllItems()
        this.characterStatusGui.deactivateCharacterStatusGui();
        this.characterIndicator.removeIndicatorFromPiece(this.gamePiece);
        this.characterStatus.deactivateCharacterStatus();
    }

}

export { GameCharacter }
