import {poolFetch} from "../../application/utils/PoolUtils.js";

class AttackSelector {
    constructor() {
    }

    selectActorAttack(actor, target) {
        let attack = poolFetch('ActorAttack');
        attack.initAttack(actor, target);
        return attack;
    }



}

export { AttackSelector }