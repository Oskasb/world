import {clearActorEncounterStatus} from "../../application/utils/StatusUtils.js";


class PlayerParty {
    constructor() {
        this.actors = [];

        let partyVictorious = function(worldEncounterId) {
            evt.dispatch(ENUMS.Event.ENCOUNTER_COMPLETED, {worldEncounterId:worldEncounterId})
            for (let i = 0; i < this.actors.length; i++) {
                let actor = this.actors[i];
                if (!actor.call.getRemote()) {
                    actor.setStatusKey(ENUMS.ActorStatus.EXIT_ENCOUNTER, actor.getStatus(ENUMS.ActorStatus.ACTIVATED_ENCOUNTER));
                    actor.setStatusKey(ENUMS.ActorStatus.DEACTIVATING_ENCOUNTER, actor.getStatus(ENUMS.ActorStatus.ACTIVATED_ENCOUNTER));
                    GameAPI.call.getGameEncounterSystem().deactivateActiveEncounter(false, true);
                }
            }
        }.bind(this);


        let partyDefeated = function() {

            for (let i = 0; i < this.actors.length; i++) {
                let actor = this.actors[i];
                actor.setStatusKey(ENUMS.ActorStatus.EXIT_ENCOUNTER, actor.getStatus(ENUMS.ActorStatus.ACTIVATED_ENCOUNTER));
                actor.setStatusKey(ENUMS.ActorStatus.DEACTIVATING_ENCOUNTER, actor.getStatus(ENUMS.ActorStatus.ACTIVATED_ENCOUNTER));

                if (!actor.call.getRemote()) {
                    GameAPI.call.getGameEncounterSystem().deactivateActiveEncounter(true, false);
                }

            }

        }.bind(this);

        this.call = {
            partyDefeated:partyDefeated,
            partyVictorious:partyVictorious
        }

    }

    addPartyActor(actor) {
        if (this.isMember(actor)) {
            return;
        }
        this.actors.push(actor);
    }

    isMember(actor) {
        if (this.actors.indexOf(actor) !== -1) {
            return true;
        } else {
            return false;
        }
    }

    getPartySelection() {
        for (let i = 0; i < this.actors.length; i++) {
            let actor = this.actors[i];
            if (actor.getStatus(ENUMS.ActorStatus.PARTY_SELECTED)) {
                return actor;
            }
        }
        return null;
    }

    selectPartyActor(actor) {
        let current = this.getPartySelection();

        let remote = actor.call.getRemote();
        let selectedActor = GameAPI.getGamePieceSystem().selectedActor;

        if (current) {
            current.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, false);
            if (current.call.getRemote()) {
                actor.actorText.say("Drop Me")
                selectedActor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, "");
            }
            if (current === actor) {
                return;
            }
        }

        if (actor === null) {
            return;
        }

        actor.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, true);

        if (remote) {
            let selectedActor = GameAPI.getGamePieceSystem().selectedActor;
            GuiAPI.screenText("INSPECT "+actor.id,  ENUMS.Message.SYSTEM, 4)
            actor.actorText.say("Picked Me")
            selectedActor.actorText.say("Poke You")
            selectedActor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, actor.id);
        } else {
            GameAPI.getGamePieceSystem().setSelectedGameActor(actor);
        }
    }

    getPartyActors() {
        return this.actors;
    }


    clearPartyStatus() {
    //
     //   return;
        for (let i = 0; i < this.actors.length; i++) {
            let actor = this.actors[i];

            clearActorEncounterStatus(actor);

            if (!actor.call.getRemote()) {
            //    GameAPI.call.getGameEncounterSystem().deactivateActiveEncounter(true, false);
            }

        }

    //    this.selectPartyActor(GameAPI.getGamePieceSystem().selectedActor);
     //   evt.dispatch(ENUMS.Event.CLEAR_UI, {});
     //   this.clearPartyMemebers();
    }

    clearPartyMemebers() {
        MATH.emptyArray(this.actors);
        this.actors.push(GameAPI.getGamePieceSystem().selectedActor);
    }

    removePartyActor(actor) {
        return MATH.splice(this.actors, actor);
    }

}

export {PlayerParty}