import {PipelineObject } from "../../../application/load/PipelineObject.js";

let ThreeAPI;

let txUrl = "./client/assets/images/textures/tiles/";
let materialList = {};

let uniforms = {};
let samplingUniforms = false;

let color;
let rot;
let quat;

let tempVec = new THREE.Vector3();

let applyUniformEnvironmentColor = function (uniform, worldProperty) {
    color = ThreeAPI.readEnvironmentUniform(worldProperty, 'color');
    uniform.value.r = color.r;
    uniform.value.g = color.g;
    uniform.value.b = color.b;
};

let applyUniformEnvironmentRotation = function (uniform, worldProperty) {
    tempVec.set(0, 0, -1);
    quat = ThreeAPI.readEnvironmentUniform(worldProperty, 'quaternion');
    tempVec.applyQuaternion(quat);
    uniform.value.x = tempVec.x;
    uniform.value.y = tempVec.y;
    uniform.value.z = tempVec.z
};

let sampleEnvUniforms = function () {
    for (let key in materialList) {
        applyUniformEnvironmentColor(materialList[key].uniforms.ambientLightColor, 'ambient');
        applyUniformEnvironmentColor(materialList[key].uniforms.sunLightColor, 'sun');
        applyUniformEnvironmentRotation(materialList[key].uniforms.sunLightDirection, 'sun');
    }
};

class TerrainMaterial {
    constructor(tApi) {
        ThreeAPI = tApi;
    };

    addTerrainMaterial = function (id, textures, shader) {

        console.log("AddTerrainMAterial", id, textures, shader)

        uniforms[id] = {};


        loadShader(id, shader);
        this.setupMaterial(id);

        updateUniforms(id, THREE.UniformsLib['common']);
        updateUniforms(id, THREE.UniformsLib['fog']);


        let global_uniforms = {
            ambientLightColor: {value: {r: 1, g: 1, b: 1}},
            sunLightColor: {value: {r: 1, g: 1, b: 1}},
            sunLightDirection: {value: {x: 0.7, y: -0.3, z: 0.7}}
        };

        updateUniforms(id, global_uniforms);

        this.attachTextures(id, textures);

    };

    setupMaterial = function (id) {

        materialList[id] = new THREE.RawShaderMaterial({
            uniforms: uniforms[id],
            side: THREE.DoubleSide,
            depthTest: true,
            depthWrite: true,
            blending: THREE.NoBlending,
            transparent: false,
            fog: true,
            lights: false
        });
    };

    loadShader = function (id, shader) {

        let applyShaders = function (src, data) {
            materialList[id].vertexShader = data.vertex;
            materialList[id].fragmentShader = data.fragment;
            materialList[id].needsUpdate = true;
        };

        new PipelineObject("SHADERS", shader, applyShaders);
    };

    updateUniforms = function (id, newuniforms) {

        for (let key in newuniforms) {

            if (materialList[id].uniforms[key]) {
                materialList[id].uniforms[key].value = newuniforms[key].value
            } else {
                materialList[id].uniforms[key] = {};
                materialList[id].uniforms[key].value = newuniforms[key].value
            }
        }

        materialList[id].needsUpdate = true;
    };

    addTexture = function (id, txConf) {

        let trId = id;
        let texConf = txConf;

        uniforms[trId][texConf.uniform] = {};
        uniforms[trId][texConf.uniform + 'repeat'] = {};

        let applyTexture = function (src, data) {
            data.repeat.x = texConf.repeat[0];
            data.repeat.y = texConf.repeat[1];
            uniforms[trId][texConf.uniform].value = data;
            uniforms[trId][texConf.uniform].type = 't';

            uniforms[trId][texConf.uniform + 'repeat'].value = {x: texConf.repeat[0], y: texConf.repeat[1]};

            updateUniforms(trId, uniforms[trId]);

            data.needsUpdate = true;
            console.log("TX Attached")
        };

        console.log("TX ", id, txConf)

        new PipelineObject("THREE_TEXTURE", "terrain_" + txConf.file + "_" + txUrl + txConf.file + ".png", applyTexture);
    };

    attachTextures = function (id, textures) {
        for (let i = 0; i < textures.length; i++) {
            addTexture(id, textures[i])
        }
    };

    getMaterialById = function (id) {

        if (!samplingUniforms) {
            //    evt.on(evt.list().CLIENT_TICK, sampleEnvUniforms);
            samplingUniforms = true;
        }

        return materialList[id];
    };
}

export { TerrainMaterial }

