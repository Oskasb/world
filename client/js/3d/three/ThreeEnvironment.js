import { PipelineObject } from "../../application/load/PipelineObject.js";


class ThreeEnvironment {
    constructor() {

        let _this = this;

        let tickEnv = function(tpf) {
            _this.tick(tpf)
        };

        this.tickEnvironment = tickEnv;

        this.currentEnvIndex = undefined;
        this.enabled = false;
        this.envList = {};
        this.skyList = {};
        this.worldSetup = {};
        this.world = {fog:{density:0, near:1, far: 100000}};
        this.currentEnvId = null;
        this.maxElevation = 10000;
        this.currentElevation = 0;
        this.elevationFactor = 0;
        this.transitionTime = 23;
        this.currentEnvConfig;
        this.currentSkyConfig;
        this.worldCenter = new THREE.Vector3(0, 0, 0);
        this.calcVec = new THREE.Vector3();
        this.calcVec2 = new THREE.Vector3();
        this.theta;
        this.phi;

        this.transitionProgress = 0;
        this.sky = null;

        this.ctx = null;
        this.ctxHeight = 64;
        this.ctxWidth= 1;

        this.scene;
        this.camera;
        this.renderer;
        this.sunSphere;
        this.fogColor = new THREE.Color(1, 1, 1);
        this.dynamicFogColor = new THREE.Color(1, 1, 1);
        this.ambientColor = new THREE.Color(1, 1, 1);
        this.dynamicAmbientColor = new THREE.Color(1, 1, 1);

    }


    loadEnvironmentData = function(onLoaded) {

        let _this = this;

        let worldListLoaded = function(src, data) {

        //    console.log("Load Env World Data:", src, data);

            for (let i = 0; i < data.params.length; i++){
                _this.worldSetup[data.params[i].id] = data.params[i]
            }
            _this.currentEnvId = data.defaultEnvId;
            _this.currentEnvIndex = undefined;
            //    console.log("worldSetup:", currentEnvId, worldSetup);

            onLoaded();
        };

    //    waterFx = new WaterFX();

        new PipelineObject("ASSETS", "WORLD", worldListLoaded);


    };


    setCanvasColor = function(ctx, tx) {
        let _this = this;
        let config = this.currentEnvConfig;

        let fogColor = config.fog.color;
        let ambColor = config.ambient.color;
        let sunColor = config.sun.color;

        var evFact = Math.min(this.camera.position.y*0.00005, 0.099);

        var grd = ctx.createLinearGradient(0,0,0, _this.ctxHeight);

        grd.addColorStop(1-1, ThreeAPI.toRgb(0.0, 0.0, fogColor[2]));
        //	grd.addColorStop(0.8+evFact,toRgb([color[0]*(0.5)*(1-evFact)+fog[0]*(0.5)*evFact*evFact, color[1]*0.5*(1-evFact)+fog[1]*(0.5)*evFact*evFact, color[2]*0.5*(1-evFact)+fog[2]*0.5*evFact*evFact]));

        if (evFact > 999999 || isNaN(evFact) || !isFinite(evFact)) {
            console.log("Camera went flying off... investigate")
            return;
        }
        grd.addColorStop(1-(0.577+evFact), ThreeAPI.toRgb(fogColor[0]*0.6, fogColor[1]*0.6, 1));

        //    grd.addColorStop(0.45,toRgb(ambient));

        grd.addColorStop(0.5, ThreeAPI.toRgb(fogColor[0], fogColor[1], fogColor[2]));
        ctx.fillStyle=grd;
        ctx.fillRect(0, 0, _this.ctxWidth, _this.ctxHeight);
        tx.needsUpdate = true;
    };

    applyColor = function(Obj3d, color) {
        if (Obj3d) {
            if (Obj3d.color) {
                Obj3d.color.r=color[0];
                Obj3d.color.g=color[1];
                Obj3d.color.b=color[2];
            } else {
                Obj3d.color = new THREE.Color(color[0],color[1], color[2]);
            }
        }

    };

    applyFog = function(Obj3d, density) {
        Obj3d.density = density * 0.3;
        Obj3d.near = 1;
        Obj3d.far = 1/density;
    };

    applyFromBuffer = function(buffer) {

    };

