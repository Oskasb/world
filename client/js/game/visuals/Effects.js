let effectMap = {} // get these from poolFetch

effectMap[ENUMS.ActorStatus.IS_LEAPING] = {
    className:'VisualPulse',
    activateOn:true,
    deactivateOn:false,
    color:'LEAP_FX'
}

effectMap[ENUMS.ActorStatus.TRAVEL_MODE] = {};

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


export {
    effectMap
}