import {Object3D} from "../../../libs/three/core/Object3D.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import * as CombatFxOptions from "../combat/feedback/CombatFxOptions.js";
import * as CombatFxUtils from "../combat/feedback/CombatFxUtils.js";

let calcVec = new Vector3();
let calcVec2 = new Vector3();
let tempVec3 = new Vector3();

let attachEncounterFx = function(encounter) {

    encounter.fxObj3d.copy(encounter.obj3d);


    let indicator = encounter.config.indicator

    encounter.fxObj3d.position.y += indicator.height;

    let rgba = indicator.rgba;

    let effectCb = function(efct) {
        efct.activateEffectFromConfigId()
        efct.setEffectPosition(encounter.fxObj3d.position)
        //    let options = CombatFxOptions.setupOptsBoneToGround(efct, gamePiece)
        //    options.toSize*=0.5;
        efct.setEffectSpriteXY(indicator.sprite[0], indicator.sprite[1]);
        efct.scaleEffectSize(indicator.size);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(rgba[0], rgba[1], rgba[2], rgba[3]))
        //    efct.activateSpatialTransition(options)
        encounter.encounterFx = efct;
        GameAPI.registerGameUpdateCallback(encounter.call.updateEffect)
    }.bind(this)

    //   if (Math.random() < 0.2) {
    EffectAPI.buildEffectClassByConfigId('normal_stamps_8x8', 'stamp_normal_pool',  effectCb)
    //   }

}

let detachEncounterFx = function(encounter) {
    encounter.encounterFx.recoverEffectOfClass(encounter.call.updateEffect);
    GameAPI.unregisterGameUpdateCallback(encounter.call.updateEffect)
}


let radiusEvent = {

}
let indicateTriggerRadius = function(encounter) {
    let trigger = encounter.config.trigger;
    radiusEvent.heads = trigger.heads;
    radiusEvent.speed = trigger.speed;
    radiusEvent.radius = trigger.radius;
    radiusEvent.pos = encounter.getPos();
    radiusEvent.rgba = encounter.config.indicator.rgba;
    evt.dispatch(ENUMS.Event.INDICATE_RADIUS, radiusEvent)
}

function checkTriggerPlayer(encounter) {

    let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();

    if (selectedActor) {
        let trigger = encounter.config.trigger;
        let radius = trigger.radius;
        let distance = MATH.distanceBetween(selectedActor.getPos(), encounter.getPos())

        if (distance < radius) {
            radiusEvent.heads = 2
            radiusEvent.speed = 8
            radiusEvent.radius = distance - radius
            radiusEvent.pos = selectedActor.getPos();
            radiusEvent.rgba = [0.5, 0.5, 1,1];
            evt.dispatch(ENUMS.Event.INDICATE_RADIUS, radiusEvent)
        }

    }


}

class WorldEncounter {
    constructor(config) {
        this.config = config;
        this.obj3d = new Object3D();
        this.fxObj3d = new Object3D();
        MATH.vec3FromArray(this.obj3d.position, this.config.pos)

   //     if (config['on_ground']) {
            this.obj3d.position.y = ThreeAPI.terrainAt(this.obj3d.position);
            //    console.log("Stick to ground", this.obj3d.position.y)
    //    }

    //    MATH.vec3FromArray(this.obj3d.scale, this.config.scale)

    //    this.obj3d.rotateX(this.config.rot[0]);
    //    this.obj3d.rotateY(this.config.rot[1]);
    //    this.obj3d.rotateZ(this.config.rot[2]);



        this.isVisible = false;

        let lodUpdated = function(lodLevel) {
            if (lodLevel !== -1 && lodLevel < config['visibility']) {
                this.showWorldEncounter()
                this.isVisible = true;
            } else {
                this.removeWorldEncounter()
                this.isVisible = false;
            }

        }.bind(this)


        let onGameUpdate = function(tpf, gameTime) {
            indicateTriggerRadius(this, gameTime);
            checkTriggerPlayer(this);
        }.bind(this)

        let updateEffect = function(tpf) {
            this.fxObj3d.rotateY(tpf);
            this.encounterFx.setEffectQuaternion(this.fxObj3d.quaternion)

        }.bind(this)

        this.call = {
            lodUpdated:lodUpdated,
            onGameUpdate:onGameUpdate,
            updateEffect:updateEffect
        }

        let actorLoaded = function(actor) {
            console.log("Enc Actor", actor);
            MATH.rotateObj(actor.actorObj3d, this.config.host.rot)
            this.actor = actor;
        }.bind(this)

        if (this.config.host) {
            evt.dispatch(ENUMS.Event.LOAD_ACTOR, {id: this.config.host.actor, pos:this.getPos(), callback:actorLoaded});
        }




    }

    getPos() {
        return this.obj3d.position;
    }

    showWorldEncounter() {
        if (this.isVisible) {
            return;
        }
        console.log("showWorldEncounter", this)
        attachEncounterFx(this);
        this.actor.activateGameActor();
        GameAPI.registerGameUpdateCallback(this.call.onGameUpdate)
    }

    removeWorldEncounter() {
        if (this.isVisible) {
            console.log("removeWorldEncounter", this)
            detachEncounterFx(this);
            GameAPI.unregisterGameUpdateCallback(this.call.onGameUpdate)
            this.actor.deactivateGameActor();
        }

    }


}

export { WorldEncounter }