    applyEnvironment = function() {

        var config = this.currentEnvConfig;

        for (var key in config) {

            if (config[key].color) {

                if (key === 'sun') {

                    //    world[key].position.copy(sunSphere.position);
                    //    world[key].lookAt(worldCenter)
                }

                if (key === 'moon') {

                    this.world[key].position.x = 10 -this.sunSphere.position.x * 0.2;
                    this.world[key].position.y = 1000 +this.sunSphere.position.y * 5;
                    this.world[key].position.z = 10 -this.sunSphere.position.z * 0.2;
                    this.world[key].lookAt(this.worldCenter)
                }


                if (key === 'fog') {
                    this.fogColor.setRGB(config[key].color[0],config[key].color[1],config[key].color[2]);
                }

                if (key === 'ambient') {
                    this.ambientColor.setRGB(config[key].color[0],config[key].color[1],config[key].color[2]);
                }

                this.applyColor(this.world[key], config[key].color);
            }

            if (config[key].density) {
                this.applyFog(this.world[key], config[key].density * this.elevationFactor);
            //    renderer.setClearColor(fogColor)
            }
        }
    };

    applySkyConfig = function() {

        let config = this.currentSkyConfig;

        let uniforms = this.sky.uniforms;
        uniforms.turbidity.value = config.turbidity;
        uniforms.rayleigh.value = config.rayleigh;
        uniforms.luminance.value = config.luminance;
        uniforms.mieCoefficient.value = config.mieCoefficient;
        uniforms.mieDirectionalG.value = config.mieDirectionalG;

        this.sunSphere.visible = true;

    }



    updateDynamigFog = function(sunInTheBack) {

        this.dynamicFogColor.copy(this.fogColor);

        let sunRedness = this.world.sun.color.r * 0.5;
        let sunFactor = (sunRedness - sunInTheBack * (sunRedness-1)) * 0.15;
        this.dynamicFogColor.lerp(this.world.sun.color,   sunFactor);
        this.dynamicFogColor.lerp(this.ambientColor,      sunFactor);
        this.world.fog.color.copy(this.dynamicFogColor)

    };

    updateDynamigAmbient = function(sunInTheBack) {

        this.dynamicAmbientColor.copy(this.ambientColor);
        this.world.ambient.color.copy(this.dynamicAmbientColor)
    };

    interpolateEnv = function(current, target, fraction) {

        for (var key in current) {
            if (fraction >= 1) {
                if (current[key].color) {
                    current[key].color[0] = target[key].color[0];
                    current[key].color[1] = target[key].color[1];
                    current[key].color[2] = target[key].color[2];
                }

                if (current[key].density) {
                    current[key].density = target[key].density;
                }
            } else  {
                if (current[key].color) {
                    current[key].color[0] = MATH.interpolateFromTo(current[key].color[0], target[key].color[0],  fraction);
                    current[key].color[1] = MATH.interpolateFromTo(current[key].color[1], target[key].color[1],  fraction);
                    current[key].color[2] = MATH.interpolateFromTo(current[key].color[2], target[key].color[2],  fraction);
                }

                if (current[key].density) {
                    current[key].density = MATH.interpolateFromTo(current[key].density, target[key].density,  fraction) ;
                }
            }
        }

        return current;

    };


    interpolateSky = function(current, target, fraction) {

        for (var key in current) {
            if (fraction >= 1) {
                current[key] = target[key]
            } else {
                current[key] = MATH.interpolateFromTo(current[key], target[key],  fraction);
            }

        }

        return current;
    };




    updateUnderwater = function() {

        uniforms = this.sky.uniforms;
        uniforms.turbidity.value = 13;
        uniforms.rayleigh.value = 2.3;
        uniforms.luminance.value = 1.1;
        uniforms.mieCoefficient.value = 0.1;
        uniforms.mieDirectionalG.value = 0.822;

        theta = Math.PI * ( 0.94 - 0.5 );
        phi = 2 * Math.PI * ( 0.35 - 0.5 );

        sunSphere.position.x = 10000 * Math.cos( phi );
        sunSphere.position.y = 10000 * Math.sin( phi ) * Math.sin( theta );
        sunSphere.position.z = 10000 * Math.sin( phi ) * Math.cos( theta );

        sunSphere.quaternion.set(0, 1, 0, 0);

        sky.uniforms.sunPosition.value.copy( sunSphere.position );


        world.fog.color.set(0.1, 0.2, 0.4);

        //    applyColor(world.fog, uwFogColor);
        applyColor(world.sun, uwSunColor);
        applyColor(world.ambient, uwAmbColor);
        world.fog.density = 0.009;
        transitionProgress = 0;
        //    updateDynamigAmbient(uWambientColor);

        if (sky.ctx) {

            var grd = ctx.createLinearGradient(0,0,0, ctxHeight);

            grd.addColorStop(1, ThreeAPI.toRgb(0.0, 0.0, 0));
            //	grd.addColorStop(0.8+evFact,toRgb([color[0]*(0.5)*(1-evFact)+fog[0]*(0.5)*evFact*evFact, color[1]*0.5*(1-evFact)+fog[1]*(0.5)*evFact*evFact, color[2]*0.5*(1-evFact)+fog[2]*0.5*evFact*evFact]));
            grd.addColorStop(0.61, ThreeAPI.toRgb(0.01, 0.16, 0.22));

            //    grd.addColorStop(0.45,toRgb(ambient));

            grd.addColorStop(0.5, ThreeAPI.toRgb(0.01, 0.25, 0.5));
            grd.addColorStop(0.495, ThreeAPI.toRgb(0.1, 0.3, 0.7));
            grd.addColorStop(0.05, ThreeAPI.toRgb(0.5, 0.7, 1.0));
            sky.ctx.fillStyle=grd;
            sky.ctx.fillRect(0, 0, _this.ctxWidth, _this.ctxHeight);
            sky.tx.needsUpdate = true;
        }


    };

