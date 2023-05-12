

class AbilityState {
    constructor(gamePiece, pieceAbility) {
        this.pieceAbility = pieceAbility;
        this.gamePiece = gamePiece;
        this.isActive = false;
        this.castCompleted = false;
        this.activationTime = 0;
        this.castCompletedTime = 0;
        this.castTime = pieceAbility.config['cast_time'] || 0.2;
        this.applyTime = pieceAbility.config['apply_time'] || 0.5;
        this.cooldownTime = pieceAbility.config['cooldown_time'] || 0.5;
        this.apCost = pieceAbility.config['ap_cost'] || 2;
        this.castProgress = 0;
        this.cooldownProgress = 0;
        this.actionPointProgress = 0;
        this.isAvailable = false;
        this.isAutoCasting = false;
        this.isInRange = false;


        let isActivated = function() {
            return this.isActive
        }.bind(this);

        let getProgressStatus = function() {
            return this.castProgress
        }.bind(this);

        let getCooldownStatus = function() {
            return this.cooldownProgress
        }.bind(this);

        let getActionPointStatus = function() {
            return this.actionPointProgress;
        }.bind(this)

        let getIsAvailable = function() {
            return this.isAvailable;
        }.bind(this);

        let setIsAvailable = function(bool) {
            this.isAvailable  = bool;
        }.bind(this);


        let getAutoCast = function() {
            return this.isAutoCasting;
        }.bind(this);

        let tickAbilityState = function(tpf, gameTime) {
            this.updateAbilityState(tpf, gameTime);
        }.bind(this)

        let setAutocast = function(bool) {
            this.isAutoCasting = bool;
        }.bind(this)

        let setAbilityTarget = function(target) {
            this.abilityTarget = target;
        }.bind(this);

        let getAbilityTarget = function(target) {
            return this.abilityTarget;
        }.bind(this);

        let setIsInRange = function(bool) {
            this.isInRange = bool;
        }.bind(this);

        let getInRange = function() {
            return this.isInRange;
        }.bind(this);

        let setSufficientActionPoints = function(bool) {
            this.sufficientAP = bool;
        }.bind(this);

        let getSufficientActionPoints = function() {
            return this.sufficientAP;
        }.bind(this);

        this.call = {
            tick:tickAbilityState,
            setAbilityTarget:setAbilityTarget,
            getAbilityTarget:getAbilityTarget,
            setAutocast:setAutocast,
            getProgressStatus:getProgressStatus,
            getCooldownStatus:getCooldownStatus,
            getActionPointStatus:getActionPointStatus,
            setSufficientActionPoints:setSufficientActionPoints,
            getSufficientActionPoints:getSufficientActionPoints,
            setIsAvailable:setIsAvailable,
            getIsAvailable:getIsAvailable,
            setIsInRange:setIsInRange,
            getInRange:getInRange,
            getAutoCast:getAutoCast,
            isActivated:isActivated,
        }
        gamePiece.addPieceUpdateCallback(this.call.tick);
    }

    abilityStateActivated() {
        this.isActive = true;
        this.castCompleted = false;
        this.activationTime = GameAPI.getGameTime();
        this.gamePiece.pieceAbilitySystem.setActiveCastingAbility(this.pieceAbility);
    }

    abilityStateCastCompleted() {
        this.castCompleted = true;
        this.castCompletedTime = GameAPI.getGameTime();
        this.gamePiece.pieceAbilitySystem.completeActiveCastingAbility(this.pieceAbility);
    }

    abilityCooldownCompleted() {
        this.isActive = false;
    }

    updateAbilityStateProgress() {
        this.call.setIsAvailable(false);
        let progress = 0;
        let turnTime = GameAPI.getTurnStatus().turnTime;
        if (this.castCompleted === false) {
            progress = MATH.calcFraction(this.activationTime, this.activationTime+this.castTime*turnTime, GameAPI.getGameTime())
            if(progress < 1) {
                this.castProgress = progress;
            } else {
                this.abilityStateCastCompleted()
            }
            this.cooldownProgress = 0;
            this.actionPointProgress = 0;
        } else {
            progress = MATH.calcFraction(this.castCompletedTime, this.castCompletedTime+this.cooldownTime*turnTime, GameAPI.getGameTime())
            this.castProgress = 0;
            if(progress < 1) {
                this.cooldownProgress = 1- progress;
                this.actionPointProgress = 0;
            } else {
                this.abilityCooldownCompleted()
            }
        }
    }

    updateAbilityAvailability() {
        let activeCast = this.gamePiece.pieceAbilitySystem.activeCast;
        this.isAvailable = false;
        if (activeCast === null) {

            if (this.isActive) {

            } else {
                if (this.call.getAbilityTarget()) {
                    if (this.call.getInRange()) {
                        this.isAvailable = true;
                    }
                }
            }
        }
    }

    updateAbilityState(tpf, gameTime) {
        if (this.isActive) {
            this.updateAbilityStateProgress();
        } else {
            this.pieceAbility.processTargetSelection();
            this.castProgress = 0;
            this.cooldownProgress = 0;
            this.actionPointProgress = 1 - this.pieceAbility.processActionPointStatus();
            this.updateAbilityAvailability();

            if (this.isAvailable && this.call.getAutoCast()) {
                console.log("Autocast trigger")
                this.pieceAbility.activatePieceAbility(true)
            }
        }


    }
}

export { AbilityState }