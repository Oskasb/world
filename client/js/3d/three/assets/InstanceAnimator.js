class InstanceAnimator {
    constructor(instancedModel) {

        this.loopModes = [THREE.LoopOnce, THREE.LoopRepeat, THREE.LoopPingPong];
        this.clampModes = [false, true];
            this.animationActions = {};
            this.instancedModel = instancedModel;

            this.channels = [];

            this.addMixer(this.instancedModel.getObj3d());
            this.setupAnimations(this.instancedModel.getAnimationMap())
        };

        addMixer = function(clone) {
            this.mixer = new THREE.AnimationMixer( clone );
        };

        applyAnimationState = function(stateId, animMap, duration, channel, weight, clamp) {
            if (!animMap[stateId]) {
                console.log("Bad Anim request, ", stateId, animMap);
                return;
            }

            let params = animMap[stateId];

            if (typeof(channel) !== 'number') {
                channel = params['channel']
            }

            if (typeof(weight) !== 'number') {
                weight = params['weight']
            }

            if (typeof(clamp) !== 'number') {
                clamp = params['clamp']
            }

            this.updateAnimationAction(
                stateId,
                weight,
                params['time_scale'],
                params['fade'],
                channel,
                params['loop'],
                clamp,
                params['sync'],
                duration
            )

        };

        setupAnimations = function(animMap) {

            this.actionKeys = [];

            for (var key in animMap) {
                var actionClip = this.instancedModel.originalModel.getAnimationClip(animMap[key]);
                var action = this.addAnimationAction(actionClip);
                action.setEffectiveWeight( 1 );
                action.setEffectiveTimeScale( 1 );
            //    action.play();
                this.actionKeys.push(animMap[key]);
                this.animationActions[animMap[key]] = action;
            }
        };

        initAnimatior = function() {

            for (var key in this.animationActions) {
                var action = this.animationActions[key];
                action.stop();
                action.on = false;
            //    action.setEffectiveWeight( 0 );
            //    action.enabled = false;
            }
        };


        addAnimationAction = function(actionClip) {
            if (!actionClip) {
                console.log("No Anim Clip", this)
                return;
            }

            return this.mixer.clipAction( actionClip );
        };



        getSyncSource = function(sync) {

            for (var i = 0; i < this.channels.length; i++ ) {
                let src = MATH.getFromArrayByKeyValue(this.channels[i], 'sync', sync);
                if (src) {
                    return src;
                }
            }
        };

        syncAction = function(action) {

            let syncSrc = this.getSyncSource(action.sync);
            if (syncSrc) {

                if (action.channel <= syncSrc.channel ) {

            //        console.log("SyncSlave", syncSrc._clip.name, "Master: ",action._clip.name);

                    syncSrc.setEffectiveTimeScale(action.getEffectiveTimeScale());
                    action.syncWith(syncSrc);

                } else {
            //        console.log("SyncMaster", syncSrc._clip.name, "Slave:", action._clip.name);
                    action.setEffectiveTimeScale(syncSrc.getEffectiveTimeScale());
                    syncSrc.syncWith(action);

                }

            }

        };

        startChannelAction = function(channel, action, weight, fade, loop, clamp, timeScale, sync) {
        //    console.log("start chan action", action);

                action.reset();
                action.enabled = true;
                action.loop = this.loopModes[loop];
                action.clampWhenFinished = this.clampModes[clamp];

                action.setEffectiveWeight( weight );
                action.setEffectiveTimeScale( timeScale );

                action.play();

                action.fadeIn(fade);

                action.sync = sync;

                if (sync !== 0) {
                    this.syncAction(action);
                }

                channel.push(action);

        };

        fadeinChannelAction = function(channel, toAction, weight, fade, loop, clamp, timeScale, sync) {

            if (channel.indexOf(toAction) === -1) {

                var fromAction = channel.pop();

                this.startChannelAction(channel, toAction, weight, fade, loop, clamp, timeScale, sync);

                if (fromAction.sync && fromAction.sync === sync) {
                    fromAction.syncWith(toAction);
                }
                fromAction.fadeOut(fade);

            } else {
                if (weight !== toAction.getEffectiveWeight()) {
                    toAction._scheduleFading(fade, toAction.getEffectiveWeight(), weight / toAction.getEffectiveWeight());
                }
                toAction.setEffectiveTimeScale( timeScale );
                if (toAction.sync) {
                    this.syncAction(toAction);
                }
            }

        };


        stopChannelAction = function(channel, action) {

            MATH.quickSplice(channel, action);
            action.stop();
        };


        updateAnimationAction = function(animKey, weight, timeScale, fade, chan, loop, clamp, sync, duration) {
            if (typeof (duration) === 'number') {
                timeScale*=1/duration;
                fade*=duration;
            }

            let action = this.animationActions[animKey];
            if (!action) {
                console.log("Action not configured:", animKey)
                return;
            }
            action.channel = chan;
        //    console.log("anim event:", animKey, weight, timeScale, fade, chan);

            if (!this.channels[chan]) {
        //        console.log("Add anim channel", chan);
                this.channels[chan] = [];
            //    return;
            }

            if (weight) {

                if (this.channels[chan].length) {
                    this.fadeinChannelAction(this.channels[chan], action, weight, fade, loop, clamp, timeScale, sync)

                } else {
                    this.startChannelAction(this.channels[chan], action, weight, fade, loop, clamp, timeScale, sync)
                }

            } else {

                if (fade) {
                    action.fadeOut(fade);
                } else  {
                    this.stopChannelAction(this.channels[chan], action)
                }
            }

        };

        activateAnimator = function() {
            ThreeAPI.activateMixer(this.mixer);
        };

        deActivateAnimator = function() {
            ThreeAPI.deActivateMixer(this.mixer);
        };



    }

export { InstanceAnimator }