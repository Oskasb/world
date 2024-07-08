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
import {Vector3} from "../../../libs/three/math/Vector3.js";

function removeWorldModel(model) {
    //    console.log("Remove Model ", this.isVisible, this)
    model.removeLocationModels();
}

let index = 0;
let tempVec = new Vector3();

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
    //    console.log("New World Model", config, id)
        if (!config) {
            config = detachConfig(templateConfig);
        }

        if (config.edit_id) {
            id = config.edit_id;
        }
        index++;
        this.config = config;
        let originalModel = this.config.model;
        this.obj3d = new Object3D();
        this.box = new Box3();

        inheritConfigTransform(this.obj3d, this.config);
        MATH.decimalifyVec3(this.obj3d.position, 100);


        let lodActive = false;
        let lastLodLevel = -1;
        let modelsLoaded = false;

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
            modelsLoaded = true;
            this.configData = data;        //    console.log("Reflow Location Models: ", this.locationModels.length)
            let assets = data.assets;

            let attachAssets = [];
            for (let i = 0; i < assets.length; i++) {
                attachAssets.push(assets[i]);
            }

            if (typeof (this.config.assets) === 'object') {
                for (let i = 0; i < this.config.assets.length; i++) {
                    attachAssets.push(this.config.assets[i]);
                }
            }

            if (this.locationModels.length !== 0) {
                this.removeLocationModels();
            }

            for (let i = 0; i < attachAssets.length; i++) {
                let model = new LocationModel(this.obj3d, attachAssets[i])
                model.worldModel = this;
                if (config['no_lod'] === true) {
                    model.call.lodUpdated(0)
                } else {
                    if (model.lodLevel) {
                        if (!model.config.paletteKey) {
                            model.call.setPaletteKey(this.paletteKey);
                        } else {
                            model.call.setPaletteKey(model.config.paletteKey);
                        }
                    }
                }

                this.locationModels.push(model)
            }
        }.bind(this)

        if (config.model) {
            parseConfigDataKey("WORLD_LOCATIONS","LOCATION_MODELS", "model_data", config.model, locationModels)
        }


        let lodActivate = function() {
            if (lodActive === false) {
                lodActive = true;
                ThreeAPI.registerPrerenderCallback(wModelCameraAABBTest)
            }
        }.bind(this)

        let lodDeactivate = function() {
            if (lodActive === true) {
                ThreeAPI.unregisterPrerenderCallback(wModelCameraAABBTest)
                lodActive = false;
            }
        }.bind(this)

        let removeModels = function() {
            this.removeLocationModels()
            modelsLoaded = false;
        }.bind(this);

        let boundsInitiated = false;

        let wModelCameraAABBTest = function() {

            if (boundsInitiated === false) {
                initBounds(this.config)
                boundsInitiated = true;
            }

            if (MATH.valueIsBetween(lastLodLevel, 0, 1)) {

            } else {
                let isVisible = ThreeAPI.testBoxIsVisible(this.box);
                if (isVisible === true) {
                    if (lastLodLevel > 3) {
                        removeModels()
                        lodDeactivate()
                    } else {
                        if (modelsLoaded === false) {
                            locationModels(this.configData);
                            setLocModelsLod(this.locationModels, 2);
                        }
                    }
                } else {
                    removeModels()
                    lodDeactivate()
                }
            }


        }.bind(this)

        function setLocModelsLod(locModels, lodLevel) {
            for (let i = 0; i < locModels.length; i++) {
                locModels[i].call.lodUpdated(lodLevel);
            }
        }



        let worldModelLodUpdate = function(lodLevel) {
            lastLodLevel = lodLevel;

            if (lodLevel === -2) {
                removeModels()
                lodDeactivate()
                setLocModelsLod(this.locationModels, lodLevel);
                return;
            }

            if (MATH.valueIsBetween(lodLevel, 0, 1)) {
                 lodDeactivate()
            //    lodActivate()
                    if (modelsLoaded === false) {
                        locationModels(this.configData);
                    }
                setLocModelsLod(this.locationModels, 0);
            } else if (MATH.valueIsBetween(lodLevel, 2, 3)) {
                    if (modelsLoaded === false) {
                        locationModels(this.configData);
                        setLocModelsLod(this.locationModels, 2);
                    }
                 lodDeactivate()
                //lodActivate()
            } else if (lodLevel > 3) {
                removeModels()
                lodDeactivate()
            } else {
                    if (modelsLoaded === true) {
                        lodActivate()
                    } else {
                        removeModels()
                        lodDeactivate()
                    }
            }

        }.bind(this)

        let updateObj3D = function() {
            ThreeAPI.clearTerrainLodUpdateCallback(worldModelLodUpdate)
            MATH.rotObj3dToArray(this.obj3d, this.config.rot, 1000);
            MATH.vec3ToArray(this.obj3d.position, this.config.pos, 100);
            MATH.vec3ToArray(this.obj3d.scale, this.config.scale, 1000);
            this.applyObj3dUpdate()
            ThreeAPI.registerTerrainLodUpdateCallback(this.obj3d.position, worldModelLodUpdate)
        }.bind(this);

        ThreeAPI.registerTerrainLodUpdateCallback(this.obj3d.position, worldModelLodUpdate)

        let hold = 1;
        let applyEditCursorUpdate = function(obj3d, grid) {
            hold += GameAPI.getFrame().tpf;
            this.calcBounds(true);
            this.config.grid = grid;
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


        let initBounds = function(cfg) {
            this.box.min.set(0, 0, 0);
            this.box.max.set(0, 0, 0);

            if (cfg.assets) {
                let assets = cfg.assets;
                for (let i = 0; i < assets.length; i++) {
                    if (!assets[i].pos) {

                    } else {
                        MATH.vec3FromArray(tempVec, assets[i].pos);
                        tempVec.applyQuaternion(this.obj3d.quaternion)
                        MATH.fitBoxAround(this.box, tempVec, tempVec)
                    }
                }
            }

            if (cfg.boxes) {
                let boxes = cfg.boxes;
                for (let i = 0; i < boxes.length; i++) {
                    MATH.vec3FromArray(tempVec, boxes[i].pos);
                    tempVec.applyQuaternion(this.obj3d.quaternion)
                    MATH.fitBoxAround(this.box, tempVec, tempVec)
                }
            }

            this.box.min.add(this.obj3d.position);
            this.box.max.add(this.obj3d.position);
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:this.box.min, max:this.box.max, color:'RED'})
        }.bind(this);

        let applyLoadedConfig = function(cfg, id, replace) {
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

                boundsInitiated = false;
                //    console.log("applyLoadedConfig", this.id, cfg.model, originalModel, this.config.model)

                if (cfg.model !== originalModel || replace === true) {
                    GameAPI.worldModels.removeWorldModel(this);
                    this.deleteWorldModel();
                    if (cfg.DELETED === true) {
                        GameAPI.worldModels.addConfigModel(cfg, cfg.edit_id);
                    }

                    return;
                }

                MATH.vec3FromArray(this.obj3d.position, cfg.pos);
                MATH.vec3FromArray(this.obj3d.scale, cfg.scale);
                this.obj3d.quaternion.set(0, 0, 0, 1);
                MATH.rotXYZFromArray(this.obj3d, cfg.rot, 100);
                this.config = cfg;
                updateObj3D()

                if (cfg.palette) {
                    setPaletteKey(cfg.palette);
                }
            }
            worldModelLodUpdate(-1);
        }.bind(this)

        this.call = {
            setPaletteKey:setPaletteKey,
            getPaletteKey:getPaletteKey,
            applyEditCursorUpdate:applyEditCursorUpdate,
            locationModels:locationModels,
            applyLoadedConfig:applyLoadedConfig,
            worldModelLodUpdate:worldModelLodUpdate
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
                console.log("World Model setHidden NYI")
            //    this.locationModels[i].call.hideLocationModel(this.locationModels[i])
            } else {
            //    this.call.locationModels(this.configData)
            }

        }
    }

    removeLocationModels() {
        while (this.locationModels.length) {
            let model = this.locationModels.pop();
            model.removeLocationModel();
        }
    }

    refreshLodState() {
        for (let i = 0; i < this.locationModels.length; i++) {
        //    console.log("Refresh Lod state here.. not solving the bandit keep problem yet")
        //    this.locationModels[i].call.lodUpdated(-2);
        }
    }

     deleteWorldModel() {
         this.call.worldModelLodUpdate(-2)
         this.removeLocationModels()
     //
         ThreeAPI.clearTerrainLodUpdateCallback(this.call.worldModelLodUpdate)
    //    this.setHidden(true)

        MATH.splice(GameAPI.worldModels.getActiveWorldModels(), this);
    }

}

export { WorldModel }