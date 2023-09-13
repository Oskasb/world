
function init() {

    const textures = getTexturesFromAtlasFile( 'textures/cube/sun_temple_stripe.jpg', 6 );
    const materials = [];

    for ( let i = 0; i < 6; i ++ ) {
        materials.push( new THREE.MeshBasicMaterial( { map: textures[ i ] } ) );
    }

    const skyBox = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 1 ), materials );
    skyBox.geometry.scale( 1, 1, - 1 );
    scene.add( skyBox );

    // window.addEventListener( 'resize', onWindowResize );

}

function buildCubeMap( image ) {

    console.log("Build Cube Map", image)


    let loader = new THREE.CubeTextureLoader()
    let cubeMap = loader.load( [
            image.url,
            image.url,
            image.url,
            image.url,
            image.url,
            image.url
        ] );

    console.log(cubeMap);
/*
    const textures = [];

    let tilesNum = 6;

    for ( let i = 0; i < tilesNum; i ++ ) {
        textures[ i ] = new THREE.Texture();
    }

            let canvas, context;
            const tileWidth = image.bitmap.height;

            for ( let i = 0; i < textures.length; i ++ ) {

                canvas = document.createElement( 'canvas' );
                context = canvas.getContext( '2d' );
                canvas.height = tileWidth;
                canvas.width = tileWidth;
                context.drawImage( image, tileWidth * i, 0, tileWidth, tileWidth, 0, 0, tileWidth, tileWidth );
                textures[ i ].colorSpace = THREE.SRGBColorSpace;
                textures[ i ].image = canvas;
                textures[ i ].needsUpdate = true;

            }
*/

    return cubeMap;

}

class ThreeTexture {
    constructor(id, config, callback) {

        this.id = id;
        this.config = {};
        let _this = this;

        let imgLoaded = function(asset) {

            _this.texture = new THREE.CanvasTexture( asset.bitmap);

            _this.texture.isTexture = true;
            _this.applyTxSettings(_this.texture, _this.config.settings);

            _this.texture.sourceUrl = asset.url;
            _this.texture.generateMipmaps = false;
            _this.texture.needsUpdate = true;
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