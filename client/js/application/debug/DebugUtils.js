function getAllSceneNodes() {
    let scene = ThreeAPI.getScene();
   return scene.children;
}

function createDebugButton(text, onActivate, testActive, parent, x, y) {
 //   console.log("Debug Button: ", text, onActivate, testActive, parent, x, y);
    let buttonReady = function(button) {
  //      console.log("DEbug Button Ready: ", button);
    }

    let opts = {
        widgetClass:'GuiSimpleButton',
        widgetCallback:buttonReady,
        configId: 'button_big_blue',
        onActivate: onActivate,
        testActive: testActive,
        interactive: true,
        text: text,
        offset_x: x,
        offset_y: y
    };

    if (typeof(parent) === 'string') {
        opts.anchor = parent;
    }
        if (typeof(parent) === 'object') {
                opts.container = parent;
            }

    evt.dispatch(ENUMS.Event.BUILD_GUI_ELEMENT, opts)

}


export {
    createDebugButton,
    getAllSceneNodes
}