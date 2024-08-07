import {Object3D} from "../../../libs/three/core/Object3D.js";
import {EncounterIndicator} from "../visuals/EncounterIndicator.js";
import {parseConfigDataKey} from "../../application/utils/ConfigUtils.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {colorMapFx} from "../visuals/Colors.js";
import {transitionEffectOn} from "../visuals/effects/VisualTriggerFx.js";
import {defaultEffectValues} from "../visuals/effects/EffectEventDefaults.js";

let tempVec = new Vector3()
let calcVec = new Vector3()

let radiusEvent = {}

let indicateTriggerRadius = function(treasure) {
    let radius = treasure.config.trigger_radius || 2
    radiusEvent.heads = Math.ceil(MATH.curveSqrt(radius))+3;
    radiusEvent.speed = MATH.curveSqrt(radius) * 3
    radiusEvent.radius = radius;
    radiusEvent.pos = treasure.getPos();
    radiusEvent.rgba = treasure.getTriggerRGBA();
    radiusEvent.elevation = 0;
    evt.dispatch(ENUMS.Event.INDICATE_RADIUS, radiusEvent)
}

let encounterEvent = {};
let green =  [0, 0.5, 0.0, 1]
let triggeredCount = 0;

let indicateTriggerTime = function(actor, treasure, fraction) {
    let progress = fraction;

    let radius = 0.5 + MATH.curveQuad(1-progress)
    radiusEvent.heads = 1;
    radiusEvent.speed = 1.5 * MATH.curveQuad(progress) + 0.1;
    radiusEvent.radius = radius;
    radiusEvent.pos = tempVec


    radiusEvent.pos.copy(actor.getSpatialPosition());
    radiusEvent.rgba = green;
    radiusEvent.elevation = 2 - progress * 2;
    evt.dispatch(ENUMS.Event.INDICATE_RADIUS, radiusEvent)
    radiusEvent.elevation = 0;
    evt.dispatch(ENUMS.Event.INDICATE_RADIUS, radiusEvent)

    radiusEvent.pos.copy(treasure.getPos());
    radiusEvent.rgba = treasure.getTriggerRGBA();
    radiusEvent.elevation = 2 - progress * 2;
    evt.dispatch(ENUMS.Event.INDICATE_RADIUS, radiusEvent)
    radiusEvent.elevation = 0;
    evt.dispatch(ENUMS.Event.INDICATE_RADIUS, radiusEvent)
}

let effectData ={
    color:'TREASURE'
}

function checkTriggerPlayer(treasure) {

    let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();

    if (selectedActor) {
        let tpf = GameAPI.getFrame().tpf
        let radius = treasure.triggerRadius || 2;
        let distance = MATH.distanceBetween(selectedActor.getSpatialPosition(), treasure.getPos())

        if (distance < radius + 2) {
            indicateTriggerRadius(treasure);
        //    testDestinationForTrigger(selectedActor, encounter, radius)
            if (treasure.timeInsideProximity === 0) {
                selectedActor.actorText.say("I see Treasure")

                if (treasure.engagementArc === null) {
                    treasure.engagementArc = poolFetch('VisualEngagementArc')
                    treasure.engagementArc.on(null, selectedActor, null);
                    treasure.engagementArc.rgba = colorMapFx['TREASURE']
                }
            }

            treasure.timeInsideProximity += tpf;

            if (treasure.engagementArc !== null) {
                treasure.engagementArc.to.copy(treasure.getPos());
                treasure.engagementArc.from.copy(selectedActor.getSpatialPosition());
            }


        } else {

            if (treasure.engagementArc !== null) {
                treasure.engagementArc.off();
                treasure.engagementArc = null;
            }

            treasure.timeInsideProximity = 0;
        }

        if (distance < radius) {

            if (treasure.timeInsideTrigger === 0) {
                console.log("Trigger treasure")
                treasure.triggered = true;
                treasure.spatialTransition = poolFetch('SpatialTransition')
                let transition = treasure.spatialTransition;


                //    walkGrid.dynamicWalker.attachFrameLeapTransitionFx(actor)
                let onArrive = function(pos, spatTransition) {
                    poolReturn(spatTransition);
                    treasure.spatialTransition = null;

                    if (treasure.engagementArc !== null) {
                        treasure.engagementArc.off();
                        treasure.engagementArc = null;
                    }

                    let vItems = treasure.call.getVisualItems();
                    for (let i = 0; i < vItems.length; i++) {
                        let item = vItems[i].item
                        selectedActor.processItemLooted(item);
                        GuiAPI.notifyItemLooted(selectedActor, item);
                    }
                    let lootedTreasures = GameAPI.gameAdventureSystem.getLootedTreasures();
                    lootedTreasures.push(treasure.id);
                    treasure.deactivateWorldTreasure();
                }

                let onFrameUpdate = function(pos, vel, fraction) {
                    treasure.getPos().copy(pos);
                    updateTriggered(treasure, fraction)
                }

                let getTargetPos = function() {
                    return selectedActor.getCenterMass();
                }

                transition.initSpatialTransition(treasure.getPos(), getTargetPos, 1, onArrive, 2, 'curveQuad', onFrameUpdate)

                triggeredCount++
            }

            treasure.timeInsideTrigger += tpf;
        } else {
            treasure.timeInsideTrigger = 0;
        }
    }
}

