class PieceAnim {
    constructor(key, rigData, animState) {

            this.key = key;
            this.rigData = rigData;
            this.dataKey = 'animations';
            this.animationState = animState;
            this.currentTime = 0;
            this.duration = 0;
            this.startTime = 0;
            this.fade = 0.25;
            this.ts = 1;
            this.w = 0.01;
            this.channel = 0;
            this.fadeTime = 0;
            this.timeScale = 0;
            this.weight = 0;
        };

        getAnimDataProperty = function(propKey) {
            return this.rigData.data[this.dataKey][propKey];
        }

        activateNow = function(weight, timeScale, fadeTime) {
            this.currentTime = 0;

        //    console.log(this.animData)

            this.animationState.setAnimationLoop(this.getAnimDataProperty('loop'));
            this.animationState.setAnimationClamp(this.getAnimDataProperty('clamp'));
            this.animationState.setAnimationSync(this.getAnimDataProperty('sync'));
            this.setWeight(weight || 1);
            this.setTimeScale(timeScale || 1);
            this.setFadeTime(fadeTime || timeScale || 1);
            this.setChannel(this.getAnimDataProperty('channel') || 0);
            this.duration = this.getAnimDataProperty('duration') / this.ts || 99999999999;
        };

        setWeight = function(w) {
            this.weight = w;
            this.w = w * this.getAnimDataProperty('weight');
            this.animationState.setAnimationWeight(this.w)
        };

        setTimeScale = function(ts) {
            this.timeScale = ts;
            this.ts = ts* this.getAnimDataProperty('time_scale');
            this.animationState.setAnimationTimeScale(this.ts)
        };

        setFadeTime = function(timeScale) {
            this.fadeTime = this.getAnimDataProperty('fade');
            this.fade = timeScale * this.fadeTime;
            this.animationState.setAnimationFade(this.fade)
        };

        setChannel = function(channel) {
            this.channel = channel;
            this.animationState.setAnimationChannel(this.channel)
        };

        notifyOverwrite = function(fade) {

            if (this.w) {
                this.duration = this.currentTime + fade;
            }
        };

        refreshDuration = function() {
            this.duration = this.currentTime + this.getAnimDataProperty('duration') || 99999999999;
        };

        updateAnimation = function(tpf, time, removes, frozen) {
            this.currentTime += tpf;

            if (frozen) {
                console.log("Set Frozen Anim")
                this.setTimeScale(0.001);
            } else {
                this.setTimeScale(1);
            }

            if (this.duration < this.currentTime) {

                this.setWeight(0);

                if (this.duration + this.fade < this.currentTime) {
                    this.setFadeTime(0);
                    removes.push(this);
                }

            }
        };

    }

export { PieceAnim }