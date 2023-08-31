import {Object3D} from "../../../../../libs/three/core/Object3D.js";
import {Vector3} from "../../../../../libs/three/math/Vector3.js";

let tempObj = new Object3D();
let tempVec = new Vector3();
class Plant {
    constructor(poolKey, config, vertexColor, posVec, normVec, rotZ, size) {

        let instance = null;

        this.poolKey = poolKey;
        this.obj3d = new Object3D();
    //    tempVec.set(posX, 0, posZ);
   //     this.obj3d.scale.set(0.005, 0.015, 0.005)

        if (config.surface && posVec.y < 0) {
            posVec.y = 0;
            normVec.set(0, 1, 0)
        }

        this.normal = new THREE.Vector3(normVec.x, normVec.y, normVec.z);
   //     tempVec.y = ThreeAPI.terrainAt(tempVec, this.normal);
        this.rotZ = rotZ;
        this.obj3d.lookAt(this.normal);
        this.obj3d.rotateZ(rotZ);
        this.obj3d.position.copy(posVec);
        this.pos = this.obj3d.position;
        this.obj3d.scale.multiplyScalar(size);

        this.size = 2+Math.random()*3;

        this.vertexColor = vertexColor;
    //    ThreeAPI.groundAt(this.obj3d.position, this.vertexColor);
        this.sprite = {x:1, y:1, z:1, w:1};
        this.applyPlantConfig(config);

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

        this.size = MATH.randomBetween(config.size_min, config.size_max) || 5;

    //    this.colorRgba.r = MATH.randomBetween(this.config.color_min[0], this.config.color_max[0]) || 1;
    //    this.colorRgba.g = MATH.randomBetween(this.config.color_min[1], this.config.color_max[1]) || 1;
    //    this.colorRgba.b = MATH.randomBetween(this.config.color_min[2], this.config.color_max[2]) || 1;
    //    this.colorRgba.a = MATH.randomBetween(this.config.color_min[3], this.config.color_max[3]) || 1;
        this.sprite.x = config.sprite[0] || 0;
        this.sprite.y = config.sprite[1] || 7;
        this.sprite.z = config.sprite[2] || 1;
        this.sprite.w = config.sprite[3] || 1;



        if (config.asset_ids) {
            this.poolKey = MATH.getRandomArrayEntry(config.asset_ids)
        }



    };

    plantActivate = function() {

        if (this.isActive) {
            return;
        }

        this.isActive = true;

        let addPlant = function(instance) {

            ThreeAPI.getScene().remove(instance.spatial.obj3d)
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:this.obj3d.position, color:'YELLOW'});
            this.callbacks.setInstance(instance)
        //    console.log(instance.getGeometryInstance().instancingBuffers);
        //    this.applyPlantConfig(this.config);
            this.applyInstanceAttributes(instance);
            instance.spatial.stickToObj3D(this.obj3d);
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
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:this.obj3d.position, color:'RED'});
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
    //    instance.setSprite(this.sprite)
        instance.setAttributev4('sprite', this.sprite)
        instance.setAttributev4('vertexColor', this.vertexColor)
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