let colorMapFx = {}

colorMapFx['FRIENDLY']   = {r:0.01,  g:0.2,   b:0.01,  a:0.2};
colorMapFx['NEUTRAL']    = {r:0.2,   g:0.2,   b:0.02,   a:0.2};
colorMapFx['HOSTILE']    = {r:0.2,   g:0.01,  b:0.01,  a:0.2};
colorMapFx['ITEM']       = {r:0,     g:0.1,   b:0.15,   a:0.2};
colorMapFx['PATH_POINT'] = {r:0.1,     g:0.6,   b:0.9,   a:0.1};
colorMapFx['LEAP_FX']    = {r:0.2,     g:0.6,   b:0.9,   a:0.4};
colorMapFx['WALK_FX']    = {r:0.1,     g:0.6,   b:0.2,   a:0.3};
colorMapFx['DEFAULT_FX'] = {r:0.4,     g:0.4,   b:0.0,   a:0.3};

let elementColorMap = {}
elementColorMap['FRIENDLY']   = {r:0.1,   g:1,     b:0.1,   a:0.8};
elementColorMap['NEUTRAL']    = {r:0.8,   g:0.8,   b:0.2,   a:0.8};
elementColorMap['HOSTILE']    = {r:1,     g:0.1,   b:0.1,   a:0.8};
elementColorMap['ITEM']       = {r:0.2,   g:0.5,   b:0.8,   a:0.8};
elementColorMap['PATH_POINT'] = {r:0.1,   g:0.6,   b:0.9,   a:0.8};
elementColorMap['STATUS_HINT']= {r:0.7,   g:0.7,   b:0.1,   a:1.0};

let frameFeedbackMap = {}
frameFeedbackMap['FRIENDLY']   = 'feedback_icon_button_friendly';
frameFeedbackMap['NEUTRAL']    = 'feedback_icon_button_neutral';
frameFeedbackMap['HOSTILE']    = 'feedback_icon_button_hostile';
frameFeedbackMap['ITEM']       = 'feedback_icon_button_item';

export {
    colorMapFx,
    frameFeedbackMap,
    elementColorMap
}