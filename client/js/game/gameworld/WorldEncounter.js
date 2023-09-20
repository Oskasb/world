import {Object3D} from "../../../libs/three/core/Object3D.js";
import { VisualEncounterHost } from "../visuals/VisualEncounterHost.js";
import { EncounterIndicator } from "../visuals/EncounterIndicator.js";
import {parseConfigDataKey} from "../../application/utils/ConfigUtils.js";

let radiusEvent = {

}
let indicateTriggerRadius = function(encounter) {
    let radius = encounter.config.trigger_radius
    radiusEvent.heads = Math.ceil(MATH.curveSqrt(radius));
    radiusEvent.speed = MATH.curveSqrt(radius)
    radiusEvent.radius = radius;
    radiusEvent.pos = encounter.getPos();
    radiusEvent.rgba = encounter.getTriggerRGBA();
    evt.dispatch(ENUMS.Event.INDICATE_RADIUS, radiusEvent)
}

let encounterEvent = {};

function deactivateWorldEncounter(encounter) {
    ThreeAPI.clearTerrainLodUpdateCallback(encounter.call.lodUpdated)
    encounter.removeWorldEncounter()
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
            encounterEvent.pos = encounter.getPos();
            encounterEvent.grid_id = encounter.config.grid_id;
            encounterEvent.spawn = encounter.config.spawn;
            evt.dispatch(ENUMS.Event.GAME_MODE_BATTLE, encounterEvent)
            deactivateWorldEncounter(encounter);
        }
    }

}

class WorldEncounter {
    constructor(config) {
        this.config = config;
        this.obj3d = new Object3D();
        MATH.vec3FromArray(this.obj3d.position, this.config.pos)
        this.obj3d.position.y = ThreeAPI.terrainAt(this.obj3d.position);

        this.visualEncounterHost = new VisualEncounterHost(this.obj3d);
        this.encounterIndicator = new EncounterIndicator(this.obj3d)

        this.isVisible = false;

        let lodUpdated = function(lodLevel) {
            console.log(lodLevel)
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
            console.log("config host_id: ", this.config.host_id)
            let onData = function(config) {
                this.visualEncounterHost.applyHostConfig(config);
            }.bind(this)

            parseConfigDataKey("ENCOUNTER_HOSTS", "HOSTS",  'host_data', this.config.host_id, onData)
        }

        if (this.config.indicator_id) {
            console.log("config indicator_id: ", this.config.indicator_id)
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
        ThreeAPI.registerTerrainLodUpdateCallback(this.getPos(), this.call.lodUpdated)
    }



    showWorldEncounter() {
        if (this.isVisible) {
            return;
        }
        console.log("showWorldEncounter", this)

        this.encounterIndicator.showIndicator();
        this.visualEncounterHost.showEncounterHost();
        GameAPI.registerGameUpdateCallback(this.call.onGameUpdate)
        this.isVisible = true;
    }

    removeWorldEncounter() {
        if (this.isVisible) {
            console.log("removeWorldEncounter", this)
            this.encounterIndicator.hideIndicator();
            this.visualEncounterHost.hideEncounterHost();
            GameAPI.unregisterGameUpdateCallback(this.call.onGameUpdate)
        }
        this.isVisible = false;
    }


}

export { WorldEncounter }