import { PlayerStash } from "./PlayerStash.js";
import { PartyLeaderSystem } from "../../application/ui/gui/systems/PartyLeaderSystem.js";
import { TargetIndicator } from "../../application/ui/gui/game/TargetIndicator.js";
import { Vector3 } from "../../../libs/three/math/Vector3.js";

let tempVec3 = new Vector3()

let cheatInventory = [
    "HELMET_VIKING_RED", "BELT_PLATE_RED",
    "SHIRT_CHAIN", "SHIRT_SCALE_RED", "LEGS_SCALE_RED",
    "BOOTS_SCALE", "GLOVES_SCALE", "SWORD_FANCY"
]

class PlayerMain {
    constructor() {
        this.heroPageActive = false;
        this.tempVec = new THREE.Vector3();
        this.playerStash = new PlayerStash();
        this.playerCharacter = null;
        this.selectionIndicator = new TargetIndicator();
        this.targetIndicator = new TargetIndicator();
        this.partyLeaderSystem = new PartyLeaderSystem();

        let takeStashItem = function (event) {
            let item = this.playerStash.takePieceFromStash(event.item);
            if (!item) {
                console.log("No item gotten from stash..")
                return;
            }
            GameAPI.addItemToPlayerInventory(item, event.time);

        }.bind(this);

        let stashInvItem = function(event) {
            let item = this.playerCharacter.getInventory().takeItemFromInventory(event.item);
            if (!item) {
                //        console.log("No item gotten from inventory..")
                return;
            }
            this.stashItemPiece(item, event.time)
        }.bind(this);

        let equipItem = function (event) {
            let item = this.playerCharacter.getInventory().takeItemFromInventory(event.item);
            if (!item) {
                //         console.log("No item gotten from stash..")
                return;
            }
            this.playerCharacter.getEquipment().characterEquipItem(item)
        }.bind(this);

        let unequipItem = function(event) {
            let item = this.playerCharacter.getEquipment().takeEquippedItem(event.item);
            if (!item) {
                //        console.log("No item gotten from equipment..")
                return;
            }
            GameAPI.addItemToPlayerInventory(item, 0.5);
        }.bind(this);

        let addToStash = function(piece) {
            this.playerStash.addPieceToStash(piece);
            piece.getOnUpdateCallback()(0.01, GameAPI.getGameTime())
            piece.getSpatial().applySpatialUpdateToBuffers()
        }.bind(this);

        let handleStateEvent = function(event) {
            console.log("handleStateEvent leads nowhere...", event )

        }.bind(this);

        let combatPage = null;
        let setPlayerState = function(charState) {
            if (charState === ENUMS.CharacterState.IDLE_HANDS) {
                if (combatPage) {
                    combatPage.closeGuiPage();
                    combatPage = null;
                }
            } else {
                if (!combatPage) {
                    combatPage = GuiAPI.activatePage('page_activity_combat')
                }
            }
        };

        let registerHostile = function(event) {
            if (event.value === true) {
                this.handleHostileAdded(event.piece)
            } else {
                this.handleHostileRemoved(event.piece)
            }

        }.bind(this);

        let registerTargetEngaged = function(event) {
            if (event.value === true) {
                this.handleTargetEngaged(event.piece)
            } else {
                this.handleTargetDisengaged(event.piece)
            }
        }.bind(this);

        let openTarget = function(event) {
            if (event.value === true) {
                this.handleTargetOpen(event)
            } else {
                this.handleTargetClose(event)
            }
        }.bind(this)

        let selectTarget = function(event) {
            if (event.value === true) {
                this.handleTargetSelected(event)
            } else {
                this.handleTargetUnselected(event.piece)
            }
        }.bind(this)

        let ressAtHome = function(gamePiece) {
            gamePiece.isDead = false;
            gamePiece.enablePieceAnimations();
            gamePiece.movementPath.cancelMovementPath();
            gamePiece.setStatusValue('hp', gamePiece.getStatusByKey('maxHP'));
            gamePiece.setStatusValue('charState', ENUMS.CharacterState.IDLE_HANDS);
            gamePiece.setStatusValue('targState', ENUMS.CharacterState.IDLE_HANDS);
        }

        let returnHome = function() {
            let gamePiece = GameAPI.getMainCharPiece()
            ressAtHome(gamePiece);

            for (let i = 0; i < gamePiece.companions.length; i++) {
                ressAtHome(gamePiece.companions[i])
            }

            evt.dispatch(ENUMS.Event.REQUEST_SCENARIO, {
                id:"home_scenario",
                dynamic:"home_hovel_dynamic"
            });
        }

        let applyCheatPimp = function(event) {
            this.cheatPimpMainChar(event)
        }.bind(this)

        let switchCallback = function() {
            this.partyLeaderSystem.deactivateSelections();
        }.bind(this);

        let switchGuiPage = function(event) {
            let currentPage = GameAPI.getActiveDynamicScenario().page;
            if (currentPage.isActive === false) {
                return;
            }

            GuiAPI.guiPageSystem.switchFromCurrentActiveToPage(currentPage, event.page, switchCallback);
        }

        let setCompanionAsLeader = function(event) {
            let playerPiece = GameAPI.getMainCharPiece();
            let gamePiece = GameAPI.getSelectedCompanion();
            if (!gamePiece) {
                console.log("No companion selected, something broken...")
                return;
            }
            gamePiece.setStatusValue('following', null)
            gamePiece.addCompanion(playerPiece);
            MATH.quickSplice(playerPiece.companions, gamePiece);
            while (playerPiece.companions.length) {
                gamePiece.addCompanion(playerPiece.companions.pop())
            }
            this.setPlayerCharacter(gamePiece.character, playerPiece)
        }.bind(this);

        let callbacks = {
            handleEquip : equipItem,
            handleUnequip : unequipItem,
            handleDropItem : function (event) {        },
            handleStashItem : stashInvItem,
            handleTakeStashItem : takeStashItem,
            addToStash:addToStash,
            handleStateEvent:handleStateEvent,
            setPlayerState:setPlayerState,
            registerHostile:registerHostile,
            registerTargetEngaged:registerTargetEngaged,
            openTarget:openTarget,
            selectTarget:selectTarget,
            returnHome:returnHome,
            applyCheatPimp:applyCheatPimp,
            switchGuiPage:switchGuiPage,
            setCompanionAsLeader:setCompanionAsLeader
        }

        this.callbacks = callbacks;


        evt.on(ENUMS.Event.EQUIP_ITEM, callbacks.handleEquip);
        evt.on(ENUMS.Event.UNEQUIP_ITEM, callbacks.handleUnequip);
        evt.on(ENUMS.Event.DROP_ITEM, callbacks.handleDropItem);
        evt.on(ENUMS.Event.STASH_ITEM, callbacks.handleStashItem);
        evt.on(ENUMS.Event.TAKE_STASH_ITEM, callbacks.handleTakeStashItem);
        evt.on(ENUMS.Event.MAIN_CHAR_STATE_EVENT, callbacks.handleStateEvent);
        evt.on(ENUMS.Event.SET_PLAYER_STATE, callbacks.setPlayerState);
        evt.on(ENUMS.Event.MAIN_CHAR_REGISTER_HOSTILE, callbacks.registerHostile);
        evt.on(ENUMS.Event.MAIN_CHAR_OPEN_TARGET, callbacks.openTarget);
        evt.on(ENUMS.Event.MAIN_CHAR_SELECT_TARGET, callbacks.selectTarget);
        evt.on(ENUMS.Event.MAIN_CHAR_ENGAGE_TARGET, callbacks.registerTargetEngaged);
        evt.on(ENUMS.Event.MAIN_CHAR_RETURN_HOME, callbacks.returnHome);
        evt.on(ENUMS.Event.CHEAT_APPLY_PIMP, callbacks.applyCheatPimp);
        evt.on(ENUMS.Event.SWITCH_GUI_PAGE, callbacks.switchGuiPage);
        evt.on(ENUMS.Event.SET_COMPANION_AS_LEADER, callbacks.setCompanionAsLeader);


    }


