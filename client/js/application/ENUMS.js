if(typeof(ENUMS) === "undefined"){
    ENUMS = {};
}

(function(ENUMS){


    ENUMS.Message = {
        SAY:                        0,
        YELL:                       1,
        WHISPER:                    2,
        DAMAGE_NORMAL_TAKEN:        3,
        DAMAGE_NORMAL_DONE:         4,
        DAMAGE_CRITICAL_TAKEN:      5,
        DAMAGE_CRITICAL_DONE:       6,
        HEALING_GAINED:             7
    };

    ENUMS.Event = {
        REQUEST_WORKER:             0,
        REQUEST_FRAME:              1,
        FRAME_READY:                2,
        REQUEST_RENDER:             3,
        TRANSFORM:                  4,
        ADD_MODEL_INSTANCE:         5,
        REMOVE_MODEL_INSTANCE:      6,
        PING_MAIN_THREAD:           7,
        TEST_EVENT:                 8,
        STATS_UPDATE:               9,
        REQUEST_ASSET_INSTANCE:     10,
        UPDATE_CAMERA:              11,
        UPDATE_INSTANCE:            12,
        REGISTER_INSTANCE:          13,
        UPDATE_MODEL:               14,
        UPDATE_ANIMATIONS:          15,
        DEBUG_DRAW_LINE:            16,
        DETATCH:                    17,
        ATTACH_TO_JOINT:            18,
        ADVANCE_ENVIRONMENT:        19,
        DEBUG_DRAW_CROSS:           20,
        DEBUG_DRAW_AABOX:           21,
        DYNAMIC_JOINT:              22,
        TRACK_STAT:                 23,
        DATA_PIPELINE_READY:        24,
        BUILD_GUI_ELEMENT:          25,
        SCENARIO_ACTIVATE:          26,
        SCENARIO_CLOSE:             27,
        REQUEST_SCENARIO:           28,
        SET_CAMERA_TARGET:          29,
        EQUIP_ITEM:                 30,
        UNEQUIP_ITEM:               31,
        DROP_ITEM:                  32,
        STASH_ITEM:                 33,
        TAKE_STASH_ITEM:            34,
        TAKE_WORLD_ITEM:            35,
        SET_PLAYER_STATE:           36,
        SCENARIO_UPDATE:            37,
        DEBUG_VIEW_TOGGLE:          38,
        DEBUG_VIEW_MODELS:          39,
        DEBUG_TEXT:                 40,
        TOGGLE_GUI_PAGE:            41,
        DEBUG_STATS_POOLS:          42,
        MAIN_CHAR_STATE_EVENT:      43,
        MAIN_CHAR_STATUS_EVENT:     44,
        MAIN_CHAR_REGISTER_HOSTILE: 45,
        MAIN_CHAR_SELECT_TARGET:    46,
        MAIN_CHAR_ENGAGE_TARGET:    47,
        MAIN_CHAR_RETURN_HOME:       48,
        SCENARIO_TEXT:              49,
        SCENARIO_HEADER:            50,
        SWITCH_BACK_GUI_PAGE:       51,
        TOGGLE_AUTO_TURN_PAUSE:     52,
        CHEAT_APPLY_PIMP:           53,
        MAIN_CHAR_OPEN_TARGET:      54,
        SWITCH_GUI_PAGE:             55,
        SET_COMPANION_AS_LEADER:     57
    };

    ENUMS.Args = {
        WAKE_INDEX:             0,
        POINTER:                1,
        SET_LOOP:               2,
        NOTIFY_FRAME:           3,
        SET_INPUT_BUFFER:       4,
        SET_WORLD_COM_BUFFER:   5,
        CREATE_WORLD:           6,
        REGISTER_TERRAIN:       7,
        FETCH_PIPELINE_DATA:    8,
        SEND_PIPELINE_DATA:     9,
        GENERATE_STATIC_AREA:   10,
        STATIC_AREA_DATA:       11,
        REQUEST_SHARED_WORKER:  12,
        SHARED_WORKER_PORT:     13,
        PHYSICS_TERRAIN_ADD:    14,
        PHYSICS_BODY_ADD:       15,
        PHYSICS_CALL_UPDATE:    16,
        FETCH_GEOMETRY_BUFFER:  17,
        SET_GEOMETRY_BUFFER:    18,
        REGISTER_GEOMETRY:      19,
        XXX:                    20,
        SET_CONFIG_DATA:        21,
        CANVAS_DYNAMIC_ADD:     22,
        CANVAS_CALL_UPDATE:     23,
        REGISTER_CANVAS_BUFFER: 24,
        OFFSCREEN_CANVAS:       25,
        WRITE_FRAME:            26,
        READ_FRAME:             27,
        FRAME:                  28,
        POS_X:                  29,
        POS_Y:                  30,
        POS_Z:                  31,
        QUAT_X:                 32,
        QUAT_Y:                 33,
        QUAT_Z:                 34,
        QUAT_W:                 35,
        SCALE_X:                36,
        SCALE_Y:                37,
        SCALE_Z:                38,
        TIME:                   39,
        STATE_INIT:             40,
        STATE_LOADING:          41,
        STATE_LOADED:           42,
        STATE_ACTIVE:           43,
        STATE_DEACTIVATED:      44,
        STATE_REMOVE:           45,
        STATE_CLEANUP:          46,

        VEC_X:                  47,
        VEC_Y:                  48,
        VEC_Z:                  49,

        STAT_TPF:               50,
        STAT_IDLE:              51,
        STAT_TIME_GAME:         52,
        STAT_TIME_RENDER:       53,
        STAT_FILE_CACHE:        54,
        STAT_EVENT_LISTENERS:   55,
        STAT_EVENT_TYPES:       56,
        STAT_LISTENERS_ONCE:    57,
        STAT_FIRED_EVENTS:      58,
        STAT_FRAME_RENDER_TIME: 59,

        STAT_WAKE_INDEX:        60,
        STAT_MEM_JS_HEAP:       61,
        STAT_MEM_JS_MB:         62,
        STAT_SHADERS:           63,
        STAT_SCN_NODES:         64,
        STAT_MESH_POOL:         65,
        STAT_DRAW_CALLS:        66,
        STAT_VERTICES:          67,
        STAT_GEOMETRIES:        68,
        STAT_TEXTURES:          69,

        CAM_FOV:                70,
        CAM_NEAR:               71,
        CAM_FAR:                72,
        CAM_ASPECT:             73,
        INSTANCE_POINTER:       74

    };


    ENUMS.Animations = {
        IDLE:              0,
        WALK:              1,
        WALK_BODY:         2,
        WALK_COMBAT:       3,
        RUN:               4,
        __:                5,
        ATTACK_1:          6,
        ATTACK_2:          7,
        DEAD:              8,
        FALL:              9,
        IDL_LO_CB:         10,
        IDL_HI_CB:         11,
        SET_LFT_FF:        12,
        GD_LFT_FF:         13,
        SET_RT_FF:         14,
        GD_RT_FF:          15,
        GD_HI_R:           16,
        GD_MID_R:          17,
        GD_LOW_R:          18,
        GD_LNG_R:          19,
        GD_SHT_R:          20,
        GD_BCK_R:          21,
        GD_HNG_R:          22,
        GD_INS_R:          23,
        GD_SID_R:          24,
        SW_BCK_R:          25,
        SW_SID_R:          26,
        CT_TC_R:           27,
        CT_TR_R:           28,
        CT_MR_R:           29,
        CT_ML_R:           30,
        SLEEP:             31,
        DANCE_1:           32,
        DANCE_2:           33,
        DANCE_3:           34,
        DANCE_4:           35,
        BK_SWING:          36,
        HI_SWING:          37,
        JMP_SWING:         38,
        POSE_X:            39,
        POSE_GD:           40,
        POSE_HI:           41,
        POSE_PULD:         42,
        POSE_WODE:         43,
        MLE_PREP:          44,
        MLE_SLSH_HI:       45,
        MLE_SLS_LO:        46,
        PSTL_RECL:         47,
        PSHD_BK:           48,
        RIFL_AIM:          49,
        RIFL_FIRE:         50,
        MLE_RIF_PREP:      51,
        MLE_RIF_RDY:       52,
        MLE_RIF_STRK:      53,
        SIT:               54

    };

    ENUMS.ActionTypes = {
        ATTACK_GREATSWORD:  0,
        ATTACK_SWORD:       1

    };

    ENUMS.Joints = {
        SKIN:               0,
        PROP_1:             1,
        PROP_2:             2,
        PROP_3:             3,
        HEAD:               4,
        PELVIS:             5,
        HAND_L:             6,
        HAND_R:             7,
        GRIP_L:             8,
        GRIP_R:             9,
        FOOT_L:             10,
        FOOT_R:             11,
        SKIN_SCALED:        12
    };

    ENUMS.BufferType = {
        ENVIRONMENT:        0,
        CAMERA:             1,
        SPATIAL:            2,
        TERRAIN:            3,
        EVENT_DATA:         4,
        POSITION:           5,
        NORMAL:             6,
        UV:                 7,
        INDEX:              8,
        INPUT_BUFFER:       9
    };

    ENUMS.Transform = {

    };

    ENUMS.InstanceState = {
        INITIATING:         0,
        ACTIVE_HIDDEN:      1,
        ACTIVE_VISIBLE:     2,
        INACTIVE_VISIBLE:   3,
        INACTIVE_HIDDEN:    4,
        DECOMISSION:        5
    };

    ENUMS.IndexState = {
        INDEX_BOOKED:       0,
        INDEX_RELEASING:    1,
        INDEX_FRAME_CLEANUP:2,
        INDEX_AVAILABLE:    3
    };

    ENUMS.DynamicBone = {
        BONE_INDEX:         0,
        HAS_UPDATE:         1,
        POS_X:              2,
        POS_Y:              3,
        POS_Z:              4,
        QUAT_X:             5,
        QUAT_Y:             6,
        QUAT_Z:             7,
        QUAT_W:             8,
        QUAT_UDATE:         9,
        SCALE_X:            10,
        SCALE_Y:            11,
        SCALE_Z:            12,
        SCALE_UDATE:        13,
        POS_UDATE:          14,
        STRIDE:             15
    };


    ENUMS.Worker = {
        RENDER:             0,
        MAIN_WORKER:        1,
        STATIC_WORLD:       2,
        PHYSICS_WORLD:      3,
        DATA:               4,
        JSON_PIPE:          5,
        IMAGE_PIPE:         6
    };

    ENUMS.PointerStates = {

        DISABLED:       0,
        ENABLED:        1,
        HOVER:          2,
        PRESS_INIT:     3,
        PRESS:          4,
        PRESS_EXIT:     5,
        ACTIVATE:       6,
        ACTIVE:         7,
        ACTIVE_HOVER:   8,
        ACTIVE_PRESS:   9,
        DEACTIVATE:     10
    };

    ENUMS.TerrainFeature = {

        OCEAM:          0,
        SHORELINE:      1,
        STEEP_SLOPE:    2,
        SLOPE:          3,
        FLAT_GROUND:    4,
        WOODS:          5,
        AREA_SECTION:   6,
        SHALLOW_WATER:  7,
        DEEP_WATER:     8

    };

    ENUMS.InputState = {

        MOUSE_X:          0,
        MOUSE_Y:          1,
        WHEEL_DELTA:      2,
        START_DRAG_X:     3,
        START_DRAG_Y:     4,
        DRAG_DISTANCE_X:  5,
        DRAG_DISTANCE_Y:  6,
        ACTION_0:         7,
        ACTION_1:         8,
        LAST_ACTION_0:    9,
        LAST_ACTION_1:    10,
        PRESS_FRAMES:     11,
        VIEW_LEFT:        12,
        VIEW_WIDTH:       13,
        VIEW_TOP:         14,
        VIEW_HEIGHT:      15,
        ASPECT:           16,
        FRUSTUM_FACTOR:   17,
        HAS_UPDATE:       18,
        BUFFER_SIZE:      20

    };

    ENUMS.ActionState = {
        UNAVAILABLE:      0,
        AVAILABLE:        1,
        ACTIVATING:       2,
        ACTIVE:           3,
        ON_COOLDOWN:      4,
        ENABLED:          5,
        DISABLED:         6
    };

    ENUMS.AttackType = {
        NONE:              0,
        FAST:              1,
        HEAVY:             2
    }

    ENUMS.CharacterState = {
        ALERT:             0,
        IDLE_HANDS:        1,
        ENGAGING:          2,
        COMBAT:            3,
        DISENGAGING:       4,
        DISENGAGED:        5,
        FALL_DOWN:         6,
        LIE_DEAD:          7
    };

    ENUMS.ElementState = {
        NONE:             0,
        HOVER:            1,
        PRESS:            2,
        ACTIVE:           3,
        ACTIVE_HOVER:     4,
        ACTIVE_PRESS:     5,
        DISABLED:         6
    };

    ENUMS.Environments = {
        PRE_DAWN:         1,
        DAWN:             2,
        MORNING:          3,
        SUNNY_DAY:        4,
        HIGH_NOON:        5,
        EVENING:          6,
        NIGHT:            7
    };

    ENUMS.ColorCurve = {

        lut_vdk:       108,
        lut_dk:        107,
        lut_base:      106,
        lut_brt:       105,
        whiteToGrey:   104,
        greyToWhite:   103,
        cyan_1:        102,
        cyan_2:        101,
        cyan_3:        100,
        cyan_4:         99,
        cyan_5:         98,
        yellow_1:       97,
        yellow_2:       96,
        yellow_3:       95,
        yellow_4:       94,
        yellow_5:       93,
        purple_1:       92,
        purple_2:       91,
        purple_3:       90,
        purple_4:       89,
        purple_5:       88,
        orange_1:       87,
        orange_2:       86,
        orange_3:       85,
        orange_4:       84,
        orange_5:       83,
        blue_1:         82,
        blue_2:         81,
        blue_3:         80,
        blue_4:         79,
        blue_5:         88,
        green_1:        77,
        green_2:        76,
        green_3:        75,
        green_4:        74,
        green_5:        73,
        red_1:          72,
        red_2:          71,
        red_3:          70,
        red_4:          69,
        red_5:          68,
        alpha_20:       67,
        alpha_40:       66,
        alpha_60:       65,
        alpha_80:       64,

        flatCyan    :   63,
        brightCyan  :   62,
        threatSixe  :   61,
        threatFive  :   60,
        threatFour  :   59,
        threatThree :   58,
        threatTwo   :   57,
        threatOne   :   56,
        threatZero  :   55,
        steadyOrange:   54,
        darkPurple:     53,
        darkBlue:       52,
        darkRed:        51,
        steadyPurple:   50,
        steadyBlue:     49,
        steadyRed:      48,
        dust:           47,
        earlyFadeOut:   46,
        lateFadeOut:    45,
        flashGrey:      44,
        brightYellow:   43,
        fullWhite:      42,
        greenToPurple:  41,
        blueYellowRed:  40,
        redToYellow:    39,
        qubeIn:         38,
        rootIn:         37,
        randomGreen:    36,
        randomRed:      35,
        randomYellow:   34,
        randomBlue:     33,
        rainbow:        32,
        warmToCold:     31,
        hotFire:        30,
        fire:           29,
        warmFire:       28,
        hotToCool:      27,
        orangeFire:     26,
        smoke:          25,
        dirt:           24,
        brightMix:      23,
        nearWhite:      22,
        darkSmoke:      21,
        nearBlack:      20,
        doubleSin:      19,
        halfSin:        18,
        sin:            17,
        sublteSin:      16,
        pulseSlowOut:   15,
        slowFadeIn:     14,
        halfQuickIn:    13,
        halfFadeIn:     12,
        smooth:         11,
        slowFadeOut:    10,
        dampen:         9,
        noiseFadeOut:   8,
        quickFadeOut:   7,
        quickIn:        6,
        quickInSlowOut: 5,
        zeroOneZero:    4,
        oneZeroOne:     3,
        zeroToOne:      2,
        oneToZero:      1
    };

    ENUMS.Color = {
        WHITE    :    0,
        GREY     :    1,
        PINK     :    2,
        RED      :    3,
        PURPLE   :    4,
        GREEN    :    5,
        PEA      :    6,
        BLUE     :    7,
        AQUA     :    8,
        CYAN     :    9,
        MAGENTA  :    10,
        DARKPURP :    11,
        YELLOW   :    12,
        ORANGE   :    13,
        BLACK    :    14
    };


    ENUMS.TrackStats = {
        R_DYNAMIC :    0,
        RNDR     :    1,
        IDLE_R   :    2,
        R_HEAP   :    3,
        R_MEM    :    4,
        W_HEAP   :    5,
        W_MEM    :    6,
        PHYS_DT  :    7,
        D_CALLS  :    8,
        TRIS     :    9,
        GEOMS    :    10,
        TX_COUNT :    11,
        SHADERS  :    12,
        GUI_DT   :    13,
        GAME_DT  :    14,
        IDLE_W   :    15,
        WORK_DT  :    16,
        LOAD_W   :    17,
        W_EVT_MG :    18,
        EVT_LOAD :    19
    };

    ENUMS.Units = {
        NONE     :    0,
        s        :    1,
        ms       :    2,
        mb       :    3,
        "%"      :    4
    };


    ENUMS.Numbers = {
        event_buffer_size_per_worker:100000,
        POINTER_MOUSE:  0,
        POINTER_TOUCH0: 1,
        TOUCHES_COUNT:  10,
        INSTANCE_PTR_0: 10000,
        PTR_PING_OFFSET: 50000

    };

    //  console.log("ENUMS", ENUMS);

})(ENUMS);

const mapEnums = function() {
    const map = {};

    for (const key in ENUMS) {
        map[key] = [];

        for (const i in ENUMS[key]) {
            map[key][ENUMS[key][i]] = i;
        }
    }

    ENUMS.Map = map;

    ENUMS.getKey = function(category, index) {
        return ENUMS.Map[category][index];
    }
};

mapEnums();