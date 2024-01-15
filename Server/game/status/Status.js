import {
    getServerConfig,
    parseConfigData
} from "../utils/GameServerFunctions.js";
import {ENUMS} from "../../../client/js/application/ENUMS.js";

class Status {
    constructor(statusValues) {
        this.statusMap = statusValues || {};

        if (this.statusMap[ENUMS.ActorStatus.CONFIG_ID]) {
            let configId = statusValues[ENUMS.ActorStatus.CONFIG_ID]
        //    console.log("Load Actor Configs", configId)
            let actorConfigs = getServerConfig("GAME")['ACTORS'];
            let conf = parseConfigData(actorConfigs, configId)
        //    console.log("Actor Configs", conf, conf['stats_id']);
            let statsId = conf['stats_id'];
            if (statsId) {
                let statConfigs = getServerConfig("GAME")['CHARACTER_STATS']
                let statConf = parseConfigData(statConfigs, statsId).status;
            //    console.log("Stat Conf: ", statConf)
                if (typeof (statConf) === 'object') {
                    for (let key in statConf) {
                        this.statusMap[key] = statConf[key];
                    }
                }
            //    console.log("server actor status loaded", this.statusMap);
            }

        }

    }

    setStatusKey(key, status) {
        this.statusMap[key] = status;
    }

    getStatus(key) {
        return this.statusMap[key];
    }

}

export { Status }