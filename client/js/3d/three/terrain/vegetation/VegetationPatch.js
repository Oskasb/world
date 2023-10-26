import {Vector3} from "../../../../../libs/three/math/Vector3.js";
import {borrowBox, cubeTestVisibility} from "../../../ModelUtils.js";
import {poolFetch, poolReturn} from "../../../../application/utils/PoolUtils.js";

let index = 0;
let boxColor = {x:1, y:1, z:1}

let groundHeightData = [0, 0, 0, 0];

let tempVec = new Vector3(1, 1, 1)
let minExt = new Vector3();
let maxExt = new Vector3()
let tempPos = new Vector3(1, 1, 1)
let candidates = [];

function debugDrawPatch(patch) {
    let nearness = patch.nearness;
        tempVec.set(nearness, nearness, nearness)
    let borrowedBox = borrowBox();
    borrowedBox.min.copy(patch.position).sub(tempVec);
    borrowedBox.max.copy(patch.position).add(tempVec);
    boxColor.x = Math.sin(patch.index*1.1);
    boxColor.y = Math.cos(patch.index*0.4);
    boxColor.z = Math.cos(patch.index*1.5);
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:borrowedBox.min, max:borrowedBox.max, color:boxColor})
}




let terrainCandidates = [];
let groundCandiates = [];
let groundColor = {x:1, y:1, z:1, w: 1};

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

let processTerrainCandidates = function(plantsList, configs, pos, normalY) {
    MATH.emptyArray(terrainCandidates);
    let elevation = pos.y;
    for (let i = 0; i < plantsList.length; i++) {
        let key = plantsList[i];
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


    ThreeAPI.groundAt(pos, groundColor);
    processGroundCandidates(groundColor)

};

let determinePlantConfig = function(patch, plant, min, max, seed, retries) {
    retries++
    tempPos.x = MATH.sillyRandomBetween(min.x, max.x, seed+3);
    tempPos.z = MATH.sillyRandomBetween(min.z, max.z, seed+4);
    tempPos.y = ThreeAPI.terrainAt(tempPos, plant.normal, groundHeightData)
    processTerrainCandidates(patch.plantsList, patch.plantsConfig.plants, tempPos, plant.normal.y)

    let config = MATH.getSillyRandomArrayEntry(groundCandiates, seed)

    if (!config) {

        if (retries > 1) {


            return patch.plantsConfig.plants["rock_small"];
        }
        //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:tempPos, color:'BLACK'});
        return determinePlantConfig(patch, plant, min, max, seed+retries, retries)
    }
    return config;
}

function addPlantsToPatch(patch, plantCount) {
    let vegTile = patch.vegetationTile;
    vegTile.getExtents(minExt, maxExt);
    let plants = patch.plants;
    while (plants.length < plantCount) {
        let seed = plants.length
        let plant = poolFetch('Plant');
        let config = determinePlantConfig(patch, plant, minExt, maxExt, seed, 1)

        let rgba = MATH.sillyRandomBetweenColors(config['color_min'], config['color_max'], seed+1);

        let size = MATH.sillyRandomBetween(config['size_min'], config['size_max'], seed+2);

        let groundShade = 1 - groundHeightData[2]*1;
        rgba.r *=groundShade;
        rgba.g *=groundShade;
        rgba.b *=groundShade;

        MATH.rgbaToXYZW(rgba, plant.vertexColor)

        let rotZ = MATH.sillyRandom(seed+5) * MATH.TWO_PI;
        plant.plantActivate("asset_vegQuad", config, tempPos, rotZ, size, patch.nearness)
        plants.push(plant);
    }
}

function removePlantsFromPatch(patch, plantCount) {
    let plants = patch.plants;
    while (plants.length > plantCount) {
        let plant = plants.pop();
        plant.plantDeactivate()
        poolReturn(plant);
    }
}

class VegetationPatch {
    constructor() {
        this.index = index;
        index++
        this.updateFrame = 0;
        this.nearness = 0;
        this.plants = [];
        this.position = new Vector3();
        this.vegetationTile = null;
    }

    setVegTile(vegTile, plantsConfig,  plantsList, maxPlants) {
        this.vegetationTile = vegTile;
        this.maxPlants = maxPlants;
        this.plantsConfig = plantsConfig;
        this.plantsList = plantsList;
        this.position.copy(vegTile.getPos())

    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:this.position, color:'YELLOW', drawFrames:10});
    }

    processPatchVisibility() {
        if (!this.vegetationTile) {
            this.isVisible = false;
            return;
        }

        let wasVisible = this.isVisible;
        let dynamicGridTile = this.vegetationTile.dynamicGridTile;
        let pos = this.position
        let spacing = dynamicGridTile.spacing;

        this.isVisible = cubeTestVisibility(pos,  spacing)

        if (this.isVisible === -1) {
            let borrowedBox = borrowBox();
            borrowedBox.min.y = pos.y+0.2;
            borrowedBox.max.y = pos.y+0.4;
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:borrowedBox.min, max:borrowedBox.max, color:'YELLOW'})
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:pos, to:borrowedBox.min, color:'YELLOW'});
        }

        //    if (wasVisible !== this.isVisible) {
    //    updateCB(this, frame)
        //    }
    }

    processPatchNearness(maxDistance, lodCenter, updateCB, frame) {
        let pos = this.position
        tempVec.copy(lodCenter);
        tempVec.y = pos.y;
        let lodDistance = pos.distanceTo(tempVec)

        let tileSize = this.vegetationTile.dynamicGridTile.spacing
        let farness = MATH.calcFraction(0, maxDistance - tileSize*2, lodDistance * 2.0 -tileSize*2)
        this.nearness = MATH.clamp(MATH.curveSigmoid(2-farness*2), 0, 1);
    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:pos, color:'RED', drawFrames:6});
        this.vegetationTile.nearness = this.nearness;

    }

    applyGridVisibility(nearness) {

        let plantCount = Math.ceil(nearness*this.maxPlants);

            if (this.plants.length < plantCount) {
                addPlantsToPatch(this, plantCount)
            }

            if (this.plants.length > plantCount) {
                removePlantsFromPatch(this, plantCount)
            }

    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:this.position, color:'GREEN', drawFrames:2});
     //       debugDrawPatch(this);

    }

    clearVegPatch() {
        this.vegetationTile = null;
        removePlantsFromPatch(this, 0)
    }

    recoverVegetationPatch() {

        this.vegetationTile = null;
        this.clearVegPatch()
        poolReturn(this)
    }


}

export {VegetationPatch }