import { DomLoadScreen } from '../ui/dom/DomLoadScreen.js';
import { AssetLoader } from './AssetLoader.js';

class DataLoader {
    constructor() {
        this.loadStates= {
            SHARED_FILES:'SHARED_FILES',
            CONFIGS:'CONFIGS',
            THREEDATA:'THREEDATA',
            IMAGES:'IMAGES',
            COMPLETED:'COMPLETED'
        };

        this.loadState = this.loadStates.SHARED_FILES;
        this.loadProgress = new DomLoadScreen();
        this.assetLoader = new AssetLoader();

    }

    loadDataAsset = function(assetType, assetId, callback) {
        this.assetLoader.loadAsset(assetType, assetId, callback)
    };

    getLoadScreen = function() {
        return this.loadProgress
    };

        getStates = function() {
            return this.loadStates;
        };

        setupPipelineCallback = function(loadStateChange) {

        };

        loadData = function(dataPipelineSetup, onPipelineReadyCallback, onErrorCallback) {


            let _this = this;
            let loadScreen = _this.getLoadScreen();
            let loadStates = _this.loadStates;
            let loadingCompleted = function() {
                if (done) return;
                onPipelineReadyCallback('Loading Completed');
                done = true;
            };

            let loadStateChange = function(state) {
                //    console.log('loadStateChange', state)
                    if (state === _this.getStates().IMAGES) {

                }

                if (state === _this.getStates().COMPLETED) {
                    _this.loadState = _this.loadStates.THREEDATA;
                    loadingCompleted()
                }

            };

            let assetCount = 0;

            let done = false;
            function pipelineCallback(started, remaining, loaded, files) {
            //     console.log("SRL", _this.loadState, started, remaining, loaded, [files]);
                if (done) return;
                PipelineAPI.setCategoryKeyValue("STATUS", "FILE_CACHE", loaded);

                loadScreen.setProgress(loaded / started);

                if (_this.loadState === loadStates.THREEDATA && remaining === 0) {
                    //    console.log( "loadThreeData:", _this.loadState, started, remaining, loaded, [files]);
                    //   loadState = loadStates.COMPLETED;

                       loadStateChange(loadStates.COMPLETED);

                }



                if (_this.loadState === loadStates.CONFIGS && remaining === 0) {
                 //   console.log( "json cached:", PipelineAPI.getCachedConfigs());

                remaining++

                    let loadCallback = function(asset) {
                //        console.log("requestAsset returns: ", asset)
                        assetCount--
                        remaining--
                        if (!assetCount) {
                            _this.loadState = loadStates.COMPLETED;
                            remaining--

                            setTimeout(function() {
                                if (done) return;
                                loadStateChange(_this.loadState);
                            }, 20)

                        }
                    };

                    let subCallback = function(src, data) {
                        if (done) return;
                        for (let i = 0; i < data.length; i++) {
                            assetCount++
                            remaining++
                            client.dynamicMain.requestAsset(data[i], loadCallback)
                        }
                    };

                    let filesCallback = function(src, data) {
                        if (done) return;
                    //    console.log("Preload Files: ", data);
                        let loadCB = function(msg) {
                        //    console.log("Preload Asset: ", msg)
                            assetCount--
                            remaining--
                        };

                        for (let i = 0; i < data.length; i++) {

                            assetCount++
                            remaining++
                            ThreeAPI.loadThreeAsset('FILES_GLB_', data[i], loadCB)
                        }

                        PipelineAPI.cacheCategoryKey("ASSETS", "LOAD_MODELS", subCallback);

                    };

                    PipelineAPI.cacheCategoryKey("ASSETS", "PRELOAD_FILES", filesCallback);



                }

                if (_this.loadState === loadStates.SHARED_FILES && remaining === 0) {
                //    console.log( "shared loaded....");
                    _this.loadState = loadStates.CONFIGS;
                    _this.assetLoader.initAssetConfigs();

                    ThreeAPI.initThreeLoaders(_this.assetLoader);
                //    ThreeAPI.loadThreeData();
                    let apiReadyCB = function(msg) {
                     //   console.log('initEffectAPI', msg)
                    }
                    EffectAPI.initEffectAPI(apiReadyCB)
                    setTimeout(function() {
                        loadStateChange(_this.loadState);
                    }, 20)

                }
            }

            PipelineAPI.addProgressCallback(pipelineCallback);

            let onPipelineInitCallback = function(configCache) {
                console.log("CONFIGS:", configCache.configs)
            };

            PipelineAPI.dataPipelineSetup(dataPipelineSetup.jsonRegUrl, dataPipelineSetup, onPipelineInitCallback, onErrorCallback);

            _this.setupPipelineCallback(loadStateChange);

        };

        notifyCompleted = function() {
            this.loadProgress.removeProgress();

            let pollUrls = PipelineAPI.getCachedConfigs()['ASSETS']['POLL_INDEX'];
            PipelineAPI.prunePollUrlsExceptFor(pollUrls)

            let apiReadyCB = function(msg) {
        //        console.log(msg)
            }
            GuiAPI.initGuiApi(apiReadyCB)
            client.activateGui();
        };
    }

export { DataLoader }