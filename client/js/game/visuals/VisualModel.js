import {transitionEffectOff, transitionEffectOn} from "./effects/VisualTriggerFx.js";

class VisualModel {
    constructor() {
        this.actor = null;
        this.statusKey = null;
        this.effectData = null;
        this.effectModel = null;

        let update = function () {
        //    this.actor.actorObj3d.scale.set(0.1000, 0.1000, 0.1000)
            this.effectModel.getSpatial().stickToObj3D(this.actor.actorObj3d);
            this.effectModel.getSpatial().setBaseSize(10)
            this.actor.setSpatialPosition(this.actor.actorObj3d.position)
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

   //     actor.actorText.say(statusKey+ " ON")
        this.actor = actor;
        this.statusKey = statusKey;
        this.effectData = effectData;
        transitionEffectOn(actor.getSpatialPosition(), effectData);
    }

    off() {
     //   this.actor.actorText.say(this.statusKey+ " OFF")

        let actorReady = function() {

        }

        this.actor.showGameActor(actorReady)
        this.effectModel.decommissionInstancedModel();
        transitionEffectOff(this.actor.getSpatialPosition(), this.effectData);
        GameAPI.unregisterGameUpdateCallback(this.call.update)
    }

}

export { VisualModel }