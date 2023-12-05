import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";

class ActionSelector {
    constructor() {
    }

    selectActorAction(actor) {
        let actions = actor.getStatus(ENUMS.ActorStatus.ACTIONS)
    //    console.log(actions)
        let action = poolFetch('ActorAction');
        let actionKey = MATH.getRandomArrayEntry(actions);
        action.setActionKey(actor, actionKey);
        action.initAction(actor);
        return action;
    }



}

export { ActionSelector }