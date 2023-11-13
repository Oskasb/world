import {aaBoxTestVisibility, borrowBox} from "../../3d/ModelUtils.js";

class LodTest {
    constructor() {

        let size;
        let position;
        let hideFunction;
        let locationModel;
        let isBoxTesting = false;

        let aaBoxTestLocationModel = function() {
            let isVisible = aaBoxTestVisibility(position, size, size, size)
            if (isVisible) {
            //    let borrowedBox = borrowBox();
            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:borrowedBox.min, max:borrowedBox.max, color:'YELLOW'})

            } else {
                isBoxTesting = false;
                locationModel.isVisible = false;
                hideFunction(locationModel);
                ThreeAPI.unregisterPostrenderCallback(aaBoxTestLocationModel)
            }

        }.bind(this)

        let cameraTestVisibility = function(model, visibility, hideCallback) {
            size = visibility*2
            position = model.obj3d.position;
            hideFunction = hideCallback;
            locationModel = model;
            isBoxTesting = true;
            ThreeAPI.addPostrenderCallback(aaBoxTestLocationModel);
        }

        let checkBoxTesting = function() {
            if  (isBoxTesting) {
                ThreeAPI.unregisterPostrenderCallback(aaBoxTestLocationModel)
                isBoxTesting = false;
            }
        }

        this.call = {
            checkBoxTesting:checkBoxTesting,
            cameraTestVisibility:cameraTestVisibility
        }


    }




    lodTestModel(model, lodLevel, visibility, showCallback, hideCallback) {
        if (lodLevel !== -1 && lodLevel < visibility) {
            if (model.isVisible === false) {
                showCallback(model)
                this.call.checkBoxTesting()
            }
            model.isVisible = true;
        } else {
            if (model.isVisible === true) {
                if (lodLevel === -1) {
                    this.call.cameraTestVisibility(model, visibility, hideCallback)
                } else {
                    hideCallback(model);
                    model.isVisible = false;
                }

            }
        }
    }

}

export {LodTest}