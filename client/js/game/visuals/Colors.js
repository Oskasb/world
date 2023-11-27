let colorMapFx = {}

colorMapFx['FRIENDLY']   = {r:0.01,  g:0.2,   b:0.01,  a:0.2};
colorMapFx['NEUTRAL']    = {r:0.2,   g:0.2,   b:0.0,   a:0.2};
colorMapFx['HOSTILE']    = {r:0.2,   g:0.01,  b:0.01,  a:0.2};
colorMapFx['ITEM']       = {r:0,     g:0.1,   b:0.1,   a:0.2};

let frameFeedbackMap = {}
frameFeedbackMap['FRIENDLY']   = 'feedback_icon_button_friendly';
frameFeedbackMap['NEUTRAL']    = 'feedback_icon_button_neutral';
frameFeedbackMap['HOSTILE']    = 'feedback_icon_button_hostile';
frameFeedbackMap['ITEM']       = 'feedback_icon_button_item';

export {
    colorMapFx,
    frameFeedbackMap
}