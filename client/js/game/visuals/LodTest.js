
class LodTest {
    constructor() {

    }

    lodTestModel(model, lodLevel, visibility, showCallback, hideCallback) {
        if (lodLevel !== -1 && lodLevel < visibility) {
            showCallback(model)
            model.isVisible = true;
        } else {
            hideCallback(model)
            model.isVisible = false;
        }
    }

}

export {LodTest}