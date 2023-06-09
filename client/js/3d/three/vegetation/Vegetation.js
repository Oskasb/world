"use strict";

define([
        'application/PipelineObject',
        '3d/effects/vegetation/VegetationSystem'
        //   'EffectAPI'
    ],
    function(
        PipelineObject,
        VegetationSystem
        //    EffectAPI
    ) {


        var EffectAPI;
        var vegConf = [];
        var vegData = {};

        var requested = false;

        var Vegetation = function(FxAPI) {

            this.vegetationSystems = [];

            EffectAPI = FxAPI;

            var vegSysData = function(src, data) {
                for (var i = 0; i < data.length; i++) {
                    vegData[data[i].id] = data[i].data;
                }

                if (requested) {
                    this.createVegetationSystems();
                }
            }.bind(this);

            var vegMasterData = function(src, data) {
                for (var i = 0; i < data.length; i++) {
                    vegConf[i] = data[i];
                }
                new PipelineObject('VEGETATION', 'SYSTEMS', vegSysData);
            };

            new PipelineObject('VEGETATION', 'MASTER_CONFIG', vegMasterData);

        };


        Vegetation.prototype.createVegetationSystems = function() {

            requested = true;

            for (var i = 0; i < vegConf.length; i++) {
                this.vegetationSystems.push(new VegetationSystem(i, EffectAPI, vegData, vegConf));
                requested = false;
            }
        };

        Vegetation.prototype.removeVegetationSystems = function() {
            for (var i = 0; i < this.vegetationSystems.length; i++) {
                this.vegetationSystems[i].cleanupVegetationSystem();
            }
            this.vegetationSystems = [];
        };

        Vegetation.prototype.updateVegetation = function(systemTime) {
            for (var i = 0; i < this.vegetationSystems.length; i++) {
                this.vegetationSystems[i].updateVegetationSystem(systemTime, WorldAPI.getWorldCamera().getCamera());
            }
        };

        Vegetation.prototype.setDebug = function(bool) {
            for (var i = 0; i < this.vegetationSystems.length; i++) {
                this.vegetationSystems[i].setVegSysDebug(bool);
            }
        };


        return Vegetation;

    });