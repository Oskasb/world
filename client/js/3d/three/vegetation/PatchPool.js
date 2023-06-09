"use strict";

define([
        'PipelineAPI'
        //   'EffectAPI'
    ],
    function(
        PipelineAPI
        //    EffectAPI
    ) {

        
        var PatchPool = function(vegSys) {
            var vegSystem = vegSys;
            var pool = [];

            this.pool = pool;

            var addPatch = function() {
                return vegSystem.createPatch()
            };

            this.generatePatch = function() {
                pool.push(addPatch());
            };
        };

        PatchPool.prototype.push = function(patch) {
            return this.pool.push(patch);
        };

        PatchPool.prototype.pop = function() {
            if (!this.pool.length) {
                this.generatePatch();
            }
            return this.pool.pop()
        };


        PatchPool.prototype.shift = function() {
            if (!this.pool.length) {
                this.generatePatch();
            }
            return this.pool.shift()
        };


        return PatchPool;

    });