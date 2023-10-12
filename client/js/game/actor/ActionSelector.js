import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";

class ActionSelector {
    constructor() {
    }

    selectActorAction(actor, availableActions) {
        let attack = poolFetch('ActorAction');
        let actionKey = MATH.getRandomArrayEntry(availableActions);
        attack.initAttack(actor, actionKey);
        return attack;
    }



}

export { ActionSelector }