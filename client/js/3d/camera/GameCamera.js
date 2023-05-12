class GameCamera {
    constructor() {
        let tpf;
        let fraction = 1;
        let tempVec3 = new THREE.Vector3();
        let cameraPos = new THREE.Vector3();
        let cameraLookAt = new THREE.Vector3();
        let targetLookAt = new THREE.Vector3();
        let lookAtModifier = new THREE.Vector3();
        this.lookAtModApplied = new THREE.Vector3();
        let positionModifier = new THREE.Vector3();
        this.posModApplied = new THREE.Vector3();
        let targetPos = new THREE.Vector3();
        let transitionStartTime = 0;
        let transitionEndTime = 1;
        let currentTime = 0;
        let transitionEndCallbacks = [];

        this.addLookAtModifierVec3 = function(vec3) {
            lookAtModifier.add(vec3);
        }

        this.addPositionModifierVec3 = function(vec3) {
            positionModifier.add(vec3);
        }

        let applyCameraModifiers = function() {

            let gamePiece = GameAPI.getMainCharPiece();
            if (!gamePiece) return;
        //    let companions = gamePiece.companions;
       //     for (let i = 0; i < companions.length; i++) {
                let companion = GameAPI.getSelectedCompanion();
                if (companion) {
                    tempVec3.copy(companion.getPos());
                    tempVec3.sub(gamePiece.getCenterMass());
                    tempVec3.multiplyScalar(0.15);
                    GameAPI.getGameCamera().addLookAtModifierVec3(tempVec3);
                //    GameAPI.getGameCamera().addPositionModifierVec3(tempVec3);
                }
        //   }

            let target = gamePiece.getTarget();
            if (target) {
                tempVec3.copy(target.getPos());
                tempVec3.sub(gamePiece.getPos());
                tempVec3.multiplyScalar(0.12);
                GameAPI.getGameCamera().addLookAtModifierVec3(tempVec3);
                tempVec3.multiplyScalar(-0.3);
                GameAPI.getGameCamera().addPositionModifierVec3(tempVec3);
            }

        }.bind(this);

        let applyFrameToCameraMotion = function() {
            if (fraction > 1) return;

            if (GameAPI.getPlayerMain().playerCharacter) {
                    applyCameraModifiers();
            }

            fraction = MATH.calcFraction(transitionStartTime, transitionEndTime, currentTime);
            let factor = 1;
            let posFactor = 1;
            if (fraction < 0.95) {
                factor =  MATH.curveSigmoid(fraction*0.85);
                posFactor = MATH.curveSigmoid(fraction*0.95);
            } else {
                fraction = 1;
                factor = 1;
                posFactor = factor;
                MATH.callAll(transitionEndCallbacks);
                transitionEndCallbacks = [];
            }

            cameraPos.copy(ThreeAPI.getCamera().position);
            ThreeAPI.copyCameraLookAt(cameraLookAt);

            let pos = cameraPos;
            let tPos = targetPos;
            pos.x = MATH.interpolateFromTo(pos.x, tPos.x, posFactor);
            pos.y = MATH.interpolateFromTo(pos.y, tPos.y, posFactor);
            pos.z = MATH.interpolateFromTo(pos.z, tPos.z, posFactor);

            let cLook = cameraLookAt;
            let tLook = targetLookAt;
            cLook.x = MATH.interpolateFromTo(cLook.x, tLook.x, factor);
            cLook.y = MATH.interpolateFromTo(cLook.y, tLook.y, factor);
            cLook.z = MATH.interpolateFromTo(cLook.z, tLook.z, factor);

            ThreeAPI.setCameraPos(pos.x, pos.y, pos.z);
            ThreeAPI.cameraLookAt(cLook.x, cLook.y, cLook.z);
        };

        let setCameraTargetPosInTime = function(eventData) {
            fraction = 0;
            transitionStartTime = currentTime;
            transitionEndTime = currentTime + eventData.time;
            cameraPos.copy(ThreeAPI.getCamera().position);
            ThreeAPI.copyCameraLookAt(cameraLookAt);
            MATH.vec3FromArray(targetLookAt, eventData.lookAt)
            MATH.vec3FromArray(targetPos, eventData.pos)
            if (typeof(eventData.callback) === 'function') {
         //       console.log("set cam callback")
                if (transitionEndCallbacks.indexOf(eventData.callback) === -1) {
                    transitionEndCallbacks.push(eventData.callback)
                }
            }
        };


        let applyFrame = function(frame) {

                currentTime = frame.elapsedTime;
                tpf = frame.tpf;
                applyFrameToCameraMotion()
            };


        let getLookAtModifier = function() {
            return lookAtModifier;
        }

        let getPositionModifier = function() {
            return positionModifier;
        }

        let getFraction = function() {
            return fraction;
        }

        evt.on(ENUMS.Event.FRAME_READY, applyFrame);
        evt.on(ENUMS.Event.SET_CAMERA_TARGET, setCameraTargetPosInTime)

        this.call = {
            setCameraTargetPosInTime:setCameraTargetPosInTime,
            getPositionModifier:getPositionModifier,
            getLookAtModifier:getLookAtModifier,
            getFraction:getFraction
        }
    }

    getDefaultCamParams = function(store) {
        store.camCallback = function() {

        };

            store.mode = null;
            store.pos = [0, 0, 0];
            store.lookAt = [0, 0, 0];
            store.offsetPos = [0, 0, 0];
            store.offsetLookAt = [0, 0, 0]
    }



    updatePlayerCamera = function(camParams) {
        let lookAtMod = this.call.getLookAtModifier()
        let posMod = this.call.getPositionModifier()
        let fraction = this.call.getFraction()
        MATH.interpolateVec3FromTo(this.lookAtModApplied, lookAtMod, MATH.curveSigmoid(fraction)*0.5, this.lookAtModApplied)
        MATH.interpolateVec3FromTo(this.posModApplied, posMod, MATH.curveSigmoid(fraction)*0.5, this.posModApplied)

        let playerPos = GameAPI.getMainCharPiece().getPos()
        camParams.pos[0] = playerPos.x + camParams.offsetPos[0] + posMod.x;
        camParams.pos[1] = playerPos.y + camParams.offsetPos[1] + posMod.y;
        camParams.pos[2] = playerPos.z + camParams.offsetPos[2] + posMod.z;
        camParams.lookAt[0] = playerPos.x + camParams.offsetLookAt[0] + lookAtMod.x;
        camParams.lookAt[1] = playerPos.y + camParams.offsetLookAt[1] + lookAtMod.y;
        camParams.lookAt[2] = playerPos.z + camParams.offsetLookAt[2] + lookAtMod.z;
        lookAtMod.set(0, 0, 0);
        posMod.set(0, 0, 0);
        this.call.setCameraTargetPosInTime(camParams);
        this.lookAtModApplied.multiplyScalar(1-MATH.curveSigmoid(fraction));
        this.posModApplied.multiplyScalar(1-MATH.curveSigmoid(fraction));
    }

    buildCameraParams = function(camConf, camParams) {
        camParams.offsetPos[0] = camConf.offsetPos[0];
        camParams.offsetPos[1] = camConf.offsetPos[1];
        camParams.offsetPos[2] = camConf.offsetPos[2];
        camParams.offsetLookAt[0] = camConf.offsetLookAt[0];
        camParams.offsetLookAt[1] = camConf.offsetLookAt[1];
        camParams.offsetLookAt[2] = camConf.offsetLookAt[2];
        camParams.time = 0.08;
        if (camConf['mode'] === "portrait_main_char") {
        //    console.log("Make cam go to char here for nice")
        }
    }


}

export { GameCamera }