class Ocean {
    constructor() {

    }

    generateOcean() {
        const geometry = new THREE.PlaneGeometry( 4000, 4000, 64, 64 );
        const material = new THREE.MeshBasicMaterial( {color: 0xaabbff, side: THREE.DoubleSide} );
        const plane = new THREE.Mesh( geometry, material );
        plane.rotateX(-Math.PI*0.5)
        ThreeAPI.getScene().add( plane );


        let addSceneInstance = function(oceanModel) {
            console.log(oceanModel);
        }

        let asset = client.dynamicMain.assets['asset_ocean_16'];
        console.log(asset, client.dynamicMain.assets);
    }

}

export {Ocean}