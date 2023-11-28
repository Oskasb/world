class VisualEncounterHost {
    constructor(obj3d) {

        this.obj3d = obj3d;

        this.config = null;

        let actor = null;

        let getActor = function() {
            return actor;
        }

        let setActor = function(actr) {
            actor = actr;
            actor.activateGameActor();
        }

        let show = function() {
            if (actor) {
                actor.activateGameActor();
            } else {
                this.applyHostConfig(this.config, setActor);
            }
        }.bind(this)

        let hide = function() {
            if (actor) {
                actor.deactivateGameActor();
            }
        }

        let remove = function() {
            if (actor) {
                actor.removeGameActor();
            }
        }

        this.call = {
            getActor:getActor,
            setActor:setActor,
            show:show,
            hide:hide,
            remove:remove
        }

    }

    getPos() {
        return this.obj3d.position;
    }

    applyHostConfig(config, actorReady) {
        this.config = config;
        let actorLoaded = function(actor) {
            MATH.rotateObj(actor.actorObj3d, config.rot)
            actor.setStatusKey(ENUMS.ActorStatus.ALIGNMENT, config['ALIGNMENT'] ,'HOSTILE');
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

    removeEncounterHost() {
        this.call.remove();
    }

}

export { VisualEncounterHost }