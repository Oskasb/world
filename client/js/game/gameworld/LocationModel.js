import {Object3D} from "../../../libs/three/core/Object3D.js";
import {inheritAsParent, inheritConfigTransform} from "../../3d/ModelUtils.js";
import {WorldBox} from "./WorldBox.js";
import {LodTest} from "../visuals/LodTest.js";
import {poolFetch, registerPool} from "../../application/utils/PoolUtils.js";

function showLocationModel(model) {

//    console.log("SHOW LocationModel", model);

    let addModelInstance = function(instance) {
        ThreeAPI.getScene().remove(instance.spatial.obj3d)
        instance.spatial.stickToObj3D(model.obj3d);
        model.instance = instance;
    }.bind(this)

    if (model.config.asset) {
        client.dynamicMain.requestAssetInstance(model.config.asset, addModelInstance)
    }

}


function hideLocationModel(model) {
//    console.log("Hide", model);
    if (!model.instance) {
//        console.log("No INstance", model)
    } else {
        model.instance.decommissionInstancedModel();
        model.instance = null;
    }
}

class LocationModel {
    constructor(parentObj3d, config) {
    //    console.log("LocationModel", config);
        this.obj3d = new Object3D();
        this.instance = null;
        this.config = config;
        this.lodLevel = config.visibility;
        this.boxes = [];
        this.isVisible = false;

        inheritAsParent(this.obj3d, parentObj3d);
        inheritConfigTransform(this.obj3d, this.config);


        if (config.boxes) {
            let boxes = config.boxes;

            this.clearLocationBoxes()

            for (let i = 0; i < boxes.length; i++) {
        //        console.log("Add box")
                let box = new WorldBox();
                box.activateBoxByConfig(boxes[i])
                box.attachToParent(parentObj3d);
                ThreeAPI.registerTerrainLodUpdateCallback(box.getPos(), box.call.lodUpdated)
                this.boxes.push(box);
            }
        }

        let lodText = new LodTest()

        let lodUpdated = function(lodLevel) {
            lodText.lodTestModel(this, lodLevel, config.visibility, showLocationModel, hideLocationModel)
        }.bind(this)

        this.call = {
            lodUpdated:lodUpdated,
            hideLocationModel:hideLocationModel
        }

    }

    getPos() {
        return this.obj3d.position;
    }


    clearLocationBoxes() {
        while (this.boxes.length) {
            let box = this.boxes.pop()
            ThreeAPI.clearTerrainLodUpdateCallback(box.call.lodUpdated)
            box.call.removeWorldBox(box);
        }
    }

}

export {LocationModel}