import {TerrainElement} from "./TerrainElement.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";

let calcVec = new Vector3()

class TerrainSectionInfo {
    constructor(terrainGeo, sectionInfoConfig) {
        this.terrainGeometry = terrainGeo;
        this.lodConfig = sectionInfoConfig['lod_levels'];
        this.lodLevels = [];
        this.minLodLevel = -1;
        this.minY = -MATH.bigSafeValue();
        this.maxY = MATH.bigSafeValue();
        this.minExtents = new THREE.Vector3();
        this.maxExtents = new THREE.Vector3();
    }

    setupLodLevelGrid(lodLevel, grid) {
        let groundElements = [];
        this.lodLevels[lodLevel] = groundElements;
        this.terrainGeometry.getExtentsMinMax(this.minExtents, this.maxExtents);
        this.minExtents.y = this.minY;
        this.maxExtents.y = this.maxY;
        let size = this.terrainGeometry.size;
        let xElems = grid[0]
        let yElems = grid[1]
        for (let i = 0; i < xElems; i++) {
            let xFrac = MATH.calcFraction(0, xElems, i);

            for (let j = 0; j < yElems; j++) {
                let yFrac = MATH.calcFraction(0, yElems, j);
                let seed = i+j+this.minExtents.x+this.minExtents.z
                calcVec.x = this.minExtents.x + xFrac*size + MATH.sillyRandom(seed)*xElems/size;
                calcVec.z = this.minExtents.z + yFrac*size + MATH.sillyRandom(seed+1)*yElems/size;
                let terrainElement = new TerrainElement(lodLevel);
                terrainElement.setTerrainElementPosition(calcVec);
                groundElements.push(terrainElement);
            }
        }
    }

    updateLodLevel(lodLevel) {
        this.lodLevels[lodLevel] = [];
        let lodLevelCfg = this.lodConfig[lodLevel]
        let lodGrid = lodLevelCfg['grid'];
        this.setupLodLevelGrid(lodLevel, lodGrid);
    }

    applyLodLevel(lodLevel, maxLodLevel) {
        if (lodLevel !== -1) {
            for (let i = lodLevel; i < maxLodLevel; i++) {
                if (!this.lodLevels[i]) {
                    this.updateLodLevel(i)
                }
            }
        }
    }

    getLodLevelGroundElements(lodLevel) {
        return this.lodLevels[lodLevel];
    }

}

export { TerrainSectionInfo }