"use strict";


define(['PipelineAPI', 'ui/GameScreen'], function(PipelineAPI, GameScreen) {


    var pieces;
    var headingVec;
    var calcVec;
    var hasTarget;


    var targetDistance = 0;

    var orbitControls;


    var CameraFunctions = function() {

        this.camera = ThreeAPI.getCamera();

        orbitControls = new THREE.OrbitControls(this.camera, GameScreen.getElement());

        headingVec = new MATH.Vec3(0, 0, 0);
        calcVec = new MATH.Vec3(0, 0, 0);
        this.cameraTarget;

        this.distanceFactor = 0.001;
        this.distanceLimit = 70;

        this.velocityFactor = 1;

        this.targetPos  = new THREE.Vector3(0, 0, 0);
        this.targetVel = new THREE.Vector3(0, 0, 0);
        this.targetDir = new THREE.Vector3(0, 0, 0);
        this.targetRotVel = new THREE.Vector3(0, 0, 0);

        this.targetIdeal = new THREE.Vector3(0, 0, 0);
        this.finalTPos = new THREE.Vector3(0, 0, 0);

        this.cameraIdeal = new THREE.Vector3(0, 0, 0);
        this.finalCPos = new THREE.Vector3(0, 0, -10);


        this.distance  = new THREE.Vector3(0, 0, 7);

        this.frameCPos = new THREE.Vector3(0, 0, 0);
        this.frameTPos = new THREE.Vector3(0, 0, 0);

        this.moochVec  = new THREE.Vector3(0, 0, 0);
        this.calcVec   = new THREE.Vector3(0, 10, 0);
        this.forVec   = new THREE.Vector3(0, 10, 0);
        this.calcVec2 = new THREE.Vector3(0, 10, 0);
        this.calcVec3 = new THREE.Vector3(0, 10, 0);

        this.lookAtElevation = new THREE.Vector3(0, 1, 0);
        this.elevation = new THREE.Vector3(0, 4, 0);

        this.passiveinfluence = new THREE.Vector3(0, 0, -1);
        this.influence = new THREE.Vector3(0, 0, -1);


        this.masterCamLerp = 0.05;
        this.masterPosLerp = 0.05;
        this.camLerpFactor = this.masterCamLerp;

        this.posLerpFactor = this.masterPosLerp;

        this.lerpLimit = 2;
        this.rotVelFactor = 100;

        this.rotVel = 0;

        this.frameDist = 0;
        this.frameVel = 0;
        this.maxDist = 30;

        this.headingMin = 1;
        this.followMin = 18;


        pieces = PipelineAPI.readCachedConfigKey('GAME_DATA', 'PIECES');

        var clear;

        var lastTarget;
        var attackStarted = function(src, data) {
            clearTimeout(clear, 1);
            targetId = data;
            if (!data) {
                targetId = lastTarget;
            }

        };

        var selected = function(src, data) {

            clearTimeout(clear, 1);
            //    console.log("Target: ", data);
            targetId = data;
            clear = setTimeout(function() {
                lastTarget = data;
                targetId = null;
            }, 2000);

        };
        PipelineAPI.cacheCategoryKey("CONTROL_STATE", "TOGGLE_TARGET_SELECTED", selected);
        PipelineAPI.cacheCategoryKey("CONTROL_STATE", "TOGGLE_ATTACK_ENABLED", selected);
    };
    var targetId;

    CameraFunctions.prototype.checkTarget = function() {

         //this.targetPiece.readServerModuleState('input_target_select')[0].value;


        if (targetId) {
       //     console.log("HAS TARGET ID")
            if (pieces[targetId]) {
                return targetId;
            }
        }

        return false;
    };

    CameraFunctions.prototype.setCameraTargetPiece = function(piece) {
        this.targetPiece = piece.piece;
    };

    CameraFunctions.prototype.setToIdealFrame = function() {


        this.frameTPos.x = this.targetIdeal.x;
        this.frameTPos.y = this.targetIdeal.y;
        this.frameTPos.z = this.targetIdeal.z;

        this.frameCPos.x = this.cameraIdeal.x;
        this.frameCPos.y = this.cameraIdeal.y;
        this.frameCPos.z = this.cameraIdeal.z;

    };

    CameraFunctions.prototype.calcTargetIdealPosition = function() {
        this.calcVec.addVectors(this.forVec, this.lookAtElevation);
        this.targetIdeal.addVectors(this.target, this.calcVec);
    };


    CameraFunctions.prototype.calcDistanceGain = function() {
        return 0.1*this.frameVel * Math.sqrt(15+this.frameVel)-5 + Math.sqrt(this.rotVel*this.rotVel*this.rotVel*12) ;
    };



    CameraFunctions.prototype.calcIdealElevations = function() {
        this.calcVec.subVectors(this.cameraIdeal, this.targetPos);

        var distance = Math.min(this.maxDist*0.5, this.calcVec.length()*0.1)*0.5;

        this.targetIdeal.y += this.lookAtElevation.y+ distance*1.7 + this.frameVel*0.05;
        this.cameraIdeal.y = this.targetPos.y + this.elevation.y + distance*2*distance + this.frameVel*0.05;
    };




    CameraFunctions.prototype.calcCameraOutOfBounds = function() {

        this.frameDist = this.distanceFactor * this.camLerpFactor;
        if (this.frameDist > this.lerpLimit) {
            this.frameDist = this.lerpLimit
        }

    };

    CameraFunctions.prototype.copyTargetPos = function(vec) {
        var target = this.checkTarget();

        if (target) {
            var pos = pieces[target].piece.spatial.pos;

            vec.x = pos.data[0];
            vec.y = pos.data[1];
            vec.z = pos.data[2];}

    };



    CameraFunctions.prototype.calcTargetIdealPosition = function() {

        var distance = this.headingMin+this.calcDistanceGain()*0.01;

        // var distance = this.headingMin+this.calcDistanceGain()*0.01;

        MATH.radialToVector(MATH.addAngles(-this.targetDir.y-Math.PI*0.5, this.targetRotVel.y*0.1), distance, calcVec);

        this.calcVec2.x = calcVec.data[0];
        this.calcVec2.y = calcVec.data[1];
        this.calcVec2.z = calcVec.data[2];

        var target = this.checkTarget();

        if (target) {
            this.copyTargetPos(this.calcVec);
            this.calcVec2.lerp(this.calcVec, 0.33);
            targetDistance = this.headingMin + this.calcVec2.length()*0.2;
        } else {
            targetDistance = this.headingMin;
        }

        this.targetIdeal.addVectors(this.targetPos, this.calcVec2);
    };

    CameraFunctions.prototype.calcCameraIdealPosition = function() {

        var target = this.checkTarget();

        if (target) {
            this.copyTargetPos(this.calcVec);
            var distance = this.followMin*2+this.calcDistanceGain()*1;
        //    this.calcVec2.subVectors(this.targetPos, this.calcVec);
            this.calcVec2.normalize();
            this.calcVec2.multiplyScalar(-1);
        } else {
            this.calcVec.copy(this.targetIdeal);
            var distance = this.followMin+this.calcDistanceGain()*2;


            MATH.radialToVector(MATH.addAngles(-this.targetDir.y+Math.PI*0.5, this.targetRotVel.y*0.7), distance, calcVec);
            this.calcVec2.x = calcVec.data[0];
            this.calcVec2.y = calcVec.data[1];
            this.calcVec2.z = calcVec.data[2];

        //    this.calcVec.normalize();
        //    this.calcVec2.normalize();
        //    this.calcVec2.subVectors(this.calcVec, this.calcVec2);
        }


        this.calcVec2.normalize();
   //    this.calcVec3.copy(this.targetPos);;


   //     this.calcVec2.lerp(this.calcVec, 0.5);

    //    this.calcVec3.copy(this.targetVel);
    //    this.calcVec2.lerp(this.calcVec3, -0.5);

        this.calcVec2.multiplyScalar(MATH.clamp(Math.min(distance+this.rotVel*1.2, this.maxDist), -this.maxDist, this.maxDist));
    //    this.calcVec3.addVectors(this.calcVec2, this.t0argetPos);
        this.cameraIdeal.addVectors(this.targetPos, this.calcVec2);

    };


    CameraFunctions.prototype.mooch = function(ideal, final, lerpfac) {

        ideal.subVectors(ideal, this.targetPos);
        final.subVectors(final, this.targetPos);

        final.lerp(ideal, lerpfac);
        final.addVectors(this.targetPos, final);

        return;

        this.moochVec.subVectors(ideal, final);

        var dist = this.moochVec.length();
       //   this.moochVec.multiplyScalar(lerpfac);

        final.lerp(ideal, lerpfac);


    };

    CameraFunctions.prototype.moochIt = function() {
        this.mooch(this.targetIdeal, this.frameTPos, this.posLerpFactor);
        this.mooch(this.cameraIdeal, this.frameCPos, this.camLerpFactor);
    };

    CameraFunctions.prototype.aim_at_target_obj = function(targetVec3, config, masterValue, rotY) {

        ThreeAPI.setYbyTerrainHeightAt(targetVec3);

        var lastRotY = orbitControls.getAzimuthalAngle();


        this.calcVec2.copy(orbitControls.object.position);

        for (var i = 0; i < config.offsets.length; i++) {
            targetVec3[config.offsets[i].axis] += config.offsets[i].value + masterValue;
        }

        this.calcVec.copy(orbitControls.target);

        //    this.calcVec2.subVectors(targetVec3 , this.frameTPos );

        //    this.targetVel.multiplyScalar(4);
        //    this.targetVel.lerpVectors(this.calcVec2, this.targetVel,  0.15);


        //    this.calcVec.addVectors( this.calcVec, this.targetVel);

        orbitControls.target.lerpVectors(this.calcVec, targetVec3 , config.lerp || 0.02);

        //    orbitControls.target.addVectors( orbitControls.target, this.targetVel);

        for (i = 0; i < config.params.length; i++) {
            orbitControls[config.params[i].param] = config.params[i].value;
        }

        rotY = MATH.radialLerp(lastRotY, rotY, config.radial_lerp)

        orbitControls.minAzimuthAngle = rotY;
        orbitControls.maxAzimuthAngle = rotY;

        orbitControls.update();


        orbitControls.object.position.lerpVectors(this.calcVec2, orbitControls.object.position , config.lerp * 0.5 || 0.08);

        this.calcVec2.copy(orbitControls.object.position);

        ThreeAPI.setYbyTerrainHeightAt(this.calcVec2);

        if (this.calcVec2.y !== orbitControls.object.position.y) {
            var minElevation = config.min_elevation || 5;
            if (orbitControls.object.position.y < this.calcVec2.y+minElevation) {
                orbitControls.object.position.y = this.calcVec2.y+minElevation
            }
        }

    };

    CameraFunctions.prototype.above_target_obj = function(targetVec3, config, masterValue, rotY) {

        ThreeAPI.setYbyTerrainHeightAt(targetVec3);

        var lastRotY = orbitControls.getAzimuthalAngle();

        var lastPolar = orbitControls.getPolarAngle();

        this.calcVec2.copy(orbitControls.object.position);

        for (var i = 0; i < config.offsets.length; i++) {
            targetVec3[config.offsets[i].axis] += config.offsets[i].value + masterValue;
        }

        this.calcVec.copy(orbitControls.target);


        orbitControls.target.lerpVectors(this.calcVec, targetVec3 , config.lerp || 0.02);


        for (i = 0; i < config.params.length; i++) {
            orbitControls[config.params[i].param] = config.params[i].value;
        }

        rotY = orbitControls.minAzimuthAngle;

        rotY = MATH.radialLerp(lastRotY, rotY, config.radial_lerp);

        orbitControls.minAzimuthAngle = rotY;
        orbitControls.maxAzimuthAngle = rotY;

        orbitControls.minPolarAngle = (orbitControls.minPolarAngle * config.radial_lerp) + (lastPolar * (1 - config.radial_lerp)) ;
        orbitControls.maxPolarAngle = orbitControls.minPolarAngle;


        orbitControls.update();

        orbitControls.object.position.lerpVectors(this.calcVec2, orbitControls.object.position , config.lerp * 0.5 || 0.08);

        this.calcVec2.copy(orbitControls.object.position);

        ThreeAPI.setYbyTerrainHeightAt(this.calcVec2);

        if (this.calcVec2.y !== orbitControls.object.position.y) {
            var minElevation = config.min_elevation || 5;
            if (orbitControls.object.position.y < this.calcVec2.y+minElevation) {
                orbitControls.object.position.y = this.calcVec2.y+minElevation
            }
        }

    };

    CameraFunctions.prototype.orbit_target_obj = function(targetVec3, config, masterValue, rotY) {

        var lastRotY = orbitControls.getAzimuthalAngle();

        for (var i = 0; i < config.offsets.length; i++) {
            targetVec3[config.offsets[i].axis] += config.offsets[i].value + masterValue;
        }

        this.calcVec.copy(orbitControls.target);

        orbitControls.target.lerpVectors(this.calcVec, targetVec3 , config.lerp || 0.02);

        for (i = 0; i < config.params.length; i++) {
            orbitControls[config.params[i].param] = config.params[i].value;
        }

/*
        if (masterValue) {
            var ang = MATH.radialLerp(lastRotY, rotY, config.radial_lerp || 0.02);

            orbitControls.minAzimuthAngle = ang;
            orbitControls.maxAzimuthAngle = ang;
        }
*/
        orbitControls.update();
        this.calcVec2.copy(orbitControls.object.position);

        ThreeAPI.setYbyTerrainHeightAt(this.calcVec2);

        if (this.calcVec2.y !== orbitControls.object.position.y) {
            var minElevation = config.min_elevation || 5;
            if (orbitControls.object.position.y < this.calcVec2.y+minElevation) {
                orbitControls.object.position.y = this.calcVec2.y+minElevation
            }
        }

    };

    CameraFunctions.prototype.updateCamera = function() {

        console.log("CAll legacy CAM update")

        var targetPos = this.targetPiece.spatial.pos;
        this.targetPiece.spatial.getHeading(headingVec);
        var targetVel = this.targetPiece.spatial.vel;
        var targetRotVel = this.targetPiece.spatial.rotVel;
        var targetRot = this.targetPiece.spatial.rot;

        this.targetPos.x = targetPos.data[0];
        this.targetPos.y = targetPos.data[1];
        this.targetPos.z = targetPos.data[2];




        this.targetVel.x = targetVel.data[0];
        this.targetVel.y = targetVel.data[1];
        this.targetVel.z = targetVel.data[2];

        this.targetDir.x = Math.sin(headingVec.data[0]);
        this.targetDir.y = targetRot.data[1];
        this.targetDir.z = Math.sin(headingVec.data[2]);


        this.targetRotVel.y = targetRotVel.data[1];

        this.rotVel = this.targetRotVel.length();
        this.frameVel = this.targetVel.length();


        this.calcTargetIdealPosition();
        this.calcCameraIdealPosition();

        this.calcVec.subVectors(this.finalTPos, this.finalCPos);
        this.distanceFactor = this.calcVec.length();


            this.posLerpFactor = this.masterPosLerp;
            this.camLerpFactor = this.masterCamLerp;



        if (this.distanceFactor > this.distanceLimit) {
            this.distanceFactor = this.distanceLimit;
            //    this.setToIdealFrame();
        }

        this.calcIdealElevations();

        this.moochIt();

        this.finalTPos.x =  this.frameTPos.x;
        this.finalTPos.y =  this.frameTPos.y;
        this.finalTPos.z =  this.frameTPos.z;
        this.finalCPos.x =  this.frameCPos.x;
        this.finalCPos.y =  this.frameCPos.y;
        this.finalCPos.z =  this.frameCPos.z;

        this.calcVec.copy(this.finalCPos);

        ThreeAPI.setYbyTerrainHeightAt(this.calcVec);
        if (this.calcVec.y > this.finalCPos.y-2) {
            this.finalCPos.y = this.calcVec.y+2;
        }


        orbitControls.target.copy(this.finalTPos);

    //    this.calcVec.subVectors(this.finalTPos, ThreeAPI.getCamera().position);

        orbitControls.maxDistance = this.distanceLimit;

        orbitControls.update();

        ThreeAPI.updateCamera();

        return;


        ThreeAPI.setCameraPos(

            this.finalCPos.x,
            this.finalCPos.y,
            this.finalCPos.z

        );

        ThreeAPI.cameraLookAt(
            this.finalTPos.x,
            this.finalTPos.y,
            this.finalTPos.z
        )
    };


    return CameraFunctions

});