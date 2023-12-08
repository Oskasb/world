import {Object3D} from "../../../libs/three/core/Object3D.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import {testAABOXIntersectPosition} from "../../application/utils/ModelUtils.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {configDataList} from "../../application/utils/ConfigUtils.js";
import {Box3} from "../../../libs/three/math/Box3.js";
import {colorMapFx} from "../visuals/Colors.js";


let configData = null;
let tempVec = new Vector3()
function onConfig(data) {
    configData = data;
}

class PhysicalModel {
    constructor() {
        this.debugColor = 'BLUE'
        this.obj3d = new Object3D();
        this.shapes = [];
        this.assetId = null;
        this.box = new Box3();
        let applyPhysicalConfig = function(data) {
            onConfig(data);
            let rebuild = this.assetId;
            this.deactivatePhysicalModel();
            if (rebuild) {
                this.initPhysicalWorldModel(rebuild, this.obj3d)
            }
        }.bind(this);

        if (!configData) {
            configDataList('PHYSICS', 'ASSET_SHAPES', applyPhysicalConfig)
        }

    }

    getPos() {
        return this.obj3d.position;
    }

    initPhysicalWorldModel(assetId, obj3d) {
        this.assetId = assetId;
        this.obj3d.copy(obj3d);
        this.box.min.set(999999999, 99999999, 99999999);
        this.box.max.set(-999999999, -99999999, -99999999);
        if (configData) {
            let shapes = null;
            if (configData[assetId]) {
                shapes = configData[assetId]['shapes'];
            } else {
                shapes = configData['default']['shapes'];
            }

            for (let i = 0; i < shapes.length; i++) {
                let conf = shapes[i];
                let shape = poolFetch('PhysicalShape');
                shape.setShapeParams(this.obj3d, this.box, conf['shape'], conf['pos'], conf['rot'], conf['scale'])
                this.shapes.push(shape);
            }
            tempVec.set(0.5, 0.5, 0.5)
            this.box.min.sub(tempVec);
            this.box.max.add(tempVec);
        }
    }

    deactivatePhysicalModel() {
        while (this.shapes.length) {
            let shape = this.shapes.pop();
            if (shape.instance) {
                shape.instance.decommissionInstancedModel();
                shape.instance = null;
            }
            poolReturn(shape)
        }
    }


    testIntersectPos(pos, insideStore) {
        let insideBounds = testAABOXIntersectPosition(pos, this.box);
        if (insideBounds) {
            this.debugColor = 'CYAN'

            for (let i = 0; i < this.shapes.length; i++) {
                let intersects = this.shapes[i].shapeIntersectsPos(pos, insideStore);
                if (intersects) {
                //    return intersects;
                }
            }

        } else {
            this.debugColor = 'BLUE'
        }

    }

    testIntersectRay(ray, contactPoint) {
        let insideBounds = ray.intersectBox(this.box, tempVec);
        if (insideBounds) {
            this.debugColor = 'CYAN'

            for (let i = 0; i < this.shapes.length; i++) {
                let intersects = this.shapes[i].shapeIntersectsRay(ray, contactPoint);
                if (intersects) {
                    //    return intersects;
                }
            }

        } else {
            this.debugColor = 'BLUE'
        }

    }

}

export {PhysicalModel}