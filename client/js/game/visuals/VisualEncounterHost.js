class VisualEncounterHost {
    constructor(obj3d) {

        this.obj3d = obj3d;

        let actor = null;

        let getActor = function() {
            return actor;
        }

        let setActor = function(actr) {
            actor = actr;
        }

        let show = function() {
            if (actor) {
                actor.activateGameActor();
            }
        }

        let hide = function() {
            if (actor) {
                actor.deactivateGameActor();
            }
        }

        this.call = {
            getActor:getActor,
            setActor:setActor,
            show:show,
            hide:hide
        }

    }

    getPos() {
        return this.obj3d.position;
    }

    applyHostConfig(config, actorReady) {

        let actorLoaded = function(actor) {
            MATH.rotateObj(actor.actorObj3d, config.rot)
            this.call.setActor(actor);
            actorReady(actor)
        }.bind(this)

        if (config.actor) {
            evt.dispatch(ENUMS.Event.LOAD_ACTOR, {id: config.actor, pos:this.getPos(), callback:actorLoaded});
        }

    }

    showEncounterHost() {
        this.call.show();
    }

    hideEncounterHost() {
        this.call.hide();
    }

}

export { VisualEncounterHost }