    setPlayerCharacter(character, oldMain) {
        if (oldMain) {
            GameAPI.unregisterGameUpdateCallback(oldMain.getOnUpdateCallback())
        }
        GameAPI.registerGameUpdateCallback(character.gamePiece.getOnUpdateCallback())

        character.gamePiece.setStatusValue('isCharacter', 1);
        if (this.mainCharPage) {
            this.partyLeaderSystem.clearPartyLeaderSystem()
            GuiAPI.closePage(this.mainCharPage);
        } else {
            GameAPI.registerGameUpdateCallback(this.partyLeaderSystem.updatePartyLeaderSystem);
        }

        this.partyLeaderSystem.setPartyLeaderPiece(character.gamePiece)

        let openMainCharPage = function() {
            this.mainCharPage = GuiAPI.activatePage("page_player_main");
        }.bind(this);

        setTimeout(function() {
            openMainCharPage();
        }, 1000)


        this.playerCharacter = character;
        let data = {
            MAIN_CHAR_STATUS:character.characterStatus
        }
        PipelineAPI.setCategoryData('CHARACTERS', data)
    }



    getPlayerCharacter() {
        return this.playerCharacter;
    }

    stashItemPiece(piece, time) {
        let playerPiece = GameAPI.getMainCharPiece();
        this.playerStash.findPositionInStash(this.tempVec);
        playerPiece.getSpatial().getSpatialPosition(tempVec3)
        piece.getPieceMovement().moveToTargetAtTime('stash', tempVec3, this.tempVec, time, this.callbacks.addToStash);
    }

