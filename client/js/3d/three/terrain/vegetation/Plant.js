import {Object3D} from "../../../../../libs/three/core/Object3D.js";
import {Vector3} from "../../../../../libs/three/math/Vector3.js";

let tempObj = new Object3D();
let tempVec = new Vector3();
class Plant {
    constructor(poolKey, posX, posZ) {

        let instance = null;

        this.poolKey = poolKey;
        this.obj3d = new Object3D();
        tempVec.set(posX, 0, posZ);
   //     this.obj3d.scale.set(0.005, 0.015, 0.005)
        this.normal = new THREE.Vector3(0, 1, 0);
        tempVec.y = ThreeAPI.terrainAt(tempVec, this.normal)
        this.obj3d.lookAt(this.normal);
        this.obj3d.position.copy(tempVec);
        this.pos = this.obj3d.position;

        this.size = 2+Math.random()*3;

        this.colorRgba = {r:1, g:1, b:1, a: 1};

        this.config = {
            "min_y": 0.0,
            "max_y": 9999,
            "normal_ymin": 1.985,
            "normal_ymax": 0.92,
            "size_min": 7,
            "size_max": 22,
            "color_min": [0.95, 0.95, 0.95, 1],
            "color_max": [1, 1, 1, 1],
            "sprite": [0, 0, 1, 1]
        };


        this.sprite = [0, 7];

        this.isActive = false;

        this.bufferElement;
        let elementReady = function(bufferElement) {
            this.setBufferElement(bufferElement);
        }.bind(this);

        let setInstance = function(modelInstance) {
            instance = modelInstance;
        }

        let getInstance = function() {
            return instance;
        }

        this.callbacks = {
            elementReady:elementReady,
            setInstance:setInstance,
            getInstance:getInstance
        }

    };

    getIsActive = function() {
        return this.isActive;
    };

    applyPlantConfig = function(config) {

        for (let key in config) {
            this.config[key] = config[key];
        }

        this.size = MATH.randomBetween(this.config.size_min, this.config.size_max) || 5;

        this.colorRgba.r = MATH.randomBetween(this.config.color_min[0], this.config.color_max[0]) || 1;
        this.colorRgba.g = MATH.randomBetween(this.config.color_min[1], this.config.color_max[1]) || 1;
        this.colorRgba.b = MATH.randomBetween(this.config.color_min[2], this.config.color_max[2]) || 1;
        this.colorRgba.a = MATH.randomBetween(this.config.color_min[3], this.config.color_max[3]) || 1;
        this.sprite[0] = this.config.sprite[0] || 0;
        this.sprite[1] = this.config.sprite[1] || 7;
        this.sprite[2] = this.config.sprite[2] || 1;
        this.sprite[3] = this.config.sprite[3] || 0;

        if (this.config.asset_ids) {
            this.poolKey = MATH.getRandomArrayEntry(this.config.asset_ids)
        }

        if (config.surface) {

            if (this.pos.y < 0) {
                this.pos.y = 0;
                this.normal.set(0, 1, 0)
            }

        }

    };

    plantActivate = function() {

        this.isActive = true;

        let addPlant = function(instance) {
            instance.spatial.stickToObj3D(this.obj3d);
            ThreeAPI.getScene().remove(instance.spatial.obj3d)
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:GameAPI.getMainCharPiece().getPos(), to:this.obj3d.position, color:'YELLOW'});
            this.callbacks.setInstance(instance)
            console.log(instance.getGeometryInstance().instancingBuffers);
            this.applyInstanceAttributes(instance);
        }.bind(this)

    //    this.poolKey = "asset_box";

        client.dynamicMain.requestAssetInstance(this.poolKey, addPlant)

   //     MATH.callAll(this.callbacks.activatePlant, this);
    };

    plantDeactivate = function() {
        if (this.isActive === false) return;
        this.isActive = false;
        this.callbacks.getInstance().decommissionInstancedModel();
        this.callbacks.setInstance(null);
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:GameAPI.getMainCharPiece().getPos(), to:this.obj3d.position, color:'RED'});
        //    this.bufferElement.endLifecycleNow();
        //    MATH.callAll(this.callbacks.deactivatePlant, this);
    };

    getElementCallback = function() {
        return this.callbacks.elementReady;
    };

    setPlantPosition = function(pos) {
        this.pos.copy(pos);
    };

    getPlantElement = function() {
        return this.bufferElement;
    };

    applyInstanceAttributes = function(instance) {
    //    this.bufferElement = bufferElement;
    /*
        this.bufferElement.setPositionVec3(this.pos);

        tempObj.lookAt(this.normal);
        tempObj.rotateZ(Math.random() * 10);

        this.bufferElement.setQuat(tempObj.quaternion);

        this.bufferElement.scaleUniform(this.size);
      */
        instance.setSprite(this.sprite)

/*
        this.bufferElement.setSprite(this.bufferElement.sprite);
        this.bufferElement.setColorRGBA(this.colorRgba);

        this.bufferElement.setAttackTime(1.0);
        this.bufferElement.setReleaseTime(1.0);
        this.bufferElement.startLifecycleNow();
*/
    };

}

export {Plant}