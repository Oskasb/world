import {effectCalls} from "../combat/feedback/CombatEffects.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../libs/three/core/Object3D.js";
import {configDataList} from "../../application/utils/ConfigUtils.js";

let tempVec = new Vector3();
let tempObj3D = new Object3D();

let config = {};
let configUpdated = function(cfg) {
    config = cfg;
 //   console.log("VisualActionConfig: ", config);
}

setTimeout(function() {
    configDataList("GAME_VISUALS", "ACTIONS", configUpdated)
}, 2000)

let visualConfigDefaults = {
    "icon_key":"magic_missile",
    "fx_selected":"combat_effect_hands_magic_power",
    "fx_precast":"combat_effect_hands_fire",
    "fx_active":"combat_effect_fire_missile",
    "fx_apply":"combat_effect_fireball",
    "fx_post_hit":"damage_effect_catch_on_fire"
}

let fxKeys = [
    "fx_selected",
    "fx_precast",
    "fx_active",
    "fx_apply",
    "fx_post_hit"
]

class VisualAction {
    constructor() {

        this.sourcePos = new Vector3();
        this.targetPos = new Vector3();
        this.actorAction = null;
        this.progress = 0;
        this.config = visualConfigDefaults;
        this.rightHandObj3d = new Object3D();
        this.leftHandObj3d = new Object3D();

        let missileEffect = null;
        let missileActive = false;

        let updateSelected = function() {
            this.getActor().getVisualJointWorldTransform('HAND_R', this.rightHandObj3d)
            this.getActor().getVisualJointWorldTransform('HAND_L', this.leftHandObj3d)
            effectCalls()[this.config[fxKeys[0]]](this.getActor(), this.rightHandObj3d)
            effectCalls()[this.config[fxKeys[0]]](this.getActor(), this.leftHandObj3d)
        }.bind(this)

        let updatePrecast = function() {
            this.getActor().getVisualJointWorldTransform('HAND_R', this.rightHandObj3d)
            this.getActor().getVisualJointWorldTransform('HAND_L', this.leftHandObj3d)
            effectCalls()[this.config[fxKeys[1]]](this.getActor(), this.rightHandObj3d)
            effectCalls()[this.config[fxKeys[1]]](this.getActor(), this.leftHandObj3d)
        }.bind(this)

        let updateActive = function() {
            if (missileEffect !== null) {
                if (missileActive === false) {
                    tempObj3D.position.copy(missileEffect.pos)
                    effectCalls()[this.config[fxKeys[1]]](this.getActor(), tempObj3D)
                    missileActive = true;
                }
            }
        }.bind(this)

        let updateApplyHit = function() {
            missileActive = false;

            let target = this.getTarget();
            if (target) { // target can be in different context (in or outside encounter)
                effectCalls()[this.config[fxKeys[3]]](this.getTarget())
            }

        }.bind(this)

        let updatePostHit = function() {
            missileEffect = null;
            let target = this.getTarget();
            if (target) {
                effectCalls()[this.config[fxKeys[4]]](this.getTarget())
            }

        }.bind(this)

        let updateDisabled = function() {

        }.bind(this)

        let fxCallback = function(efct) {
            missileEffect = efct;
        }

        this.update = {
            updateDisabled:updateDisabled,
            updateSelected:updateSelected,
            updatePrecast:updatePrecast,
            updateActive:updateActive,
            updateApplyHit:updateApplyHit,
            updatePostHit:updatePostHit
        }

        let stateMap = []
        stateMap[ENUMS.ActionState.DISABLED] =  {updateFunc:'updateDisabled'}
        stateMap[ENUMS.ActionState.SELECTED] =  {updateFunc:'updateSelected'}
        stateMap[ENUMS.ActionState.PRECAST] =   {updateFunc:'updatePrecast'}
        stateMap[ENUMS.ActionState.ACTIVE] =    {updateFunc:'updateActive'}
        stateMap[ENUMS.ActionState.APPLY_HIT] = {updateFunc:'updateApplyHit'}
        stateMap[ENUMS.ActionState.POST_HIT] =  {updateFunc:'updatePostHit'}
        stateMap[ENUMS.ActionState.COMPLETED] = {updateFunc:'updateActionCompleted'}

        let updateVisualAction = function(tpf) {
            let actionState = this.actorAction.call.getStatus(ENUMS.ActionStatus.ACTION_STATE);
            if (stateMap[actionState]) {
                if (typeof(this.update[stateMap[actionState].updateFunc]) === 'function' ) {
                    this.update[stateMap[actionState].updateFunc]()
                } else {
                    console.log("Visual Action dismissed early...")
                    this.closeVisualAction();
                }

            } else {
                console.log("No Update Function for state", actionState);
            }

        }.bind(this);

        this.call = {
            fxCallback:fxCallback,
            updateVisualAction:updateVisualAction
        }

    }

    setActorAction(actorAction, visualActionKey) {
        this.actorAction = actorAction;
        this.name = config[visualActionKey]['name'] || 'NYI'
        this.iconKey = config[visualActionKey]['icon_key'] || 'magic_missile'
        this.config = config[visualActionKey]['effects'] || visualConfigDefaults;
    }

    getActor() {
        return GameAPI.getActorById(this.actorAction.call.getStatus(ENUMS.ActionStatus.ACTOR_ID));
    }

    getTarget() {
        return this.actorAction.getTarget();
    }


   activateVisualAction(actorAction) {
       this.actorAction = actorAction;
        ThreeAPI.addPostrenderCallback(this.call.updateVisualAction)
    }

    visualizeAttack(onArriveCB) {
        this.progress = 0;
        let actor = this.getActor();
        this.sourcePos.copy(actor.getSpatialPosition())
        this.sourcePos.y +=1.5;

        let tPos = this.targetPos;

        let getTargetPos = function() {
            let target = this.getTarget()
            if (target) {
                target.getSpatialPosition(tPos)
                tPos.y +=1.5;
                return tPos;
            } else {
                return tPos;
            }
        }.bind(this)

        let onMissileArrive = function(gameEffect) {
    //        console.log("Missile Arrive", gameEffect)
            if (typeof (onArriveCB) === 'function' ) {
                onArriveCB();
            }
        }
    //    actorAction.call.advanceState();
        let fxKey = this.config['fx_active']
        console.log("Fx Key ", fxKey);
        effectCalls()[fxKey](this.sourcePos, actor, 0, onMissileArrive, getTargetPos, this.call.fxCallback)

    }

    closeVisualAction() {
        ThreeAPI.unregisterPostrenderCallback(this.call.updateVisualAction)
    }


}

export {VisualAction}