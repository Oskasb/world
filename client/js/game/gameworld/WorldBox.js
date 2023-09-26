import {Object3D} from "../../../libs/three/core/Object3D.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import {inheritAsParent, inheritConfigTransform} from "../../3d/ModelUtils.js";
import {LodTest} from "../visuals/LodTest.js";
import {poolReturn} from "../../application/utils/PoolUtils.js";

let iconKeysAll = [
    "grass",
    "mud",
    "gravel",
    "sand_pink",
    "rock",
    "marsh",
    "rock_layers",
    "rock_purple",
    "rock_stripes",
    "rock_hard",
    "rock_rusty",
    "sand",
    "rock_grey",
    "rock_blue",
    "sand_cracked"
];


function setupBoxInstance(box) {

    let config = box.config;
    let iconSprites = GuiAPI.getUiSprites("box_tiles_8x8");
    let iconKey = config['sprite'] || "rock_hard";
    let iconSprite = iconSprites[iconKey];
    let addSceneBox = function(instance) {
        instance.setActive(ENUMS.InstanceState.ACTIVE_VISIBLE);
        instance.spatial.stickToObj3D(box.obj3d);
        instance.setSprite(iconSprite);
        ThreeAPI.getScene().remove(instance.spatial.obj3d)
        box.instance = instance;
    };
    client.dynamicMain.requestAssetInstance('asset_box', addSceneBox)

}


function removeWorldBox(box) {
    //    console.log("Remove Model ", this.isVisible, this)

    if (!box.isVisible) {
        console.log("Remove !isVisible.. ", box)
    //    return;
    }
    GameAPI.worldModels.unregisterWorldBox(box);
    if (!box.instance) {
        console.log("Remove !instance.. ", box)
        return;
    }
    box.instance.decommissionInstancedModel();
    box.instance = null;
}

function showWorldBox(box) {
    //   console.log("Show Box ", this.isVisible, this)
    if (box.isVisible) {
        console.log("Show isVisible.. ", box)
    //    return;
    }
    if (!box.instance) {
        setupBoxInstance(box);
    }

    GameAPI.worldModels.registerWorldBox(box);
}

class WorldBox {
    constructor() {
        this.obj3d = new Object3D();
    }

    activateBoxByConfig(config) {
        this.config = config;


        inheritConfigTransform(this.obj3d, config);

        this.sizeXYZ = new Vector3();
        this.sizeXYZ.copy(this.obj3d.scale);
        this.sizeXYZ.multiplyScalar(50);
        this.sizeXYZ.x += 0.1;
        this.sizeXYZ.z += 0.1;
        this.size = this.sizeXYZ.length();

        this.isVisible = false;

        let lodTest = new LodTest()

        let lodUpdated = function(lodLevel) {
            lodTest.lodTestModel(this, lodLevel, config.visibility, showWorldBox, removeWorldBox)
        }.bind(this)

        this.call = {
            lodUpdated:lodUpdated,
            removeWorldBox:removeWorldBox
        }

        this.instance = null;
    }

    attachToParent(obj3d) {
        inheritAsParent(this.obj3d, obj3d);
    }

    testIsNearPosition(vec3) {

        if (this.isVisible) {
            if (Math.abs(vec3.x - this.obj3d.position.x) < this.size) {
                if (Math.abs(vec3.z - this.obj3d.position.z) < this.size) {
                    return true
                }
            }
        }

    };

    testIntersectPosition(vec3, boxHeight) {

        if (boxHeight > this.obj3d.position.y + this.sizeXYZ.y) {

        } else if (Math.abs(vec3.x - this.obj3d.position.x) < this.sizeXYZ.x ) {
            if (Math.abs(vec3.z - this.obj3d.position.z) < this.sizeXYZ.z ) {
                boxHeight = this.obj3d.position.y + this.sizeXYZ.y
            }
        }

        return boxHeight
    }


    getPos() {
        return this.obj3d.position;
    }




}

export { WorldBox }