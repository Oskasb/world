import {Object3D} from "../../../libs/three/core/Object3D.js";
import { Vector3 } from "../../../libs/three/math/Vector3.js";
import { VisualEncounterHost } from "../visuals/VisualEncounterHost.js";
import { EncounterIndicator } from "../visuals/EncounterIndicator.js";
import {parseConfigDataKey} from "../../application/utils/ConfigUtils.js";

let tempVec = new Vector3()

let radiusEvent = {

}
let indicateTriggerRadius = function(encounter) {
    let radius = encounter.config.trigger_radius
    radiusEvent.heads = Math.ceil(MATH.curveSqrt(radius));
    radiusEvent.speed = MATH.curveSqrt(radius)
    radiusEvent.radius = radius;
    radiusEvent.pos = encounter.getPos();
    radiusEvent.rgba = encounter.getTriggerRGBA();
    radiusEvent.elevation = 0;
    evt.dispatch(ENUMS.Event.INDICATE_RADIUS, radiusEvent)
}

let encounterEvent = {};

let green =  [0, 0.5, 0.0, 1]

let indicateTriggerTime = function(actor, encounter) {
    let radius = 0.5 + MATH.curveQuad(encounter.timeInsideTrigger)
    radiusEvent.heads = 1;
    radiusEvent.speed = 1.5 * MATH.curveQuad(encounter.timeInsideTrigger) + 0.1;
    radiusEvent.radius = radius;
    radiusEvent.pos = tempVec


    radiusEvent.pos.copy(actor.getPos());
    radiusEvent.rgba = green;
    radiusEvent.elevation = 2 - encounter.timeInsideTrigger * 2;
    evt.dispatch(ENUMS.Event.INDICATE_RADIUS, radiusEvent)
    radiusEvent.elevation = 0;
    evt.dispatch(ENUMS.Event.INDICATE_RADIUS, radiusEvent)

    radiusEvent.pos.copy(encounter.getPos());
    radiusEvent.rgba = encounter.getTriggerRGBA();
    radiusEvent.elevation = 2 - encounter.timeInsideTrigger * 2;
    evt.dispatch(ENUMS.Event.INDICATE_RADIUS, radiusEvent)
    radiusEvent.elevation = 0;
    evt.dispatch(ENUMS.Event.INDICATE_RADIUS, radiusEvent)
}

function checkTriggerPlayer(encounter) {

    let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();

    if (selectedActor) {
        let radius = encounter.config.trigger_radius;
        let distance = MATH.distanceBetween(selectedActor.getPos(), encounter.getPos())

        if (distance < radius * 2) {
            indicateTriggerRadius(encounter);
        }

        if (distance < radius) {
            if (encounter.timeInsideTrigger === 0) {
                selectedActor.getGameWalkGrid().setTargetPosition(encounter.getPos())
                selectedActor.getGameWalkGrid().cancelActivePath()
                evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'activate_encounter', pos:encounter.getPos()})
            //    selectedActor.getGameWalkGrid().buildGridPath(selectedActor.getPos(), selectedActor.getPos());
            //    selectedActor.getGameWalkGrid().applySelectedPath()
                console.log("Activate Encounter Triggered Transition")
            }
            encounter.timeInsideTrigger += GameAPI.getFrame().tpf *0.5;
            indicateTriggerTime(selectedActor, encounter)
            if (encounter.timeInsideTrigger > 1) {
                encounterEvent.pos = encounter.getPos();
                encounterEvent.grid_id = encounter.config.grid_id;
                encounterEvent.spawn = encounter.config.spawn;
                evt.dispatch(ENUMS.Event.GAME_MODE_BATTLE, encounterEvent)
            }
        } else {
            encounter.timeInsideTrigger = 0;
        }
    }
}

class WorldEncounter {
    constructor(config, onReady) {

        this.timeInsideTrigger = 0;
        this.config = config;
        this.obj3d = new Object3D();
        MATH.vec3FromArray(this.obj3d.position, this.config.pos)
        this.obj3d.position.y = ThreeAPI.terrainAt(this.obj3d.position);

        this.visualEncounterHost = new VisualEncounterHost(this.obj3d);
        this.encounterIndicator = new EncounterIndicator(this.obj3d)

        this.isVisible = false;

        let lastLod = null;

        let lodUpdated = function(lodLevel) {
            if (lastLod === lodLevel) return;
            lastLod = lodLevel;
        //    console.log(lodLevel)
            if (lodLevel !== -1 && lodLevel <= config['visibility']) {
                this.showWorldEncounter()
            } else {
                this.removeWorldEncounter()
            }

        }.bind(this)


        let onGameUpdate = function(tpf, gameTime) {
            checkTriggerPlayer(this, gameTime);
        }.bind(this)

        this.call = {
            lodUpdated:lodUpdated,
            onGameUpdate:onGameUpdate,
        }


        if (this.config.host_id) {
        //    console.log("config host_id: ", this.config.host_id)

            let actorReady = function(actor) {
                onReady(this)
            }.bind(this)

            let onData = function(config) {
                this.visualEncounterHost.applyHostConfig(config, actorReady);
            }.bind(this)

            parseConfigDataKey("ENCOUNTER_HOSTS", "HOSTS",  'host_data', this.config.host_id, onData)
        } else {
            onReady(this);
        }

        if (this.config.indicator_id) {
        //    console.log("config indicator_id: ", this.config.indicator_id)
            let onIndicatorData = function(config) {
                this.encounterIndicator.applyIndicatorConfig(config);
            }.bind(this)

            parseConfigDataKey("ENCOUNTER_INDICATORS", "INDICATORS",  'indicator_data', this.config.indicator_id, onIndicatorData)
        }

    }

    getPos() {
        return this.obj3d.position;
    }

    getTriggerRGBA() {
        return this.encounterIndicator.config.rgba
    }

    activateWorldEncounter() {
    //    console.log("activateWorldEncounter", this)
        ThreeAPI.registerTerrainLodUpdateCallback(this.getPos(), this.call.lodUpdated)
    }

    deactivateWorldEncounter() {
        ThreeAPI.clearTerrainLodUpdateCallback(this.call.lodUpdated)
        this.removeWorldEncounter()
    }

    showWorldEncounter() {
     //   console.log("showWorldEncounter", lodLevel, this)
        if (this.isVisible) {
            console.log("ALREADY VISIBLE showWorldEncounter", this)
            return;
        }


        this.encounterIndicator.showIndicator();
        this.visualEncounterHost.showEncounterHost();
        GameAPI.registerGameUpdateCallback(this.call.onGameUpdate)
        this.isVisible = true;
    }

    removeWorldEncounter() {
    //    console.log("removeWorldEncounter", lodLevel, this)
        if (this.isVisible) {

            this.encounterIndicator.hideIndicator();
            this.visualEncounterHost.hideEncounterHost();
            GameAPI.unregisterGameUpdateCallback(this.call.onGameUpdate)
        }
        this.isVisible = false;
    }


}

export { WorldEncounter }