import {colorMapFx} from "./Colors.js";
import {getCountClosestFromList} from "../../application/utils/SpatialUtils.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";

class VisualDestinationsLayer {
    constructor() {

        let list = null;
        let countMax = 3;
        let distanceMax = 200;
        let fxRgba = colorMapFx['ADVENTURE_HINT']

        let visualisedDestinations = [];
        let proximateDestinations = [];
        let activePointers = [];

        function setList(array, rgba, cMax, dMax) {
            list = array;
            fxRgba = rgba || colorMapFx['ADVENTURE_HINT']
            countMax = cMax || countMax;
            distanceMax = dMax || distanceMax;
        }

        function clearDestinations() {
            MATH.emptyArray(visualisedDestinations);
            MATH.emptyArray(proximateDestinations);
        }

        function update() {
            let from = ThreeAPI.getCameraCursor().getPos()
            if (list.length !== 0) {
                MATH.emptyArray(visualisedDestinations);
                getCountClosestFromList(3, list, from, visualisedDestinations)
            } else {
                clearDestinations()
            }

            while (activePointers.length < visualisedDestinations.length) {
                let pointer = poolFetch('VisualDestinationPointer')
                pointer.on();
                pointer.setRGBA(colorMapFx['ADVENTURE_HINT'])
                activePointers.push(pointer);
            }

            while (activePointers.length > visualisedDestinations.length) {
                let pointer = activePointers.pop()
                pointer.off();
                poolReturn(pointer);
            }

            for (let i = 0; i < visualisedDestinations.length; i++) {
                let pointer = activePointers[i];
                pointer.from.copy(from);
                pointer.to.copy(visualisedDestinations[i].getPos())
                pointer.recalcPoints = true;
            }

        }

        function close() {
            while (activePointers.length) {
                let pointer = activePointers.pop()
                pointer.off();
                poolReturn(pointer);
            }
        }

        this.call = {
            setList:setList,
            update:update,
            close:close
        }

    }

    setDestinations(list, rgba, maxVisible, maxDistance) {
        this.call.setList(list, rgba, maxVisible, maxDistance)
    }

    on() {
        GameAPI.registerGameUpdateCallback(this.call.update)
    }

    off() {
        this.call.close();
        GameAPI.unregisterGameUpdateCallback(this.call.update)
    }

}

export { VisualDestinationsLayer }