    handleHostileAdded(hostileChar) {
        //    hostileChar.activateCharStatusGui()
    }

    handleHostileRemoved(hostileChar) {
        //    hostileChar.deactivateCharStatusGui()
    }

    handleTargetClose(event) {
        let playerPiece = GameAPI.getMainCharPiece();
        let gamePiece = event.piece;
        if (!gamePiece) {
            console.log("Should be a piece in this")
            return;
        }
        if (gamePiece.isDead) {
            console.log('No open the dead')
            return;
        }

        if ((gamePiece === playerPiece) || (gamePiece.getStatusByKey('following') === playerPiece)) {
            console.log("Close friendly", gamePiece);
            gamePiece.getCharacter().deactivateCharAbilityGui();
        }
    }

    handleTargetOpen(event) {
        console.log('Main open', event)
        let playerPiece = GameAPI.getMainCharPiece();
        let gamePiece = event.piece;
        if (!gamePiece) {
            console.log("Should be a piece in this")
            return;
        }
        if (gamePiece.isDead) {
            console.log('No open the dead')
            return;
        }

        if ((gamePiece === playerPiece) || (gamePiece.getStatusByKey('following') === playerPiece)) {
            console.log("Open friendly", gamePiece);
        //    gamePiece.getCharacter().activateCharAbilityGui();
        }

    }
    handleTargetSelected(event) {

        let playerPiece = GameAPI.getMainCharPiece();

        let gamePiece = event.piece;
        if (!gamePiece) {
            console.log("Should be a piece in this")
            return;
        }
        let longPress = event.longPress;
        if (gamePiece.isDead) {
            console.log('No selecting the dead')
            return;
        }

        if (gamePiece === playerPiece) {
            let switchCallback = function() {

            }
            if (longPress === 1) {
                if (!gamePiece.getTarget()) {

                    let currentPage = GameAPI.getActiveDynamicScenario().page;
                    if (currentPage.isActive === false) {
                        return;
                    }
                    if (!gamePiece.movementPath.destinationTile || gamePiece.movementPath.destinationTile === gamePiece.movementPath.getTileAtPos(gamePiece.getPos())) {
                        GuiAPI.guiPageSystem.switchFromCurrentActiveToPage(currentPage, 'page_scene_hero', switchCallback);
                    }

                } else {
                    console.log("Player Select self while having a target... nothing happens for now")
                }
            }
            return;
        }


        if (gamePiece.getStatusByKey('following') === playerPiece) {
            if (longPress === 1) {
                console.log("select follower, switch control here..")
                return;
                gamePiece.setStatusValue('following', null)
                gamePiece.addCompanion(playerPiece);
                MATH.quickSplice(playerPiece.companions, gamePiece);
                while (playerPiece.companions.length) {
                    gamePiece.addCompanion(playerPiece.companions.pop())
                }
                this.setPlayerCharacter(gamePiece.character, playerPiece)
            }
            return;
        }

        if (gamePiece.getStatusByKey('companion')) {
            if (longPress === 1) {

                playerPiece.addCompanion(gamePiece);
            }
            return;
        }


        if (gamePiece.getStatusByKey('isItem')) {
            let playerPiece = GameAPI.getMainCharPiece();
            if (playerPiece.distanceToReachTarget(gamePiece) < 1) {
                GameAPI.addItemToPlayerInventory(gamePiece, 1);
            } else {

                let onArrive = function(arrive) {
                    console.log("Arrive at Item", arrive);
                    this.handleTargetSelected(gamePiece);
                }.bind(this);
                playerPiece.movementPath.addPathEndCallback(onArrive);
                playerPiece.movementPath.setPathTargetPiece(gamePiece);
            }
            return;
        }

        let oldTarget = GameAPI.getMainCharPiece().getStatusByKey('selectedTarget');
        if (oldTarget) {
            this.handleTargetUnselected();
        }

        GameAPI.getMainCharPiece().setStatusValue('selectedTarget', gamePiece);
        this.selectionIndicator.indicateGamePiece(gamePiece, 'effect_character_indicator', 1, 3, -0.5, 0.6, 0);

    }

