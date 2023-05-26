import {AreaFunctions} from "./AreaFunctions.js";
import * as TerrainFunctions from "./TerrainFunctions.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";

let tempVec1 = new Vector3();
let tempVec2 = new Vector3();
let tempObj3d = new Object3D();


        class TerrainArea {
            constructor(x, z) {

            this.x = x || 0;
            this.z = z || 0;

            this.areaFunctions = new AreaFunctions();
            this.areaFunctions.setTerrainArea(this);

            this.origin = new Vector3();
            this.extents = new Vector3();
            this.center = new Vector3();
            this.boundingBox = new THREE.Box3();

            GuiAPI.printDebugText("GENRATE TERRAIN");

            this.terrain = terrainFunctions.createTerrain();
            this.setTerrainOptions(this.terrain.options);
            this.buffers = terrainFunctions.getTerrainBuffers(this.terrain);
            this.terrain.array1d = this.buffers[4];
            GuiAPI.printDebugText("TERRAIN BUFFERS READY");

            let requestAssetMessage = [ENUMS.Message.TERRAIN_BUFFERS, {buffers:this.buffers, pos:[this.origin.x, this.origin.y, this.origin.z]}];

            MainWorldAPI.postToRender(requestAssetMessage)
d
        };

        setAmmoBody = function(body) {
            this.ammoBody = body;
        };

        configRead = function(dataKey) {

        };

        setTerrainOptions = function(options) {
            this.terrainOptions = options;

            this.size = this.terrainOptions.terrain_size;
            this.setTerrainPosXYZ(this.x - this.size / 2, this.terrainOptions.min_height, this.z - this.size / 2);
            this.setTerrainExtentsXYZ(this.size, this.terrainOptions.max_height - this.terrainOptions.min_height, this.size);

            this.boundingBox.min.copy(this.origin);
            this.boundingBox.max.addVectors(this.origin, this.extents);
            console.log(this)

        };

        setTerrainPosXYZ = function(x, y, z) {
            this.origin.x = x;
            this.origin.y = y;
            this.origin.z = z;
            this.updateCenter();
        };

        getTerrainVegetationSystemId = function() {
            return this.terrainOptions.vegetation_system;
        };

        getTerrain = function() {
            return this.terrain;
        };

        getOrigin = function() {
            return this.origin;
        };

        getExtents = function() {
            return this.extents;
        };

        getSizeX = function() {
            return this.extents.x - this.origin.x;
        };

        getSizeZ = function() {
            return this.extents.z - this.origin.z;
        };

        updateCenter = function() {
            this.center.copy(this.extents);
            this.center.multiplyScalar(0.5);
            this.center.addVectors(this.origin, this.center);
        };

        positionIsWithin = function(pos) {
            if (pos.x > this.origin.x && pos.x < this.extents.x + this.origin.x && pos.z > this.origin.z && pos.z < this.extents.z + this.origin.z) {
                return true
            }
        };

        getHeightAndNormalForPos = function(pos, norm) {
                return this.areaFunctions.getHeightAtPos(pos, norm);
        };

        setTerrainExtentsXYZ = function(x, y, z) {
            this.extents.x = x;
            this.extents.y = y;
            this.extents.z = z;
            this.updateCenter();
        };

        getRandomPointOnTerrain = function(posStore, normStore, minHeight, maxHeight, minNormalY) {

            posStore.copy(this.origin);
            posStore.x += Math.random()*this.extents.x;
            posStore.z += Math.random()*this.extents.z;
            posStore.y = this.getHeightAndNormalForPos(posStore, normStore);

            if (posStore.y < minHeight || posStore.y > maxHeight || normStore.y < minNormalY) {
                GuiAPI.printDebugText("POINT OUTSIDE BOUNTS "+Math.round(posStore.y));
                this.getRandomPointOnTerrain(posStore, normStore, minHeight, maxHeight);
            }

        };

        applyStaticTerrainData = function(msg) {

        };

        createAreaOfTerrain = function(posx, posz) {

        };

        generateTerrainSectons = function(density) {

        };

        updateTerrainArea = function(tpf) {

        };

    }

export {TerrainArea}
