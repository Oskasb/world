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
    },
    QUEST_START:{
        pos: [    0,    0,    0],
        visibility: 1,
        grid_id: "grid_5x5",
        host_id: "quest_basic",
        indicator_id: "quest_indicator",
        trigger_radius: 0,
        text: "Please help!",
        interact_options: [
            {
                interaction: "QUEST_ACCEPT",
                text: "At your service",
                dispatch: {
                    event: "ENCOUNTER_CONVERSE",
                    value: {
                        adventure: true,
                        skip: true
                    }
                }
            },
            {
                interaction: "LEAVE",
                text: "I got better things to do."
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
    },
    QUEST_END:{
        pos: [    0,    0,    0],
        visibility: 1,
        grid_id: "grid_5x5",
        host_id: "quest_basic",
        indicator_id: "quest_end_indicator",
        trigger_radius: 0,
        text: "Nicely done. Have a reward!",
        interact_options: [
            {
                interaction: "QUEST_COMPLETE",
                text: "No problemo.",
                dispatch: {
                    event: "ENCOUNTER_CONVERSE",
                    value: {
                        adventure: true,
                        skip: true
                    }
                }
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