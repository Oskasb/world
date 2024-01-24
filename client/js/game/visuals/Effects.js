import {VisualPieceEffectTransition} from "./effects/VisualPieceEffectTransition.js";

let effectMap = {} // get these from poolFetch
effectMap[ENUMS.ActorStatus.TRAVEL_MODE] = {};
effectMap[ENUMS.ActorStatus.COMBAT_STATUS] = {};

effectMap[ENUMS.ActorStatus.IS_LEAPING] = {
    className:'VisualPulse',
    activateOn:true,
    deactivateOn:false,
    color:'LEAP_FX'
}

effectMap[ENUMS.ActorStatus.ENGAGE_COUNT] = {
    className:'VisualEngagementIndicator',
    activateOn:1,
    deactivateOn:0,
    color:'DAMAGE_FX',
    effect:{
        fromSize:0.2,
        toSize:1.8,
        duration:0.25,
        sprite:[0, 0]
    }
}

effectMap[ENUMS.ActorStatus.DAMAGE_APPLIED] = {
    className:'VisualPieceEffectContinuous',
    activateOn:1,
    deactivateOn:0,
    maxDuration: 0.5,
    effect: {
        updateFunction: 'damageEffect'
    }
}

effectMap[ENUMS.ActorStatus.DEAD] = {
    className:'VisualPieceEffectTransition',
    activateOn:1,
    deactivateOn:0,
    maxDuration: 3,
    effect: {
        updateFunction: 'deathEffect'
    }
}




let travelFx = effectMap[ENUMS.ActorStatus.TRAVEL_MODE];

travelFx[ENUMS.TravelMode.TRAVEL_MODE_LEAP] = {
    className:'VisualTrajectory',
    color:'LEAP_FX',
    effect:{
        fromSize:2,
        toSize:0.2,
        duration:0.15,
        sprite:[4, 6]
    }
}

travelFx[ENUMS.TravelMode.TRAVEL_MODE_WALK] = {
    className:'VisualPulse',
    color:'WALK_FX'
}

travelFx[ENUMS.TravelMode.TRAVEL_MODE_FLY] = {
    className:'VisualModel',
    color:'LEAP_FX',
    effect:{
        fromSize:2,
        toSize:0.2,
        duration:0.15,
        sprite:[4, 6]
    }
}


let combatFx = effectMap[ENUMS.ActorStatus.COMBAT_STATUS];
combatFx[ENUMS.CombatStatus.LEAPING] = {
    className:'VisualTrajectory',
    color:'FORCE_FX',
    effect:{
        fromSize:0.5,
        toSize:0.2,
        duration:0.25,
        sprite:[4, 6]
    }
}

combatFx[ENUMS.CombatStatus.PUSHED] = {
    className:'VisualTrajectory',
    color:'FORCE_FX',
    effect:{
        fromSize:0.2,
        toSize:0.8,
        duration:0.25,
        sprite:[0, 0]
    }
}



export {
    effectMap
}