
class LodTest {
    constructor() {

    }

    lodTestModel(model, lodLevel, visibility, showCallback, hideCallback) {
        if (lodLevel !== -1 && lodLevel < visibility) {
            if (model.isVisible === false) {
                showCallback(model)
            }
            model.isVisible = true;
        } else {
            if (model.isVisible === true) {
                hideCallback(model)
            }
            model.isVisible = false;
        }
    }

}

export {LodTest}