    calcTransitionProgress = function(tpf) {
        this.transitionProgress += tpf;

        return MATH.calcFraction(0, this.transitionTime, this.transitionProgress);
    };

    tick = function(tpf) {


        if (!this.sky) return;
        //    console.log("Tick Env")

        // waterFx.tickWaterEffect(tpf);

        let fraction = this.calcTransitionProgress(tpf * 1.0);

        //    t+=evt.args(e).tpf
        //    fraction = fraction;
        this.currentElevation = this.camera.position.y;

        if (this.currentElevation > 0) {
            this.elevationFactor = MATH.curveCube( MATH.airDensityAtAlt(this.currentElevation) );
        } else {
        //    this.updateUnderwater();
        //    return;
            this.elevationFactor = 0;
        }

        //      elevationFactor =  MATH.airDensityAtAlt(currentElevation) ;

    //    this.comEnvIdx = 4 // WorkerAPI.getCom(ENUMS.BufferChannels.ENV_INDEX);
        /*
        if (this.currentEnvIndex !== comEnvIdx) {
            this.currentEnvIndex = comEnvIdx;
            this.setEnvConfigId(this.envs[comEnvIdx], 45);
            return;
        }
*/
        if (fraction > 1.01) {
                    return;
        }

        let useSky = this.interpolateSky(this.currentSkyConfig, this.skyList[this.currentEnvId], fraction);

        this.interpolateEnv(this.currentEnvConfig, this.envList[this.currentEnvId], fraction);

        //   if (fraction <= 1) {
        this.applyEnvironment();
        this.applySkyConfig();
        //   }

        this.theta = Math.PI * ( useSky.inclination - 0.5 );
        this.phi = 2 * Math.PI * ( useSky.azimuth - 0.5 );

        this.worldCenter.copy(this.camera.position);
        this.worldCenter.y = 0;

        this.sunSphere.position.x = 0.00001 * useSky.distance * Math.cos( this.phi );
        this.sunSphere.position.y = 0.00001 * useSky.distance * Math.sin( this.phi ) * Math.sin( this.theta );
        this.sunSphere.position.z = 0.00001 * useSky.distance * Math.sin( this.phi ) * Math.cos( this.theta );

        this.calcVec.set(0, 0, 0);

        //   calcVec.sub(camera.position);
        this.sunSphere.lookAt(this.calcVec);
        this.sky.mesh.position.copy(this.worldCenter);

        this.world.sun.position.copy(this.sunSphere.position);

        this.sky.uniforms.sunPosition.value.copy( this.sunSphere.position );

        this.sunSphere.position.add(this.worldCenter);

        //   world.sun.position.add(worldCenter);
        this.world.sun.quaternion.copy(this.sunSphere.quaternion);

        this.calcVec.x = 0;
        this.calcVec.y = 0;
        this.calcVec.z = 1;

        this.calcVec2.x = 0;
        this.calcVec2.y = 0;
        this.calcVec2.z = 1;

        this.calcVec.applyQuaternion(this.sunSphere.quaternion);
        this.calcVec2.applyQuaternion(this.camera.quaternion);

        //   calcVec.normalize();
        //   calcVec2.normalize();

        let sunInTheBack = this.calcVec.dot(this.calcVec2);

        this.updateDynamigFog(sunInTheBack);
        this.updateDynamigAmbient(sunInTheBack);

        if (this.sky.ctx) {
            this.setCanvasColor(this.sky.ctx, this.sky.tx);
        }

        //   applyFromBuffer(envBuffer);
    };

    readDynamicValue = function(worldProperty, key) {
        return this.world[worldProperty][key];
    };

    getEnvironmentDynamicWorld = function() {
        return this.world;
    };

