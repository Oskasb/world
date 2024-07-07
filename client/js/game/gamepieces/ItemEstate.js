import {Object3D} from "../../../libs/three/core/Object3D.js";
import {Box3} from "../../../libs/three/math/Box3.js";
import {VisualEstateBorder} from "../visuals/VisualEstateBorder.js";

class ItemEstate {
    constructor(itemStatus) {

        let obj3d = new Object3D();
        let box3 = new Box3();

        let worldLevel = itemStatus[ENUMS.ItemStatus.WORLD_LEVEL];

        MATH.vec3FromArray(obj3d.scale, itemStatus[ENUMS.ItemStatus.SIZE_XYZ]);
        MATH.vec3FromArray(obj3d.position, itemStatus[ENUMS.ItemStatus.POS]);
        box3.setFromArray(obj3d.position, obj3d.scale);

        let active = false;

        let visualEstateBorder = new VisualEstateBorder();


        function activateEstate() {
            if (active === false) {
                active = true
                visualEstateBorder.on(obj3d.position, obj3d.scale);
            }
        }

        function deactivateEstate() {
            if (active === true) {
                active = false
                visualEstateBorder.off();
            }
        }

        function lodUpdated(lodLevel) {
            if (lodLevel > -1) {
                activateEstate()
            } else {
                deactivateEstate()
            }
        }



        function getWorldLevel() {
            return worldLevel;
        }

        function estateActivate(bool) {
            if (bool === true) {
                if (active === false) {
                    ThreeAPI.registerTerrainLodUpdateCallback(obj3d.position, lodUpdated)
                }
            } else {
                ThreeAPI.clearTerrainLodUpdateCallback(lodUpdated)
                deactivateEstate()
            }
        }

        this.call = {
            getWorldLevel:getWorldLevel,
            estateActivate:estateActivate
        }


    }



}

export { ItemEstate }