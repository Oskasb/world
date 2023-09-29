import {ExpandingPool} from "../../../../application/utils/ExpandingPool.js";
import {Instantiator} from "../../instancer/Instantiator.js";
import {Plant} from "./Plant.js";
import {ConfigData} from "../../../../application/utils/ConfigData.js";
import {VegetationLodGrid } from "./VegetationLodGrid.js";

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

        let setupLodGrids = function(cfg, plantsConfig) {
            while (this.vegetationLodGrids.length) {
                let grid = this.vegetationLodGrids.pop();
                grid.deactivateLodGrid()
            }

            for (let i = 0; i < cfg['lod_levels'].length; i++) {
                let lodGrid =  new VegetationLodGrid()
                lodGrid.activateLodGrid(cfg['lod_levels'][i], plantsConfig)
                this.vegetationLodGrids[i] =lodGrid;
            }
        }.bind(this)


        this.callbacks = {
            setupLodGrids:setupLodGrids,
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



        let plantDataReady = function(data) {
            console.log("Plants data",this.init,  data[0].data);
            this.applyPlantConfig(data[0].data);
            this.callbacks.setupLodGrids(this.config, this.plantConfigs)
            if (plantInit === 0) {
                plantInit = 1;
                vegReadyCB()
            } else {
                console.log("Reflow Vegetation Plants")
            }

        }.bind(this);


        let onDataReady = function(data) {
            console.log("Veg data",this.init, data[0].data);
            this.applyConfig(data[0].data);

            if (dataInit === 0) {
                dataInit = 1;
                this.setupInstantiator();
                plantsData.addUpdateCallback(plantDataReady)
            } else {
                console.log("Reflow Vegetation Grids")
                this.callbacks.setupLodGrids(this.config, this.plantConfigs)
            }

        }.bind(this);

        console.log("init Veg data", vegGridData);
        vegGridData.addUpdateCallback(onDataReady)
        vegGridData.fetchData('vegetation_grid');

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

    resetVegetationGrids = function() {
        this.callbacks.setupLodGrids(this.config, this.plantConfigs)
    };

};

export {Vegetation}