    handleTargetUnselected() {
        GameAPI.getMainCharPiece().setStatusValue('selectedTarget', null);
        this.selectionIndicator.removeTargetIndicatorFromPiece()
        this.selectionIndicator.removeIndicatorFx()
    }

    handleTargetEngaged(gamePiece) {
        //   console.log("handleTargetEngaged")
        this.targetIndicator.removeTargetIndicatorFromPiece()
        this.targetIndicator.removeIndicatorFx()
        this.targetIndicator.indicateGamePiece(gamePiece, 'effect_character_indicator', 0, 5, 0, 1.03, 0.06, 5);
    }

    handleTargetDisengaged() {
        //   console.log("handleTargetDisengaged")
        this.targetIndicator.removeTargetIndicatorFromPiece()
        this.targetIndicator.removeIndicatorFx()
    }

    takeStashedPiece(piece) {
        return this.playerStash.takePieceFromStash(piece);
    }



    cheatPimpMainChar(event) {
        console.log("Cheat pimp")

        let char = GameAPI.getActivePlayerCharacter();
        let gamePiece = GameAPI.getMainCharPiece();
        let level = gamePiece.getStatusByKey('level');
        gamePiece.applyPieceLevel(level+1);
        let equip = function(piece) {
            char.getEquipment().characterEquipItem(piece);
        };
        let itemCallback = function(gamePiece) {
            equip(gamePiece)
        };

        if (cheatInventory.length) {
            let item = MATH.getRandomArrayEntry(cheatInventory)
            MATH.quickSplice(cheatInventory, item)
            GameAPI.createGamePiece({piece:item}, itemCallback);
        } else {
            return;
        }



    }

}

export { PlayerMain }