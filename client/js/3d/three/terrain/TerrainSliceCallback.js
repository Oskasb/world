class TerrainSliceCallback {
    constructor(folder, w, h, sliceLoaded) {

        let info = {
            sliceId:null,
            folder:folder,
            wl:null,
            x:null,
            y:null,
            w:w,
            h:h,
            pxScale:null
        }

        let sliceUpdated = function(data) {
            console.log("Slice Updates", info);
            sliceLoaded(info, data)
        }

        function setSliceParams(worldLevel, x, y, pxScale) {
            info.x=x;
            info.y=y;
            info.wl=worldLevel;
            info.pxScale = pxScale;
            info.sliceId = folder+"_"+worldLevel+"_"+x+"_"+y;
        }

        function getSliceId() {
            return info.sliceId
        }

        this.call = {
            sliceUpdated:sliceUpdated,
            setSliceParams:setSliceParams,
            getSliceId:getSliceId
        }
    }

}

export {TerrainSliceCallback}