import {Object3D} from "../../../libs/three/core/Object3D.js";
import {inheritAsParent, inheritConfigTransform} from "../../application/utils/ModelUtils.js";
import {WorldBox} from "./WorldBox.js";
import {LodTest} from "../visuals/LodTest.js";
import {poolFetch, poolReturn, registerPool} from "../../application/utils/PoolUtils.js";
import {addPhysicsToModel, removePhysicalModel} from "../../application/utils/PhysicsUtils.js";

function showLocationModel(model) {

//    console.log("SHOW LocationModel", model);

    let addModelInstance = function(instance) {
        ThreeAPI.getScene().remove(instance.spatial.obj3d)
        instance.spatial.stickToObj3D(model.obj3d);
        model.instance = instance;
        model.instanceCallback(instance);
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
        this.solidity = config.solidity || 0.5;
        this.boxes = [];
        this.isVisible = false;

        let paletteKey = 'DEFAULT'
        this.palette = poolFetch('VisualModelPalette')
        this.palette.initPalette()
        this.bodyPointers = [];

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

        let physicalModel = null;

        MATH.emptyArray(this.bodyPointers);

        this.physicsUpdate = function(obj3d, bodyPointer) {
            if (this.bodyPointers.indexOf(bodyPointer) === -1) {
                console.log("update body pointer", bodyPointer)
                this.bodyPointers.push(bodyPointer);
            }

        //    console.log("update", obj3d.position.y)
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:obj3d.position, color:'GREEN'});

            if (this.instance) {
                this.instance.getSpatial().stickToObj3D(obj3d);
            }
        }.bind(this);

        let applySelectedPaletteKey = function() {
            this.palette.applyPaletteSelection(paletteKey, this.instance);
        }.bind(this);

        let setInstance = function(instance) {
            this.instance = instance;
            applySelectedPaletteKey();
            this.call.playerContact(false)
        }.bind(this);

        this.instanceCallback = function(instance) {
            this.call.setInstance(instance)
        }.bind(this);

        let model = this;

        let lodUpdated = function(lodLevel) {

            if (lodLevel === 0) {

                if (!physicalModel) {
                    if (this.instance === null) {
                        this.instanceCallback = function(instance) {

                            physicalModel = addPhysicsToModel(config.asset, this.obj3d, this.physicsUpdate);
                        //    console.log("Set model 1", model)
                            physicalModel.call.setModel(model)
                            this.call.setInstance(instance)
                        }.bind(this);
                    } else {

                        physicalModel = addPhysicsToModel(config.asset, this.obj3d, this.physicsUpdate);
                     //   console.log("Set model 2", model)
                        physicalModel.call.setModel(model)
                    }

                } else {
                //    console.log("Set model 3", model)
                    physicalModel.call.setModel(model)
                }

            } else {

                if (physicalModel) {
                    removePhysicalModel(physicalModel);
                    physicalModel = null;
                }
            }

            lodText.lodTestModel(this, lodLevel, config.visibility, showLocationModel, hideLocationModel)

        }.bind(this)

        let playerContact = function(bool) {
            if (bool) {
                this.palette.setSeeThroughSolidity(0.25)
            } else {
                this.palette.setSeeThroughSolidity(this.solidity)
            }
            if (this.instance) {
                this.palette.applyPaletteToInstance(this.instance)
            } else {
                console.log("palette expects instance")
            }
        }.bind(this);

        let viewObstructing = function(bool) {
        //    console.log("View Obstruct")
            if (bool) {
                this.palette.setSeeThroughSolidity(0.1)
            } else {
                this.palette.setSeeThroughSolidity(this.solidity)
            }
            if (this.instance) {
                this.palette.applyPaletteToInstance(this.instance)
            } else {
                console.log("palette expects instance")
            }
        }.bind(this);


        let setPaletteKey = function(key) {
            paletteKey = key;
            applySelectedPaletteKey();
        }.bind(this)


        this.call = {
            setInstance:setInstance,
            setPaletteKey:setPaletteKey,
            lodUpdated:lodUpdated,
            hideLocationModel:hideLocationModel,
            playerContact:playerContact,
            viewObstructing:viewObstructing
        }

    }

    getPos() {
        return this.obj3d.position;
    }



    clearLocationBoxes() {
        MATH.emptyArray(this.bodyPointers);
        while (this.boxes.length) {
            let box = this.boxes.pop()
            ThreeAPI.clearTerrainLodUpdateCallback(box.call.lodUpdated)
            box.call.lodUpdated(-1);
            box.call.removeWorldBox(box);
        }
    }

    removeLocationModel() {
        this.clearLocationBoxes();
        this.call.lodUpdated(-1);
        ThreeAPI.clearTerrainLodUpdateCallback(this.call.lodUpdated)
        hideLocationModel(this);
    }


}

export {LocationModel}