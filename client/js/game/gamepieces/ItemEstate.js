import {Object3D} from "../../../libs/three/core/Object3D.js";
import {Box3} from "../../../libs/three/math/Box3.js";
import {VisualEstateBorder} from "../visuals/VisualEstateBorder.js";
import {isPlayerManagedEstate} from "../../application/utils/EstateUtils.js";
import {colorMapFx, elementColorMap} from "../visuals/Colors.js";
import {getPlayerActor} from "../../application/utils/ActorUtils.js";

class ItemEstate {
    constructor(itemStatus) {

        let obj3d = new Object3D();
        let box3 = new Box3();

        let worldLevel = itemStatus[ENUMS.ItemStatus.WORLD_LEVEL];

        MATH.vec3FromArray(obj3d.scale, itemStatus[ENUMS.ItemStatus.SIZE_XYZ]);
        MATH.vec3FromArray(obj3d.position, itemStatus[ENUMS.ItemStatus.POS]);
        box3.setFromCenterAndSize(obj3d.position, obj3d.scale);

        let active = false;

        let visualEstateBorder = new VisualEstateBorder();

        let estate = this;


        function update() {

            let actor = getPlayerActor();
            let activeEstate = GameAPI.worldModels.getActiveEstateAtPosition(actor.getPos())
            let isPlayerManaged = isPlayerManagedEstate(estate)

            if (activeEstate === estate) {
                if (isPlayerManaged === estate) {
                    visualEstateBorder.setRgba(elementColorMap['FRIENDLY']);
                } else {
                    visualEstateBorder.setRgba(elementColorMap['HOSTILE']);
                }
            } else {
                if (isPlayerManaged === estate) {
                    visualEstateBorder.setRgba(colorMapFx['FRIENDLY']);
                } else {
                    visualEstateBorder.setRgba(colorMapFx['HOSTILE']);
                }
            }
        }

        function activateEstate() {
            if (active === false) {
                active = true
                visualEstateBorder.on(obj3d.position, obj3d.scale);
                ThreeAPI.registerPrerenderCallback(update);
            }
        }

        function deactivateEstate() {
            if (active === true) {
                active = false
                visualEstateBorder.off();
                ThreeAPI.unregisterPrerenderCallback(update);
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

        function posIsInside(posVec) {
            return box3.containsPoint(posVec);
        }

        function getEstateActorId() {
            return itemStatus[ENUMS.ItemStatus.ACTOR_ID]
        }

        function getStatusPos() {
            return itemStatus[ENUMS.ItemStatus.POS];
        }

        function getStatusWorldLevel() {
            return itemStatus[ENUMS.ItemStatus.WORLD_LEVEL];
        }

        this.call = {
            getWorldLevel:getWorldLevel,
            estateActivate:estateActivate,
            posIsInside:posIsInside,
            getEstateActorId:getEstateActorId,
            getStatusWorldLevel:getStatusWorldLevel,
            getStatusPos:getStatusPos
        }

    }

}

export { ItemEstate }