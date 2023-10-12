import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";

class AttackSelector {
    constructor() {
    }

    selectActorAttack(actor) {
        let attack = poolFetch('ActorAttack');
        attack.initAttack(actor);
        return attack;
    }



}

export { AttackSelector }