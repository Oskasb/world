class Action {
    constructor() {


        let stateChainMap = {};
        stateChainMap[ENUMS.ActionState.AVAILABLE]      = ENUMS.ActionState.ACTIVATING;
        stateChainMap[ENUMS.ActionState.ACTIVATING]     = ENUMS.ActionState.ACTIVE;
        stateChainMap[ENUMS.ActionState.ACTIVE]         = ENUMS.ActionState.ON_COOLDOWN;
        stateChainMap[ENUMS.ActionState.ON_COOLDOWN]    = ENUMS.ActionState.AVAILABLE;

        let isActiveMap = {};
        isActiveMap[ENUMS.ActionState.AVAILABLE] = false;
        isActiveMap[ENUMS.ActionState.ACTIVATING] = true;
        isActiveMap[ENUMS.ActionState.ACTIVE] = true;
        isActiveMap[ENUMS.ActionState.ON_COOLDOWN] = true;
        isActiveMap[ENUMS.ActionState.ENABLED] = true;
        isActiveMap[ENUMS.ActionState.DISABLED] = false;
        isActiveMap[ENUMS.ActionState.UNAVAILABLE] = false;

        let timersMap = {};
        timersMap[ENUMS.ActionState.ACTIVATING] = 'activationTime';
        timersMap[ENUMS.ActionState.ACTIVE] = 'activeTime';
        timersMap[ENUMS.ActionState.ON_COOLDOWN] = 'cooldownTime';
        timersMap[ENUMS.ActionState.AVAILABLE]   = 'activationTime';

        this.stateChainMap = stateChainMap;
        this.isActiveMap = isActiveMap;
        this.timersMap = timersMap;

        this.params = {
            activationTime:1.3,
            activeTime: 0.5,
            cooldownTime:2.5,
            recoverTime:0.5,
            targetTime:0,
            progressTime:0,
            currentTime:0,
            active:false,
            action_points:1,
            state:ENUMS.ActionState.AVAILABLE,
            action_type:ENUMS.ActionState.ATTACK_GREATSWORD,
            name:"Test it",
            text:" ",
            icon:"fire"
        };

        let updateActProg = this.updateActionProgress;

        let updateActionProgress = function(tpf, time) {
            updateActProg(tpf, time)
        };

        this.insufficientActionPoints = true;

        this.onStateChangeCallbacks = [];
        this.onActivateCallbacks = [];

        this.callbacks = {
            updateActionProgress:updateActionProgress
        }
    };

    initAction = function(dataId, workerData, onReady) {
        this.workerData = workerData;

        var onDataReady = function(isUpdate) {
            this.applyActionConfig(this.workerData.data);
            if (!isUpdate) {
                onReady(this);
            }
        }.bind(this);

        this.workerData.fetchData(dataId, onDataReady);

    };

    applyActionConfig = function(actionConfig) {
        for (var key in actionConfig) {
            this.params[key] = actionConfig[key];
        }
    };

    updateActionFrameParams = function(params, tpf) {
        params.currentTime += tpf;
        if (params.currentTime > params[this.timersMap[params.state]]) {
            params.currentTime -= params[this.timersMap[params.state]];
            params.state = this.stateChainMap[params.state];
            params.targetTime = params[this.timersMap[params.state]];
            this.notifyActionStateChange()
        }
    };

    applyActionFrameParams = function(params) {
        if (params.state === ENUMS.ActionState.ACTIVATING) {
            params.text = "atk";
            params.progressTime = params.currentTime
        }

        if (params.state === ENUMS.ActionState.ACTIVE) {
            params.text = "active";
            params.progressTime = params.currentTime
        }

        if (params.state === ENUMS.ActionState.ON_COOLDOWN) {
            params.text = "cooling";
            params.progressTime = params.targetTime - params.currentTime
        }

        if (params.state === ENUMS.ActionState.AVAILABLE) {
            MainWorldAPI.removeWorldUpdateCallback(this.callbacks.updateActionProgress);
            params.text = params.name;
            params.active = false;
            params.progressTime = 0;
            this.actionEnded()
        }
    };

    updateActionProgress = function(tpf, time) {

        this.updateActionFrameParams(this.params, tpf);
        this.applyActionFrameParams(this.params);

    };

    activateAction = function() {

        if (!this.params.active) {
            MainWorldAPI.addWorldUpdateCallback(this.callbacks.updateActionProgress);
            this.params.active = true;

            this.params.state = stateChainMap[this.params.state];

            this.params.targetTime = this.params[this.timersMap[this.params.state]];
            this.params.text = " ";
            this.notifyActionStateChange();
        }
    };

    activateActionNow = function() {
        this.params.currentTime = 0;
        this.activateAction();
    };

    requestActivation = function() {
        this.notifyActionActivate();
    };

    testAvailable = function() {

        return this.getActionState() === ENUMS.ActionState.AVAILABLE;
    };

    testActivatable = function() {
        return this.isActiveMap[this.params.state];
    };

    getActionName = function() {
        return this.params.name;
    };

    getActionText = function() {
        return this.params.text;
    };

    getActionIcon = function() {
        return this.params.icon;
    };

    getActionTargetTime = function() {
        return this.params.targetTime;
    };

    getActionRecoverTime = function() {
        return this.params.recoverTime;
    };

    getActionProgressTime = function() {
        return this.params.progressTime;
    };

    getActionState = function() {
        return this.params.state;
    };

    getActionIsActive = function() {
        return this.params.active;
    };

    getActionType = function() {
        return this.params.action_type;
    };

    getActionPointCost = function() {
        return this.params.action_points;
    };

    addActionStateChangeCallback = function(cb) {
        this.onStateChangeCallbacks.push(cb);
    };

    notifyActionStateChange = function() {

        MATH.callAll(this.onStateChangeCallbacks, this)
    };


    addActionActivateCallback = function(cb) {
        this.onActivateCallbacks.push(cb);
    };

    removeActionActivateCallback = function(cb) {
        MATH.quickSplice(this.onActivateCallbacks, cb);
    };

    notifyActionActivate = function() {
        MATH.callAll(this.onActivateCallbacks, this)
    };

    actionEnded = function() {
        //    MATH.emptyArray(this.onStateChangeCallbacks)
    };

    updateAvailableAcionPointCount = function(count) {

        this.insufficientActionPoints = count < this.getActionPointCost();

        if (this.insufficientActionPoints) {
            if (this.getActionState() === ENUMS.ActionState.AVAILABLE) {
                this.params.state = ENUMS.ActionState.UNAVAILABLE;
            }
        } else {
            if (this.getActionState() === ENUMS.ActionState.UNAVAILABLE) {
                this.params.state = ENUMS.ActionState.AVAILABLE;
            }
        }
    };

}

export { Action }