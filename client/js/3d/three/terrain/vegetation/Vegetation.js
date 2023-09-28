import {ExpandingPool} from "../../../../application/utils/ExpandingPool.js";
import {Instantiator} from "../../instancer/Instantiator.js";
import {Plant} from "./Plant.js";
import {ConfigData} from "../../../../application/utils/ConfigData.js";
import {VegetationLodGrid } from "./VegetationLodGrid.js";

let configDefault = {
    "sys_key": "VEG_8x8",
    "asset_id":  "asset_vegQuad",
    "pool_size": 6000,
    "render_order": 0
};

let config = {
    "lod_levels": [
        {
            "hide_tiles": true,
            "elevation" : 0.1,
            "tile_size" : 0.8,
            "tile_range" : 9,
            "tile_spacing" : 6,
            "max_plants":180,
            "plants":[
                "leafy_small",
                "flower_1_red",
                "flower_1_yellow",
                "flower_1_white",
                "bushes_1_small",
                "bushes_2_small",
                "grass_low_1_dead",
                "grass_tall_sparse_1",
                "grass_tall_sparse_2",
                "grass_low_1_dry",
                "grass_low_2",
                "grass_low_1_flowery",
                "grass_low_3_flowery",
                "grass_low_4_green",
                "grass_low_5_dry",
                "grass_low_6_bright",
                "ferns_1",
                "reeds_1",
                "reeds_3"
            ]
        },
        {
            "hide_tiles": true,
            "elevation" : 0.1,
            "tile_size" : 0.8,
            "tile_range" : 9,
            "tile_spacing" : 18,
            "max_plants":140,
            "plants":[
                "leafy_small",
                "flower_1_red",
                "flower_1_white",
                "bushes_2_small",
                "bushes_1_small",
                "grass_low_1_dead",
                "grass_tall_sparse_1",
                "grass_tall_sparse_2",
                "grass_tall_2",
                "grass_low_1_dry",
                "bushes_1_small",
                "bushes_1_flowery_small",
                "ferns_1",
                "reeds_2",
                "reeds_3"
            ]
        },
        {
            "hide_tiles": true,
            "elevation" : 0.1,
            "tile_size" : 0.9,
            "tile_range" : 9,
            "tile_spacing" : 50,
            "max_plants":120,
            "plants":[
                "leafy_big",
                "bushes_1",
                "bushes_1_flowery",
                "reeds_1",
                "reeds_2"
            ]
        }
    ]
}

let count = 0;

class Vegetation {
    constructor() {

        count++;

        this.init = 0;
        this.areaGrids = [];
        this.config = {};
        this.plantConfigs = {};
        this.instanceAssetKeys = [];
        this.instantiator = new Instantiator();
        this.plantPools = {};

        this.vegetationLodGrids = [];

        let populateSector = function(sector, plantCount) {
            this.populateVegetationSector(sector, plantCount)
        }.bind(this);

        let depopulateSector = function(sector) {
            this.depopulateVegetationSector(sector)
        }.bind(this);

        let getPlantConfigs = function(key) {
            return this.plantConfigs[key]
        }.bind(this);

        this.callbacks = {
            populateSector:populateSector,
            depopulateSector:depopulateSector,
            getPlantConfigs:getPlantConfigs}
    };

    initVegetation(vegReadyCB) {
        let dataId = "plants_default"
        let vegGridData = new ConfigData('VEGETATION', 'GRID')
        let plantsData = new ConfigData('VEGETATION', 'PLANTS')

        let dataInit = 0;
        let plantInit = 0;

        let setupLodGrids = function(cfg, plantsConfig) {
            for (let i = 0; i < cfg['lod_levels'].length; i++) {
                let lodGrid =  new VegetationLodGrid()
                lodGrid.activateLodGrid(cfg['lod_levels'][i], plantsConfig)
                this.vegetationLodGrids[i] =lodGrid;
            }
        }.bind(this)

        let plantDataReady = function(data) {
            console.log("Plants data",this.init,  data[0].data);
            this.applyPlantConfig(data[0].data);
                setupLodGrids(config, data[0].data)
            if (plantInit === 0) {
                plantInit = 1;
                vegReadyCB()
            } else {
                this.resetVegetationSectors();
            }



        }.bind(this);




        let onDataReady = function(data) {
            console.log("Veg data",this.init, data[0].data);
            this.applyConfig(data[0].data);

            if (dataInit === 0) {
                dataInit = 1;
                this.setupInstantiator();
                plantsData.addUpdateCallback(plantDataReady)
            }
            this.resetVegetationSectors();
        }.bind(this);

        console.log("init Veg data", vegGridData);
        vegGridData.addUpdateCallback(onDataReady)
        vegGridData.fetchData('grid_default');

        plantsData.fetchData(dataId);

    };

    applyConfig(config) {

        for (let key in config) {
            this.config[key] = config[key];
        }

    };

    applyPlantConfig(config) {

        for (let key in config) {
            this.plantConfigs[key] = config[key];
        }

    };

    setupInstantiator() {

        let addPlant = function(poolKey, callback) {
            callback(poolKey, new Plant(poolKey, plantActivate, plantDectivate))
        };

        this.instantiator.addInstanceSystem(this.config.asset_id, this.config.sys_key, this.config.asset_id, this.config.pool_size, this.config.render_order);

        this.plantPools[this.config.asset_id] = new ExpandingPool(this.config.asset_id, addPlant);

        let plantActivate = function(plant) {
            this.activateVegetationPlant(plant)
        }.bind(this);

        let plantDectivate = function(plant) {
            this.deactivateVegetationPlant(plant)
        }.bind(this);

    };

    buildBufferElement(poolKey, cb) {
        this.instantiator.buildBufferElement(poolKey, cb)
    };


    createPlant(assetId, cb) {

        let getPlant = function(key, plant) {
            cb(plant);
        }.bind(this);

        this.plantPools[assetId].getFromExpandingPool(getPlant)

    };


    activateVegetationPlant(plant) {
        this.buildBufferElement(plant.poolKey, plant.getElementCallback())
    };

    deactivateVegetationPlant(plant) {
        this.instantiator.recoverBufferElement(plant.poolKey, plant.getPlantElement());
        plant.bufferElement = null;
    };

    populateVegetationSector(sector, plantCount) {
        //    "asset_vegQuad" gets replaced when instancing buffer is fetched.. redundant maybe...
        for (let i = 0; i < plantCount; i++) {
            this.createPlant("asset_vegQuad", sector.getAddPlantCallback());
        }
    };

    depopulateVegetationSector(sector) {
        sector.deactivateSectorPlants();
    };

    updateVegetation(lodCenter) {

        for (let i = 0; i < this.vegetationLodGrids.length; i++) {
            this.vegetationLodGrids[i].updateVegLodGrid(lodCenter)
        }

        this.instantiator.updateInstantiatorBuffers();
    };

    resetVegetationSectors = function() {

        let rebuild;

        while (this.areaGrids.length) {
            let areaGrid = this.areaGrids.pop();
            areaGrid.disposeGridSectors();
            if (areaGrid.terrainArea) {
                rebuild = areaGrid.terrainArea;
            }

        }

        if (rebuild) {
            this.instantiator.updateInstantiatorBuffers();
        }

    };

};

export {Vegetation}