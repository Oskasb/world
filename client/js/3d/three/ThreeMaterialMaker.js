import {PipelineObject} from '../../application/load/PipelineObject.js';

class ThreeMaterialMaker {

 constructor() {

     var materialList = {};
     var materials = {};
     var loadedTextures = {};
     var requestedTextures = {};
     var materialPipeline = {};

     var textureReady = function(matId, txSettings) {

         var data = materialList[matId];


         if (materials[matId]) return;

         var loaded = 0;
         for (var key in data.textures[0]) {

             if (!loadedTextures[data.textures[0][key]]) {
                 //            console.log("Not Yet loaded:", [matId, key+'_'+data.textures[0][key], materialPipeline,  loadedTextures, data]);
                 setTimeout(function() {
                     textureReady(matId, txSettings);
                 }, 500);
                 return;
             }

             if (!loadedTextures[data.textures[0][key]][matId]) {
                 console.log("Not Yet loaded:", [matId, data.textures[0][key], materialPipeline,  loadedTextures, data]);
                 setTimeout(function() {
                     textureReady(matId, txSettings);
                 }, 500);
                 return;
             }

             loaded++
         }


         for (var key in data.textures[0]) {
             txSettings[key] = loadedTextures[data.textures[0][key]][matId];
         }

         if (!data.shader) {
             // just loading the texture...
             return;
         }

         //

         materials[matId] = new THREE[data.shader](txSettings);
         if (data.settings.side) {
             materials[matId].side = THREE[data.settings.side]
         }

         if (data.blending) materials[matId].blending = THREE[data.blending];
         if (data.color) {
             materials[matId].color.r = data.color.r;
             materials[matId].color.g = data.color.g;
             materials[matId].color.b = data.color.b;
         }

         PipelineAPI.setCategoryKeyValue('THREE_MATERIAL', matId, materials[matId]);
         //    console.log("Loaded all...", matId, loaded, data.textures[0]);
     };


     var addTexture = function(id, textureSettings, key, imageKey, textureReady) {

         var attachPipeline = function(matId, txSettings, txType, imgKey, onReadyCB) {
             var includeTexture = function(src, data) {
                 //    data = data.clone();



                 //            console.log("Apply THREE_TEXTURE", matId, txType+'_'+imgUrl ,src, [tx]);
                 //    tx.needsUpdate = true;
                 if (!loadedTextures[imgKey] ) {
                     loadedTextures[imgKey] = {};
                 }
                 loadedTextures[imgKey][id] = data;
                 data.bufferImgId = imgKey;
                 data.needsUpdate=true;
                 onReadyCB(matId, txSettings);
             };

             materialPipeline[id][imageKey] = new PipelineObject("THREE_TEXTURE", imageKey, includeTexture)
         };

         attachPipeline(id, textureSettings, key, imageKey, textureReady)
     };


     var createMaterial = function(id, data) {

         var textureSettings = {};

         for (var key in data.settings) {
             textureSettings[key] = data.settings[key];
         };

         materialPipeline[id] = {};

         for (var i = 0; i < data.textures.length; i++) {
             for (var key in data.textures[i]) {

                 var imageKey = data.textures[i][key]

                 if (!materialPipeline[id][imageKey] ) {
                     addTexture(id, textureSettings, key, imageKey, textureReady)
                 }
             }
         }
     };
 }




        loadMaterialist = function() {
            
            var textureListLoaded = function(scr, data) {
                for (var i = 0; i < data.length; i++){
                    materialList[data[i].id] = data[i];
                    createMaterial(data[i].id, data[i]);
                }
                console.log("Material List", materialList);
            };

            new PipelineObject("MATERIALS", "THREE", textureListLoaded);
        };


        createCanvasHudMaterial = function(texture) {
            var mat = new THREE.MeshBasicMaterial({ map: texture});
            mat.transparent = true;
            mat.blending = THREE["AdditiveBlending"];
            mat.depthTest = false;
            return mat;
        };

        createCanvasMaterial = function(texture) {
            var mat = new THREE.MeshBasicMaterial({ map: texture, blending:THREE["AdditiveBlending"], depthWrite:false});
            return mat;
        };

    }
export { ThreeMaterialMaker };