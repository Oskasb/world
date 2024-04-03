import {Object3D} from "../../../libs/three/core/Object3D.js";
import {LocationModel} from "./LocationModel.js";
import {
    detachConfig,
    loadSavedConfig,
    parseConfigDataKey,
    saveWorldModelEdits
} from "../../application/utils/ConfigUtils.js";
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

let templateConfig =                 {
    "model": false,
    "pos": [0, 0, 0],
    "rot": [0, 0, 0],
    "scale": [1, 1, 1],
    "on_ground": true,
    "visibility": 3,
    "palette": "DEFAULT"
}

class WorldModel {

    constructor(config, id) {

        if (!config) {
            config = detachConfig(templateConfig);
        }

        if (config.edit_id) {
            id = config.edit_id;
        }
        index++;
        this.config = config;

        this.obj3d = new Object3D();
        this.box = new Box3();

        inheritConfigTransform(this.obj3d, this.config);
        MATH.decimalifyVec3(this.obj3d.position, 100);


        if (id) {
            this.id = id;
        } else {
            this.id = this.generateModelId()
            this.config.edit_id = this.id;
        }

        if (config['palette']) {
            this.paletteKey = config['palette'];
        } else {
            this.paletteKey = randomPaletteList[Math.floor(randomPaletteList.length * MATH.sillyRandom(this.obj3d.position.x + this.obj3d.position.z + this.obj3d.position.y))];
        }

        this.locationModels = [];

        this.visibility = null;
        this.hidden = false;

        this.configData = {assets:[]};

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

        if (config.model) {
            parseConfigDataKey("WORLD_LOCATIONS","LOCATION_MODELS", "model_data", config.model, locationModels)
        }

        let updateObj3D = function() {
            MATH.rotObj3dToArray(this.obj3d, this.config.rot, 1000);
            MATH.vec3ToArray(this.obj3d.position, this.config.pos, 100);
            MATH.vec3ToArray(this.obj3d.scale, this.config.scale, 1000);
            this.applyObj3dUpdate()
        }.bind(this);

        let hold = 1;
        let applyEditCursorUpdate = function(obj3d) {
            hold += GameAPI.getFrame().tpf;
            this.calcBounds(true);

            //    if (Math.abs(obj3d.position.y - this.getPos().y) > 0.001) {
            this.config.on_ground = false;
            //    }

            if (MATH.distanceBetween(obj3d.position, this.obj3d.position) < 0.1) {

                if (MATH.distanceBetween(obj3d.quaternion, this.obj3d.quaternion) < 0.01) {
                    if (MATH.distanceBetween(obj3d.scale, this.obj3d.scale) < 0.0001) {
                        return;
                    }
                }
            }
            MATH.decimalifyVec3(obj3d.position, 100);
            this.obj3d.position.copy(obj3d.position)
            this.obj3d.quaternion.copy(obj3d.quaternion)
            this.obj3d.scale.copy(obj3d.scale)
//            this.obj3d.copy(obj3d);
            updateObj3D()

            if (hold > 0.5) {
                if (this.id !== "preview_model") {
                    let wmodel = this;
                    saveWorldModelEdits(wmodel);
                }
                hold = 0;
            }

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

        let originalModel = this.config.model;

        let applyLoadedConfig = function(cfg, id) {
            if (cfg !== null) {

                if (this.id) {
                    if (this.id !== cfg.edit_id) {
                        console.log("ID should match here... ")
                        this.id =  cfg.edit_id;
                    }
                } else {
                    console.log("Set WModel ID", id, cfg);
                    this.id =  cfg.edit_id;
                }

                console.log("applyLoadedConfig", this.id, cfg.model, originalModel, this.config.model)

                if (cfg.model !== originalModel) {
                    GameAPI.worldModels.removeWorldModel(this);
                    GameAPI.worldModels.addConfigModel(cfg, cfg.edit_id);
                    return;
                }

                MATH.vec3FromArray(this.obj3d.position, cfg.pos);
                MATH.vec3FromArray(this.obj3d.scale, cfg.scale);
                this.obj3d.quaternion.set(0, 0, 0, 1);
                MATH.rotXYZFromArray(this.obj3d, cfg.rot, 100);
                this.config = cfg;
                updateObj3D()
            //    this.setHidden(true);

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

        if (id !== "preview_model") {
        //    console.log("loadSavedConfig", this.id)
            loadSavedConfig(this.id, this.call.applyLoadedConfig)
        }


    }

    generateModelId() {
        let worldLevel = GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)
        MATH.decimalifyVec3(this.obj3d.position, 100);
        ThreeAPI.tempVec3.copy(this.obj3d.position);
        MATH.decimalifyVec3(ThreeAPI.tempVec3, 1); // File Server uses split('.') for file indexing
        return "wmdl_"+worldLevel+"_"+ThreeAPI.tempVec3.x+"_"+ThreeAPI.tempVec3.y+"_"+ThreeAPI.tempVec3.z;
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

    deleteWorldModel() {
        this.removeLocationModels()
        ThreeAPI.clearTerrainLodUpdateCallback(this.call.lodUpdated)
        MATH.splice(GameAPI.worldModels.getActiveWorldModels(), this);
    }

}

export { WorldModel }