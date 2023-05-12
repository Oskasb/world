class ThreeTexture {
    constructor(id, config, callback) {

        this.id = id;
        this.config = {};
        let _this = this;

        let imgLoaded = function(asset) {
        //       console.log("image loaded", asset);
            _this.texture = new THREE.CanvasTexture( asset.bitmap);
        //    console.log('CanvasTexture', this.id, this.texture)
            _this.applyTxSettings(_this.texture, _this.config.settings);
            _this.texture.sourceUrl = asset.url;
            callback(this)
        }.bind(this);

        let txSettingsLoaded = function(asset, xx) {
      //              console.log("txSettingsLoaded", asset, xx, config);
            for (let key in asset.config) {
                this.config[key] = asset.config[key];
            }

            ThreeAPI.loadThreeAsset('FILES_IMAGES_', config.img, imgLoaded);
        }.bind(this);

        ThreeAPI.loadThreeAsset('TEXTURE_SETTINGS_', config.settings, txSettingsLoaded);

    };

    applyTxSettings = function(tx, settings) {

        tx.userData = {};

        if (settings.combine)           tx.combine                  = THREE[settings.combine];
        if (settings.magFilter)         tx.magFilter                = THREE[settings.magFilter];
        if (settings.minFilter)         tx.minFilter                = THREE[settings.minFilter];
        if (settings.wrapS)             tx.wrapS                    = THREE[settings.wrapS];
        if (settings.wrapT)             tx.wrapT                    = THREE[settings.wrapT];

        if (settings.mapping)           tx.mapping                  = THREE[settings.mapping];

        if (settings.generateMipmaps)   tx.generateMipmaps          = settings.generateMipmaps;
        if (settings.flipY)             tx.flipY                    = settings.flipY;
        if (settings.data_rows)         tx.userData.data_rows       = settings.data_rows;
        if (settings.tiles_x)           tx.userData.tiles_x         = settings.tiles_x;
        if (settings.tiles_y)           tx.userData.tiles_y         = settings.tiles_y;
        tx.needsUpdate = true;

    };

}

export { ThreeTexture }