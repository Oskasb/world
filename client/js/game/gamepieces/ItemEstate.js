import {Object3D} from "../../../libs/three/core/Object3D.js";
import {Box3} from "../../../libs/three/math/Box3.js";
import {VisualEstateBorder} from "../visuals/VisualEstateBorder.js";
import {isPlayerManagedEstate} from "../../application/utils/EstateUtils.js";
import {colorMapFx, elementColorMap} from "../visuals/Colors.js";
import {getPlayerActor} from "../../application/utils/ActorUtils.js";
import {getPlayerStatus} from "../../application/utils/StatusUtils.js";
import {saveItemStatus} from "../../application/setup/Database.js";

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


        let update = function() {

            let actor = getPlayerActor();

            if (actor) {
                let pos = actor.getPos();
                let activeEstate = GameAPI.worldModels.getActiveEstateAtPosition(pos)
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
            } else {
                visualEstateBorder.setRgba(elementColorMap['FRIENDLY']);
            }

            if (worldLodLevel < 0) {
                let visible = ThreeAPI.testBoxIsVisible(box3);
                if (visible === false) {
                    deactivateEstate()
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

        let worldLodLevel = -1;

        function lodUpdated(lodLevel) {
            worldLodLevel = lodLevel;

            if (lodLevel > -1) {
                activateEstate()
            }
        }



        function getWorldLevel() {
            if (worldLevel === "19") {
                if (getPlayerActor()) {
                    worldLevel = getPlayerStatus(ENUMS.PlayerStatus.PLAYER_ID)
                    if (itemStatus[ENUMS.ItemStatus.WORLD_LEVEL] !== worldLevel) {
                        itemStatus[ENUMS.ItemStatus.WORLD_LEVEL] = worldLevel;
                        saveItemStatus(itemStatus);
                    }
                }
            }
            return worldLevel;
        }

        let estateActivate = function(bool) {
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

        function getStatusSize() {
            return itemStatus[ENUMS.ItemStatus.SIZE_XYZ];
        }

        function getStatusWorldLevel() {
            return itemStatus[ENUMS.ItemStatus.WORLD_LEVEL];
        }

        function getStatusMap(){
            return itemStatus;
        }

        this.call = {
            getWorldLevel:getWorldLevel,
            estateActivate:estateActivate,
            posIsInside:posIsInside,
            getEstateActorId:getEstateActorId,
            getStatusWorldLevel:getStatusWorldLevel,
            getStatusPos:getStatusPos,
            getStatusSize:getStatusSize,
            getStatusMap:getStatusMap

        }

    }

}

export { ItemEstate }