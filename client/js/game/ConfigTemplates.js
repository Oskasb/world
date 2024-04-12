const encounterTemplates = {

    BASIC:{
        pos: [    0,    0,    0],
        visibility: 1,
        grid_id: "grid_7x7",
        host_id: "bandit_basic",
        indicator_id: "battle_indicator",
        trigger_radius: 2,
        interact_options: [
            {
                interaction: "FIGHT",
                text: "Attack",
                dispatch: {
                    event: "ENCOUNTER_ENGAGE",
                    value: {}
                }
            },
            {
                interaction: "TALK",
                text: "Hi! Please go away so I can pass",
                dispatch: {
                    event: "ENCOUNTER_CONVERSE",
                    value: {
                        skip: true
                    }
                }
            },
            {
                interaction: "LEAVE",
                text: "Sorry to disturb you, just leaving."
            }
        ],
        spawn: {
            patterns: [
                {
                    pattern_id: "sp_pair_row",
                    tile: [   3,   4  ]
                }
            ],
            actors: [
                {
                    actor: "ACTOR_FIGHTER",
                    rot: [     0,        1.2,    0     ],
                    on_ground: true,
                    tile: [   4,    4    ]
                }
            ]
        },
        level: 1,
        edit_id: ""
    }
}

export {
    encounterTemplates
}