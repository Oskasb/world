import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";

class ActionSelector {
    constructor() {
    }

    selectActorAction(actor) {
        let actions = actor.getStatus('actions')
    //    console.log(actions)
        let action = poolFetch('ActorAction');
        let actionKey = MATH.getRandomArrayEntry(actions);
        action.setActionKey(actionKey);
        action.initAction(actor);
        return action;
    }



}

export { ActionSelector }