import {Object3D} from "../../../libs/three/core/Object3D.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";

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



function setupBoxInstance(worldBox) {

    let iconSprites = GuiAPI.getUiSprites("box_tiles_8x8");
    let iconKey = 'rock_hard';

            let iconSprite = iconSprites[iconKey];

            let addSceneBox = function(instance) {
                instance.setActive(ENUMS.InstanceState.ACTIVE_VISIBLE);
                instance.spatial.stickToObj3D(worldBox.obj3d);
                instance.setSprite(iconSprite);
                ThreeAPI.getScene().remove(instance.spatial.obj3d)
            };

            client.dynamicMain.requestAssetInstance('asset_box', addSceneBox)

}

class WorldBox {
    constructor(config) {
        this.config = config;
        this.obj3d = new Object3D();
        MATH.vec3FromArray(this.obj3d.position, this.config.pos)

        if (config['on_ground']) {
            this.obj3d.position.y = ThreeAPI.terrainAt(this.obj3d.position);
        //    console.log("Stick to ground", this.obj3d.position.y)
        }

        MATH.vec3FromArray(this.obj3d.scale, this.config.scale)

        this.sizeXYZ = new Vector3();
        this.sizeXYZ.copy(this.obj3d.scale);
        this.sizeXYZ.multiplyScalar(50);
        this.sizeXYZ.x += 0.1;
        this.sizeXYZ.z += 0.1;
        this.size = this.sizeXYZ.length();

        this.obj3d.rotateX(this.config.rot[0]);
        this.obj3d.rotateY(this.config.rot[1]);
        this.obj3d.rotateZ(this.config.rot[2]);

        this.isVisible = false;


        let lodUpdated = function(lodLevel) {
            if (lodLevel !== -1 && lodLevel < config['visibility']) {
                this.showWorldModel()
                this.isVisible = true;
            } else {
                this.removeWorldModel()
                this.isVisible = false;
            }

        }.bind(this)

        this.call = {
            lodUpdated:lodUpdated
        }


        this.instance = null;
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

    showWorldModel() {
     //   console.log("Show Box ", this.isVisible, this)
        if (this.isVisible) {
            return;
        }

        let config = this.config;

        let iconSprites = GuiAPI.getUiSprites("box_tiles_8x8");
        let iconKey = config['sprite'] || "rock_hard";

        let iconSprite = iconSprites[iconKey];

        let addSceneBox = function(instance) {
            instance.setActive(ENUMS.InstanceState.ACTIVE_VISIBLE);
            instance.spatial.stickToObj3D(this.obj3d);
            instance.setSprite(iconSprite);
            ThreeAPI.getScene().remove(instance.spatial.obj3d)
            this.instance = instance;
        }.bind(this);

        client.dynamicMain.requestAssetInstance('asset_box', addSceneBox)

    }

    removeWorldModel() {
    //    console.log("Remove Model ", this.isVisible, this)
        if (!this.isVisible) {
            return;
        }
        this.instance.decommissionInstancedModel();
    }

}

export { WorldBox }