    enableEnvironment = function(threeEnv) {
        if (threeEnv.enabled) return;
        threeEnv.enabled = true;
        threeEnv.scene.add( threeEnv.sky.mesh );
        ThreeAPI.getReflectionScene().add(threeEnv.sky.meshClone);
    };

    getEnvConfigs = function() {
        return this.envList;
    };

    getCurrentEnvId = function() {
        return this.currentEnvId;
    };

    disableEnvironment = function() {
        if (!this.enabled) return;
        this.enabled = false;
        this.scene.remove( sky.mesh );
        // ThreeAPI.getReflectionScene().remove(sky.meshClone);
    //    ThreeAPI.getSetup().removePostrenderCallback(tickEnvironment);
    };







    initEnvironment = function(store, ready) {

        let _this = this;

        let setEnvConfigId = function(envConfId, time) {
            this.transitionTime = time || 225;
            this.transitionProgress = 0;
            this.currentEnvId = envConfId;
        }.bind(this);

        let advanceEnv = function(envArgs) {
                setEnvConfigId(envArgs.envId, envArgs.time);
        //    console.log("Advance ENV ", envArgs, _this.currentEnvId, _this.envList);
        };

        let scene = store.scene;
        this.scene = scene;
        this.renderer = store.renderer;
        this.camera = store.camera;

        evt.on(ENUMS.Event.ADVANCE_ENVIRONMENT, advanceEnv);

        var canvas = document.createElement("canvas");

        var setupCanvas = function(canvas) {
            canvas.id = 'sky_canvas';
            canvas.width  = _this.ctxWidth;
            canvas.height = _this.ctxHeight;
            canvas.dataReady = true;
            return canvas.getContext('2d');
        };

        var tx = ThreeAPI.newCanvasTexture(canvas);
        var mat = ThreeAPI.buildCanvasMaterial(tx);
        mat.side = THREE.BackSide;

        //    mat.depthWrite = false;

        var skyGeo = new THREE.SphereGeometry(4000, 36, 9 );
        var skyMesh = new THREE.Mesh( skyGeo, mat);

        var uniforms = {
            luminance: { value: 1 },
            turbidity: { value: 2 },
            rayleigh: { value: 1 },
            mieCoefficient: { value: 0.005 },
            mieDirectionalG: { value: 0.8 },
            sunPosition: { value: new THREE.Vector3() }
        };

        let sky = {
            mesh:skyMesh,
            ctx:setupCanvas(canvas),
            tx:tx,
            uniforms:uniforms
        }

        _this.sky = sky;
        _this.ctx = sky.ctx;
    //    this.setCanvasColor(sky.ctx, sky.tx);

        this.sky.meshClone = this.sky.mesh.clone();
        // Add Sun Helper

        this.sunSphere = new THREE.Mesh(
            new THREE.SphereGeometry( 20, 16, 8 ),
            new THREE.MeshBasicMaterial( { color: 0xffffff } )
        );

        this.sunSphere.position.y = 0;

        var createEnvWorld = function(worldSetup) {

            for (var key in _this.world) {
                scene.remove(_this.world[key]);
            }

            for (key in worldSetup) {

                if (key === "ambient") {

                    _this.world[key] = new THREE.AmbientLight(0x000000);
                    scene.add(_this.world[key]);

                } else if (key === "fog") {
                    //    scene.fog = {density:0, near:1, far: 100000}; // new THREE.Fog( 100, 10000000);
                //    scene.fog = new THREE.Fog( 100, 10000000);
                //        world[key] = scene.fog;
                    _this.world[key] = {density:0, near:1, far: 100000}
                    //    ThreeAPI.getReflectionScene().add(world[key]);
                } else {
                    _this.world[key] = new THREE.DirectionalLight(0x000000);
                    scene.add(_this.world[key]);
                    //    ThreeAPI.getReflectionScene().add(world[key]);
                }
            }
            ready()
        };


        let environmentListLoaded = function(scr, data) {


            for (let i = 0; i < data.length; i++){

                _this.envList[data[i].id] = {};
                _this.skyList[data[i].id] = {};
                var configs = data[i].configs;

                _this.skyList[data[i].id] = data[i].sky;

                for (var j = 0; j < configs.length; j++) {

                    _this.envList[data[i].id][configs[j].id] = configs[j];
                }
            }

            _this.currentSkyConfig = _this.skyList['current'];
            _this.currentEnvConfig = _this.envList['current'];

            _this.applySkyConfig();
            _this.applyEnvironment();

        };

        createEnvWorld(this.worldSetup);

        new PipelineObject("ASSETS", "ENVIRONMENT", environmentListLoaded);

    };

}


export { ThreeEnvironment }