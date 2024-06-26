class ThreeMaterialSettings {
    constructor(id, config, callback) {

        var assetLoaded = function(src, asset) {
            this.config = asset.config;
            callback(this)
        }.bind(this);

        PipelineAPI.cacheCategoryKey('CONFIGS', 'MATERIAL_SETTINGS_'+id, assetLoaded);
    };

}

export {ThreeMaterialSettings}