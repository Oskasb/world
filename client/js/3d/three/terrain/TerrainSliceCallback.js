class TerrainSliceCallback {
    constructor(folder, w, h, sliceLoaded) {

        let info = {
            sliceId:null,
            folder:folder,
            wl:null,
            x:null,
            y:null,
            w:w,
            h:h
        }

        let sliceUpdated = function(data) {
            sliceLoaded(info, data)
        }

        function setSliceParams(worldLevel, x, y) {
            info.x=x;
            info.y=y;
            info.wl=worldLevel;
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