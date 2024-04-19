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

            if (deactivated === true) {
                setTimeout(remove, 100)
            } else {
                actor.activateGameActor();
            }

        }

        let show = function() {
            deactivated = false;
        //    if (actor) {
        //        actor.activateGameActor();
        //    } else {
                this.applyHostConfig(this.config, setActor);
        //    }
        }.bind(this)

        let hide = function() {
            remove()
        }

        let deactivated = false;

        let unloadActor = function() {
            if (actor !== null) {
                actor.removeGameActor();
                actor = null;
            }
        }

        let remove = function() {
            if (actor !== null) {
                actor.removeGameActor();
                actor = null;
            } else {
                deactivated = true;
                console.log("Actor already Removed... boo")
            }
        }

        this.call = {
            getActor:getActor,
            setActor:setActor,
            show:show,
            hide:hide,
            unloadActor:unloadActor,
            remove:remove
        }

    }

    getPos() {
        return this.obj3d.position;
    }

    applyHostConfig(config, actorReady) {
        this.config = config;
        this.call.unloadActor();
        let actorLoaded = function(actor) {
            MATH.rotateObj(actor.actorObj3d, config.rot)
            actor.setStatusKey(ENUMS.ActorStatus.ALIGNMENT, config['ALIGNMENT'] || 'HOSTILE');
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

    removeEncounterHost() {
        this.call.remove();
    }

}

export { VisualEncounterHost }