let updateTriggered = function(treasure, fraction) {
    let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();
    treasure.timeInsideTrigger += GameAPI.getFrame().tpf;
    if (treasure.engagementArc !== null) {
        treasure.engagementArc.to.copy(treasure.getPos());
        treasure.engagementArc.from.copy(selectedActor.getSpatialPosition());
    }
    indicateTriggerTime(selectedActor, treasure, fraction)
}

class WorldTreasure {
    constructor(id, config, onReady) {
        this.id = id;
        this.triggered = false;
        this.activated = false;
        this.timeInsideTrigger = 0;
        this.config = config;
        this.triggerRadius = config.trigger_radius || 2
        this.engagementArc = null;
        this.obj3d = new Object3D();
        this.obj3d.scale.set(10, 10, 10)
        MATH.vec3FromArray(this.obj3d.position, this.config.pos)
        this.obj3d.position.y = ThreeAPI.terrainAt(this.obj3d.position);
        this.encounterIndicator = new EncounterIndicator(this.obj3d)


        if (this.config.indicator_id) {
            //    console.log("config indicator_id: ", this.config.indicator_id)
            let onIndicatorData = function(config) {
                this.encounterIndicator.applyIndicatorConfig(config);
            }.bind(this)

            parseConfigDataKey("ENCOUNTER_INDICATORS", "INDICATORS",  'indicator_data', this.config.indicator_id, onIndicatorData)
        }

        this.isVisible = false;

        let lastLod = null;

        let lodUpdated = function(lodLevel) {
            if (lastLod === lodLevel) return;
            lastLod = lodLevel;
            //    console.log(lodLevel)
            if (lodLevel !== -1 && lodLevel <= config['visibility']) {
                if (this.isVisible === false) {
                    this.showWorldTreasure()
                }
                this.isVisible = true
            } else {
                if (this.isVisible === true) {
                    this.hideWorldTreasure()
                }
                this.isVisible = false
            }
        }.bind(this)



        let onGameUpdate = function(tpf, gameTime) {
            this.obj3d.position.y += Math.sin(GameAPI.getGameTime()*3) * 0.01;
            if (this.triggered) {
            //    updateTriggered(this);
            } else {
                checkTriggerPlayer(this, gameTime);
            }
        }.bind(this)

        let spawn = config.spawn;
        let items = []
        if (spawn) {
            if (spawn.items) {
                items = spawn.items;
            }
        }

        let treasure = this;

        let getPos = function () {
            return this.obj3d.position;
        }.bind(this);

        let visualItems = [];

        let spawnHostItem = function() {

            for (let i = 0; i < items.length; i++) {

                let itemId = items[i].item;
                let scale = items[i].scale || [1, 1, 1];
                let rot = items[i].rot || [-1, 0, 0];
                let spin = items[i].spin || [0, 0, 0];

                let addVisualItem = function(vItem) {
                    let obj3d = vItem.getSpatial().obj3d;
                    let item = vItem.item;
                    let itemUpdateCb = function(tpf) {
                        //    this.call.getPiece().getSpatialPosition(tempObj3d.position);
                        //    this.call.getPiece().getSpatialQuaternion(tempObj3d.quaternion);
                        //    this.call.getPiece().getSpatialScale(tempObj3d.scale);

                        let gameTime = GameAPI.getGameTime()

                        obj3d.quaternion.set(0, 0, 0, 1);
                        MATH.rotXYZFromArray(obj3d, rot);
                        obj3d.rotateX(gameTime * spin[0])
                        obj3d.rotateY(gameTime * spin[1])
                        obj3d.rotateZ(gameTime * spin[2])

                        obj3d.position.copy(getPos());
                        obj3d.position.y += 0.5 + Math.sin(GameAPI.getGameTime()*5) * 0.005;
                        MATH.vec3FromArray(obj3d.scale, scale);

                    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: obj3d.position, color:'RED', size:0.5})
                        item.getVisualGamePiece().getSpatial().stickToObj3D(obj3d);
                    //    effectData = defaultEffectValues['GLITTER']
                        transitionEffectOn(obj3d.position, effectData);
                    }
                    MATH.rotXYZFromArray(obj3d, rot);

                    vItem.setUpdateCallback(itemUpdateCb);

                    vItem.getPos().copy(this.getPos());
                    vItem.getPos().y += 0.5;
                }.bind(this);

                let setupVisualItem = function(item) {
                    let vItem = poolFetch('VisualItem');
                    visualItems.push(vItem);
                    vItem.setItem(item, addVisualItem);
                }

                evt.dispatch(ENUMS.Event.LOAD_ITEM,  {id: items[i].item, callback:setupVisualItem})
            }

        }.bind(this)

        let despawnHostItem = function() {
            while (visualItems.length) {
                let item = visualItems.pop().item;
                item.disposeItem();
            }
        };

        let getVisualItems = function() {
            return visualItems;
        }

        this.call = {
            lodUpdated:lodUpdated,
            onGameUpdate:onGameUpdate,
            spawnHostItem:spawnHostItem,
            despawnHostItem:despawnHostItem,
            getVisualItems:getVisualItems
        }
        onReady(this);
    }

    getTriggerRGBA() {
        return this.encounterIndicator.config.rgba
    }

    getPos() {
        return this.obj3d.position;
    }
    activateWorldTreasure() {
    //    console.log("Activate Treasure ", this)
        ThreeAPI.registerTerrainLodUpdateCallback(this.getPos(), this.call.lodUpdated)
    }

    deactivateWorldTreasure() {
        ThreeAPI.clearTerrainLodUpdateCallback(this.call.lodUpdated)
        this.removeWorldTreasure()
    }

    showWorldTreasure() {
        //   console.log("showWorldTreasure", lodLevel, this)
        if (this.isVisible) {
            console.log("ALREADY VISIBLE showWorldTreasure", this)
            return;
        }

        this.encounterIndicator.showIndicator();
        this.call.spawnHostItem()
        GameAPI.registerGameUpdateCallback(this.call.onGameUpdate)
        this.isVisible = true;
    }

    hideWorldTreasure() {
        if (this.isVisible) {
            this.encounterIndicator.hideIndicator();
            GameAPI.unregisterGameUpdateCallback(this.call.onGameUpdate)
        }

        if (this.engagementArc !== null) {
            this.engagementArc.off();
            this.engagementArc = null;
        }

    //    this.visualEncounterHost.hideEncounterHost();
        this.call.despawnHostItem()
        this.isVisible = false;
    }
    removeWorldTreasure() {
        this.hideWorldTreasure();
    //    this.visualEncounterHost.removeEncounterHost();
    }



}

export { WorldTreasure }