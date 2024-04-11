
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
                "patterns": [
                    {"pattern_id":"sp_pair_row", "tile": [3, 4]}
                ],
                "actors": [
                    {
                        "actor": "ACTOR_FIGHTER",
                        "rot": [0, 1.2, 0],
                        "on_ground": true,
                        "tile": [4, 4]
                    },
                ]
            }
        }
    }

    generateConfig(pos, encounterLevel, groundData, terrainData) {
    //    console.log("generateConfig", pos, groundData, terrainData);
        MATH.vec3ToArray(pos, this.config.pos, 1);
        MATH.vec3FromArray(this.config.pos, pos);
        this.config.pos[1] = MATH.decimalify(ThreeAPI.terrainAt(pos), 10);
        this.config['level'] = encounterLevel;
    }

}

export { ProceduralEncounterConfig }