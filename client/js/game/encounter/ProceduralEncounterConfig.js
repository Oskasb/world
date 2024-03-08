
let example =                 {
    "pos": [0, 0, 0],
    "visibility": 1,
    "grid_id": "grid_12x12",
    "host_id": "bandit_basic",
    "indicator_id": "battle_indicator",
    "trigger_radius": 2,
    "spawn": {
        "actors": [
            {
                "actor": "ACTOR_FIGHTER",
                "rot": [0, 1.2, 0],
                "on_ground": true,
                "tile": [5, 4]
            },
        ]
    }
}

class ProceduralEncounterConfig {
    constructor() {
        this.config = {
            "pos": [0, 0, 0],
            "visibility": 1,
            "grid_id": "grid_7x7",
            "host_id": "bandit_basic",
            "indicator_id": "battle_indicator",
            "trigger_radius": 2,
            "interact_options": [
                {"interaction": "FIGHT", "text": "Attack", "dispatch":  {
                        "event":"ENCOUNTER_ENGAGE", "value":{}}
                },
                {"interaction": "TALK",  "text": "Hi! Please go away so I can pass", "dispatch":  {
                        "event":"ENCOUNTER_CONVERSE", "value":{"skip": true}}
                },
                {"interaction": "LEAVE", "text": "Sorry to disturb you, just leaving."}
            ],
            "spawn": {
                "actors": [
                    {
                        "actor": "ACTOR_FIGHTER",
                        "rot": [0, 1.2, 0],
                        "on_ground": true,
                        "tile": [3, 3]
                    },
                ]
            }
        }
    }

    generateConfig(pos, groundData, terrainData) {
        console.log("generateConfig", pos, groundData, terrainData);
        this.config['pos'][0] = pos.x;
        this.config['pos'][1] = pos.y;
        this.config['pos'][2] = pos.z;

    }

}

export { ProceduralEncounterConfig }