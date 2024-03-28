import {Object3D} from "../../../libs/three/core/Object3D.js";
import {LocationModel} from "./LocationModel.js";
import {loadSavedConfig, parseConfigDataKey, saveWorldModelEdits} from "../../application/utils/ConfigUtils.js";
import {inheritConfigTransform} from "../../application/utils/ModelUtils.js";
import {Box3} from "../../../libs/three/math/Box3.js";
import {ENUMS} from "../../application/ENUMS.js";

function removeWorldModel(model) {
    //    console.log("Remove Model ", this.isVisible, this)
    model.removeLocationModels();
}

let index = 0;

let randomPaletteList = [
    'DEFAULT',
    'TOWN_RED',
    'TOWN_RED_2',
    'TOWN_GREEN',
    'TOWN_NEUTRAL',
    'TOWN_NEUTRAL_2',
    'TOWN_DARK',
    'TOWN_DARK_2',
    'TOWN_YELLOW'
]

class WorldModel {

    constructor(config) {

        index++;
        this.config = config;

        this.obj3d = new Object3D();
        this.box = new Box3();

        inheritConfigTransform(this.obj3d, this.config);
        MATH.decimalifyVec3(this.obj3d.position, 100);
        let worldLevel = GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)
        this.id = "wmdl_"+worldLevel+"_"+this.obj3d.position.x+"_"+this.obj3d.position.y+"_"+this.obj3d.position.z;

        if (config['palette']) {
            this.paletteKey = config['palette'];
        } else {
            this.paletteKey = randomPaletteList[Math.floor(randomPaletteList.length * MATH.sillyRandom(this.obj3d.position.x + this.obj3d.position.z + this.obj3d.position.y))];
        }

        this.locationModels = [];

        this.visibility = null;
        this.hidden = false;

        this.configData = null;

        let locationModels = function(data) {
            this.configData = data;        //    console.log("Reflow Location Models: ", this.locationModels.length)
            this.removeLocationModels();
            for (let i = 0; i < data.assets.length; i++) {
                let model = new LocationModel(this.obj3d, data.assets[i])
                if (config['no_lod'] === true) {
                    model.call.lodUpdated(0)
                } else {
                    if (model.lodLevel) {
                        ThreeAPI.registerTerrainLodUpdateCallback(model.getPos(), model.call.lodUpdated)
                        model.call.setPaletteKey(this.paletteKey);
                    }
                }

                this.locationModels.push(model)
            }
        }.bind(this)

        parseConfigDataKey("WORLD_LOCATIONS","LOCATION_MODELS", "model_data", config.model, locationModels)

        let updateObj3D = function() {
            MATH.rotObj3dToArray(this.obj3d, this.config.rot);
            MATH.vec3ToArray(this.obj3d.position, this.config.pos);
            this.applyObj3dUpdate()
        }.bind(this);

        let saveTimeout;


        let applyEditCursorUpdate = function(obj3d) {
            this.calcBounds(true);
            if (MATH.distanceBetween(obj3d.position, this.obj3d.position) < 0.1) {
                if (MATH.distanceBetween(obj3d.quaternion, this.obj3d.quaternion) < 0.01) {
                    return;
                } else {
                    console.log(this.id, obj3d.quaternion, this.obj3d.quaternion)
                }
            }
            MATH.decimalifyVec3(obj3d.position, 100);
            this.obj3d.copy(obj3d);
            updateObj3D()
            let wmodel = this;
            clearTimeout(saveTimeout)
            saveTimeout = setTimeout(function() {
                saveWorldModelEdits(wmodel);
            }, 200)

        }.bind(this);

        let setPaletteKey = function(key) {
            this.config.palette = key;
            this.paletteKey = key;
            for (let i = 0; i < this.locationModels.length; i++) {
                this.locationModels[i].call.setPaletteKey(this.paletteKey)
            }
        }.bind(this)

        let getPaletteKey = function() {
            for (let i = 0; i < this.locationModels.length; i++) {
                this.paletteKey = this.locationModels[i].call.getPaletteKey()
            }
            return this.paletteKey;
        }.bind(this)

        let applyLoadedConfig = function(cfg) {

            console.log("applyLoadedConfig", cfg)
            if (cfg !== null) {
                this.config = cfg;
                MATH.vec3FromArray(this.obj3d.position, cfg.pos);
                this.obj3d.quaternion.set(0, 0, 0, 1);
                MATH.rotXYZFromArray(this.obj3d, cfg.rot, 100);
                updateObj3D()
                if (cfg.palette) {
                    setPaletteKey(cfg.palette);
                }
            }

        }.bind(this)

        this.call = {
            setPaletteKey:setPaletteKey,
            getPaletteKey:getPaletteKey,
            removeWorldModel:removeWorldModel,
            applyEditCursorUpdate:applyEditCursorUpdate,
            locationModels:locationModels,
            applyLoadedConfig:applyLoadedConfig
        }

        console.log("loadSavedConfig", this.id)
        loadSavedConfig(this.id, this.call.applyLoadedConfig)

    }

    getPos() {
        return this.obj3d.position;
    }

    calcBounds(debugDraw) {
        this.box.min.copy(this.getPos());
        this.box.max.copy(this.getPos());
        for (let i = 0; i < this.locationModels.length; i++) {
            this.locationModels[i].hierarchyUpdated();
            this.locationModels[i].call.renderDebugAAB(debugDraw);
            MATH.fitBoxAround(this.box, this.locationModels[i].box.min, this.locationModels[i].box.max)
            this.locationModels[i].call.alignPhysicalModel()
        }
    }

    applyObj3dUpdate() {
        this.calcBounds(false);
    }

    setHidden(bool) {
        this.hidden = bool;
        for (let i = 0; i < this.locationModels.length; i++) {
            if (this.hidden === true) {
                this.locationModels[i].call.hideLocationModel(this.locationModels[i])
            } else {
                this.call.locationModels(this.configData)
            }

        }
    }

    removeLocationModels() {

        while (this.locationModels.length) {
            let model = this.locationModels.pop();
            model.removeLocationModel();
        }
    //    ThreeAPI.clearTerrainLodUpdateCallback(this.call.lodUpdated)

    }

}

export { WorldModel }