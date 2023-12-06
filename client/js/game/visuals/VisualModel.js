import {transitionEffectOff, transitionEffectOn} from "./VisualTriggerFx.js";

class VisualModel {
    constructor() {
        this.actor = null;
        this.statusKey = null;
        this.effectData = null;
        this.effectModel = null;

        let update = function () {
            this.effectModel.getSpatial().stickToObj3D(this.actor.actorObj3d);
        }.bind(this);

        this.call = {
            update:update
        }

    }
    on(statusKey, actor, effectData) {

        this.effectModel = null

        let callback = function(instance) {
            actor.hideGameActor()
            this.effectModel = instance
            GameAPI.registerGameUpdateCallback(this.call.update)
        }.bind(this)

        actor.travelMode.call.activateVehicle(actor, callback)

        actor.actorText.say(statusKey+ " ON")
        this.actor = actor;
        this.statusKey = statusKey;
        this.effectData = effectData;
        transitionEffectOn(actor.getSpatialPosition(), effectData);
    }

    off() {
        this.actor.actorText.say(this.statusKey+ " OFF")
        this.actor.showGameActor()
        this.effectModel.decommissionInstancedModel();
        transitionEffectOff(this.actor.getSpatialPosition(), this.effectData);
        GameAPI.unregisterGameUpdateCallback(this.call.update)
    }

}

export { VisualModel }