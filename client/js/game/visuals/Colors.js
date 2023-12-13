let colorMapFx = {}

colorMapFx['FRIENDLY']   = {r:0.01,  g:0.2,   b:0.01,  a:0.2};
colorMapFx['NEUTRAL']    = {r:0.2,   g:0.2,   b:0.02,   a:0.2};
colorMapFx['HOSTILE']    = {r:0.2,   g:0.01,  b:0.01,  a:0.2};
colorMapFx['ITEM']       = {r:0,     g:0.1,   b:0.15,   a:0.2};
colorMapFx['PATH_POINT'] = {r:0.1,     g:0.6,   b:0.9,   a:0.1};
colorMapFx['EXIT_TILE_ACTIVE'] = {r:0.03, g: 0.12,  b: 0.4, a:0.2};
colorMapFx['EXIT_TILE']  = {r:0.15,    g:0.10, b: 0.0,   a:0.1};
colorMapFx['LEAP_FX']    = {r:0.2,     g:0.6,   b:0.9,   a:0.4};
colorMapFx['WALK_FX']    = {r:0.1,     g:0.6,   b:0.2,   a:0.3};
colorMapFx['DEFAULT_FX'] = {r:0.4,     g:0.4,   b:0.0,   a:0.3};
colorMapFx['DAMAGE_FX']  = {r:0.99,    g:0.0,   b:0.0,   a:0.4};


let elementColorMap = {}
elementColorMap['FRIENDLY']   = {r:0.1,   g:1,     b:0.1,   a:0.8};
elementColorMap['NEUTRAL']    = {r:0.8,   g:0.8,   b:0.2,   a:0.8};
elementColorMap['HOSTILE']    = {r:1,     g:0.1,   b:0.1,   a:0.8};
elementColorMap['ITEM']       = {r:0.2,   g:0.5,   b:0.8,   a:0.8};
elementColorMap['PATH_POINT'] = {r:0.1,   g:0.6,   b:0.9,   a:0.8};
elementColorMap['STATUS_HINT']= {r:0.7,   g:0.7,   b:0.1,   a:1.0};
elementColorMap['UNAVAILABLE']= {r:0.3,   g:0.3,   b:0.4,   a:1.0};
elementColorMap['SELECTED']   = {r:0.2,   g:0.7,   b:0.8,   a:1.0};
elementColorMap['AVAILABLE']  = {r:0.5,   g:0.7,   b:0.6,   a:1.0};
elementColorMap['ACTIVATING'] = {r:0.7,   g:0.8,   b:0.4,   a:1.0};
elementColorMap['ACTIVE']     = {r:0.4,   g:0.9,   b:0.6,   a:1.0};
elementColorMap['ON_COOLDOWN']= {r:0.6,   g:0.4,   b:0.2,   a:1.0};
elementColorMap['ENABLED']    = {r:0.9,   g:0.9,   b:0.1,   a:1.0};
elementColorMap['DISABLED']   = {r:0.2,   g:0.2,   b:0.2,   a:1.0};


let frameFeedbackMap = {}
frameFeedbackMap['FRIENDLY']   = 'feedback_icon_button_friendly';
frameFeedbackMap['NEUTRAL']    = 'feedback_icon_button_neutral';
frameFeedbackMap['HOSTILE']    = 'feedback_icon_button_hostile';
frameFeedbackMap['ITEM']       = 'feedback_icon_button_item';
frameFeedbackMap['UNAVAILABLE']   = 'feedback_action_button_unavailable';
frameFeedbackMap['SELECTED']      = 'feedback_action_button_enabled';
frameFeedbackMap['AVAILABLE']     = 'feedback_action_button_available';
frameFeedbackMap['ACTIVATING']    = 'feedback_action_button_activating';
frameFeedbackMap['ACTIVE']        = 'feedback_action_button_active';
frameFeedbackMap['ON_COOLDOWN']   = 'feedback_action_button_cooldown';
frameFeedbackMap['ENABLED']       = 'feedback_action_button_enabled';
frameFeedbackMap['DISABLED']      = 'feedback_action_button_disabled';

let paletteMap = {};
paletteMap['DEFAULT'] = {}

export {
    colorMapFx,
    frameFeedbackMap,
    elementColorMap,
    paletteMap
}