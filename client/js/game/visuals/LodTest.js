import {aaBoxTestVisibility, borrowBox} from "../../application/utils/ModelUtils.js";


function testLodVisibility(lodLevel, visibility) {
    if (lodLevel !== -1 && lodLevel < visibility+1) {
        return true;
    } else {
        return false
    }
}

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

        let levelVisible = testLodVisibility(lodLevel, visibility)

        if (levelVisible) {
            if (model.isVisible !== true) {
                showCallback(model)
                this.call.checkBoxTesting()
            }
            model.isVisible = true;
        } else {
            if (model.isVisible === true) {

                if (lodLevel > visibility) {
                    hideCallback(model);
                    model.isVisible = false;
                } else {
                    this.call.cameraTestVisibility(model, visibility, hideCallback)
                }
            }
        }
    }

}

export {LodTest}