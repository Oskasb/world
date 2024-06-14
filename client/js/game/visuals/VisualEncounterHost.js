import {isDev} from "../../application/utils/DebugUtils.js";

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
            if (actor !== null) {
                actor.activateGameActor();
            } else {
                this.applyHostConfig(this.config, setActor);
            }
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
                if (isDev()) {
                    console.log("Actor already Removed... boo")
                }

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


    updateConfig(actor, config) {
        MATH.rotateObj(actor.actorObj3d, config.rot)
        actor.setStatusKey(ENUMS.ActorStatus.ALIGNMENT, config['ALIGNMENT'] || 'HOSTILE');
        actor.setSpatialPosition(this.getPos())
    }

    applyHostConfig(config, actorReady) {
        this.config = config;
        if (this.call.getActor() === null) {
            let actorLoaded = function(actor) {
                this.call.setActor(actor);
                this.updateConfig(this.call.getActor(), config)
                actorReady(actor)
            }.bind(this)

            if (config.actor) {
                evt.dispatch(ENUMS.Event.LOAD_ACTOR, {id: config.actor, pos:this.getPos(), callback:actorLoaded});
            }
        } else {
            this.updateConfig(this.call.getActor(), config)
            actorReady(this.call.getActor())
        }

    //    this.call.unloadActor();


    }

    showEncounterHost() {
        this.call.show();
    }

    removeEncounterHost() {
        this.call.remove();
    }

}

export { VisualEncounterHost }