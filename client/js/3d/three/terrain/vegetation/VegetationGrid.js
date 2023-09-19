import {VegetationSector} from "./VegetationSector.js";
import {Vector3} from "../../../../../libs/three/math/Vector3.js";
import {Plant} from "./Plant.js";

let clears = [];
let tempVec1 = new Vector3();
let tempVec2 = new Vector3();
let centerSector;
let seed = 0;

let terrainCandidates = [];
let groundCandiates = [];

let processTerrainCandidates = function(configs, elevation, normalY) {
    MATH.emptyArray(terrainCandidates);
    for (let key in configs) {
        if (elevation > configs[key]['min_y']) {
            if  (elevation < configs[key]['max_y']) {
                if (configs[key]['normal_ymin'] > normalY) {
                    if  (configs[key]['normal_ymax'] < normalY) {
                        terrainCandidates.push(configs[key])
                    }
                }
            }
        }
    }
};

let processGroundCandidates = function(groundData) {
    MATH.emptyArray(groundCandiates);
    for (let i = 0; i < terrainCandidates.length; i++) {
        let candidate = terrainCandidates[i];
        let min = candidate['ground_min'];
        let max = candidate['ground_max'];

        if (MATH.valueIsBetween(groundData.y, min[1], max[1])) {
            if (MATH.valueIsBetween(groundData.z, min[2], max[2])) {
                groundCandiates.push(candidate)
            }
        }
    }
}

        class VegetationGrid {
            constructor(terrainArea, populateSector, depopulateSector, getPlantConfigs, plantsKey) {

            this.activeGridRange = 8;
            this.terrainArea = terrainArea;

                this.extMin = new THREE.Vector3();
                this.extMax = new THREE.Vector3();

                terrainArea.getExtentsMinMax(this.extMin, this.extMax);

                this.seed = this.extMin.x + this.extMin.z;

            this.plantsKey = plantsKey;

            this.lastUpdatedCenterPos = new THREE.Vector3();

            this.sectors = [];

            this.plants = [];

            this.populateCallbacks = [populateSector];
            this.depopulateCallbacks = [depopulateSector];

            this.centerSector = null;
            this.activeSectors = [];

            this.vegetationPatches = [];
            this.activePatches = [];

                let sectorActivate = function(sector, plantCount, parentPlant) {
                this.gridSectorActivate(sector, plantCount, parentPlant);
            }.bind(this);

                let sectorDeactivate = function(sector) {
                this.gridSectorDeactivate(sector);
            }.bind(this);

            this.callbacks = {
                sectorActivate:sectorActivate,
                sectorDeactivate:sectorDeactivate,
                getPlantConfigs:getPlantConfigs
            }
        };



        generateGridSectors(sectorPlants, gridRange, sectorsX, sectorsZ) {
            let plantConfigs = this.callbacks.getPlantConfigs('plants');
            if (!plantConfigs) {
                console.log("Premature grid setup", this)
                return;
            }
        //    console.log(plantConfigs);

            for (let i = 0; i < sectorPlants; i++) {

                seed = this.seed +i;
                let px = MATH.sillyRandomBetween(this.extMin.x, this.extMax.x, seed)
                let pz = MATH.sillyRandomBetween(this.extMin.z, this.extMax.z, seed+1)
                let rotZ = MATH.sillyRandom(seed+2)*6.5;
                tempVec1.set(px, 0, pz);
                tempVec1.y = ThreeAPI.terrainAt(tempVec1, tempVec2);

                processTerrainCandidates(plantConfigs, tempVec1.y, tempVec2.y)
                if (terrainCandidates.length) {
                    let vertexColor = {x:1, y:1, z:1, w: 1};
                    ThreeAPI.groundAt(tempVec1, vertexColor);
                    processGroundCandidates(vertexColor)

                    if (groundCandiates.length) {
                        let config = MATH.getRandomArrayEntry(groundCandiates);
                        let size = MATH.sillyRandomBetween(config['size_min'], config['size_max'], seed + 2);
                        let plant = new Plant("asset_vegQuad", config, vertexColor, tempVec1, tempVec2, rotZ, size);
                        plant.applyPlantConfig(config);
                        this.plants.push(plant)
                    }
                }

            }
            return;
            this.activeGridRange = gridRange;
            for (let i = 0; i < sectorsX; i++) {
                this.sectors[i] = [];
                for (let j = 0; j < sectorsZ; j++) {
                    let sector = new VegetationSector(sectorPlants, this.callbacks.sectorActivate, this.callbacks.sectorDeactivate, this.terrainArea, this.callbacks.getPlantConfigs, this.plantsKey)
                    sector.setupAsGridSector(i, j, sectorsX, sectorsZ);
                    this.sectors[i].push(sector)
                }
            }
        };



        gridSectorActivate(sector, plantCount) {
            MATH.callAll(this.populateCallbacks, sector, plantCount)
        };

        gridSectorDeactivate(sector) {
            MATH.callAll(this.depopulateCallbacks, sector)
        };

        addPatchToVegetationGrid(patchConfig, pos) {

            let config = this.callbacks.getPlantConfigs('patches')[patchConfig];
            console.log("PatchCfg:", config);

            let plantCount = Math.round(MATH.randomBetween(config.plants_min, config.plants_max));

            if (config['plants']) {
                let sector = new VegetationSector(plantCount, this.callbacks.sectorActivate, this.callbacks.sectorDeactivate, this.terrainArea, this.callbacks.getPlantConfigs, 'plants');
                sector.setupAsPatchSector(pos, config);
                sector.activateVegetationSector();
                this.vegetationPatches.push(sector);
            }

        };


        getSectorAtPosition(pos) {

            tempVec1.copy(pos);
            tempVec1.sub(this.terrainArea.getOrigin());

            let rows = this.sectors.length;
            let rowSize = this.terrainArea.getSizeX() / rows;
            let row = tempVec1.x / rowSize;
            tempVec1.x = Math.floor(row) ;

            let cols = this.sectors[tempVec1.x].length;
            let colSize = this.terrainArea.getSizeZ() / cols;
            let col = tempVec1.z / colSize;

            tempVec1.z = Math.floor(col );

            return this.sectors[tempVec1.x][tempVec1.z];
        };



        activateNeighboringSectors(centerSector) {

            let range = Math.ceil((this.activeGridRange / this.sectors.length) * centerSector.sectorSizeX) ;
            let row;
            let col;
            let sector;

            while (this.activeSectors.length) {
                clears.push(this.activeSectors.pop());
            }

            for (let i = -range; i < range; i++) {
                row = centerSector.gridX + i;
                if (this.sectors[row]) {

                    for (let j = -range; j < range; j++) {

                        col = centerSector.gridZ + j;
                        sector = this.sectors[row][col];

                        if (sector) {
                            if (!sector.getIsActive()) {
                                sector.activateVegetationSector();
                            }
                            if (clears.indexOf(sector) !== -1) {
                                MATH.splice(clears, sector);
                            }
                            this.activeSectors.push(sector);
                        }
                    }
                }
            }

            while (clears.length) {
                clears.pop().deactivateVegetationSector();
            }

        };


        centerSectorChanged(sector) {

            if (this.centerSector) {
                this.centerSector.setIsCenterSector(false)
            }

            sector.setIsCenterSector(true);
            this.centerSector = sector;
            this.activateNeighboringSectors(sector);
        };



        calcDistanceFromCenter(sector, centerPos) {

            tempVec1.copy(centerPos);
            tempVec1.y = sector.center.y;

            let dst = Math.max(tempVec1.distanceTo(sector.center), 0);
            dst = (dst / this.activeGridRange);
        //    console.log(dx, dz);
            return MATH.clamp(MATH.curveSigmoid(1.2 - MATH.curveSqrt(dst*2.5), 0, 1))//+dz

        };

        updateGridProximity(centerPos) {

            for (let i = 0; i < this.activeSectors.length; i++) {
                let distance = this.calcDistanceFromCenter(this.activeSectors[i], centerPos);
                this.activeSectors[i].updateProximityStatus(distance);
            }


            for (let i = 0; i < this.vegetationPatches.length; i++) {

            //    if (Math.random() < 0.1) {
                    let distance = this.calcDistanceFromCenter(this.vegetationPatches[i], centerPos);
                    this.vegetationPatches[i].updateProximityStatus(distance);
            //    }
            }
        };

        updateCenterSectorAtPosition() {

            let centerPos = GameAPI.getGameCamera().call.getLookAtPoint()

            if (this.lastUpdatedCenterPos.distanceToSquared(centerPos) < 1) {
                return;
            }

            this.lastUpdatedCenterPos.copy(centerPos);

            centerSector = this.getSectorAtPosition(centerPos);

            if (centerSector) {

                if (!centerSector.getIsCenterSector()) {
                    this.centerSectorChanged(centerSector);
                }

                this.updateGridProximity(centerPos);
            }
        };

        updateVegetationGrid() {
            this.updateCenterSectorAtPosition();
        };

        showGridPlants() {
            for (let i = 0; i < this.plants.length; i++) {
                this.plants[i].plantActivate();
            }
        }

        hideGridPlants() {
            for (let i = 0; i < this.plants.length; i++) {
                this.plants[i].plantDeactivate();
            }
        }

        disposeGridSectors() {

            while (this.activeSectors.length) {
                this.activeSectors.pop().deactivateVegetationSector();
            }

            while (this.vegetationPatches.length) {
                this.vegetationPatches.pop().deactivateVegetationSector();
            }

            while (this.sectors.length) {
                this.sectors.pop();
            }
        };
    }

    export { VegetationGrid };