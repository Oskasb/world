import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";

let tempVec = new Vector3();
let frustumFactor = 0.828;

let randomPaletteList = [
    'DEFAULT',
    'TOWN_RED',
    'TOWN_RED_2',
    'TOWN_GREEN',
    'TOWN_NEUTRAL',
    'TOWN_NEUTRAL_2',
    'TOWN_DARK',
    'TOWN_DARK_2',
    'TOWN_YELLOW'
]


function applyStatusRotToModel(statusMap, model) {
    // MATH.eulerFromQuaternion()
}

class DomEditWorldModel {
    constructor() {

        this.targetObj3d = new Object3D();
        this.updateObj3d = new Object3D();

        this.statusMap = {
            header:"xx",
            palette_selection:"xx",
            palette:"xx"

        };

        let statusMap = this.statusMap;

        let rootElem = null;

        let htmlElem;

        let initEditStatus = function(obj3d) {
            this.targetObj3d.copy(obj3d);
            this.updateObj3d.position.set(0, 0, 0);
            this.updateObj3d.scale.set(1, 1, 1);
            this.updateObj3d.quaternion.set(0, 0, 0, 1);
            this.statusMap.rotX = 0;
            this.statusMap.rotY = 0;
            this.statusMap.rotZ = 0;
        //    htmlElem.initStatusMap(this.statusMap)
        }.bind(this);
        let paletteVal = null;
        let worldModel = null;

        let populatePaletteList = function() {

            let list = htmlElem.call.getChildElement('palette');
            randomPaletteList.forEach(function(item){
                let option = htmlElem.call.createElement('option');
                option.value = item;
                option.innerHTML = item;
                list.appendChild(option);
            });
        }

        let setWorldModel = function(wModel) {
            worldModel = wModel;
            statusMap.palette = worldModel.call.getPaletteKey();
            if (paletteVal !== null) {
            //    paletteVal.value = worldModel.call.getPaletteKey();
            //    populatePaletteList()
            }
            initEditStatus(worldModel.obj3d)
        };

        let getWorldModel = function() {
            return worldModel;
        }

        let htmlReady = function(htmlEl) {
            htmlElem = htmlEl;
            rootElem = htmlEl.call.getRootElement();
            paletteVal = htmlElem.call.getChildElement('palette');
            populatePaletteList()
            if (worldModel !== null) {
            //    paletteVal.value = worldModel.call.getPaletteKey();
            //    populatePaletteList()
            }
            rootElem.style.transition = 'none';
            ThreeAPI.registerPrerenderCallback(update);
        }

        let modelNodes = [];
        let nodeDivs = [];

        let divClicked = function(e) {
            let model = e.target.value
            console.log("Edit Activated", model);
        }

        let applyEdits = function() {
            applyStatusRotToModel(statusMap, worldModel)
        };

        let update = function() {
            rootElem.style.transition = 'none';

            applyEdits()

            if (worldModel !== null) {

                if (statusMap.palette !== worldModel.call.getPaletteKey()) {
                    worldModel.call.setPaletteKey(statusMap.palette);
                //    populatePaletteList()
                }

                statusMap.header = worldModel.config.model
                statusMap.palette_selection = worldModel.config.palette
                let div = rootElem;
                let pos = worldModel.getPos();
            //    div.value = model;
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:pos, color:'YELLOW'});
                ThreeAPI.toScreenPosition(pos, tempVec);
                div.style.top = 35-tempVec.y*(100/frustumFactor)+"%";
                div.style.left = 60+tempVec.x*(100/frustumFactor)+"%";
            }

        };

        let close = function() {
            while (nodeDivs.length) {
                DomUtils.removeDivElement(nodeDivs.pop());
            }
        }

        this.call = {
            setWorldModel:setWorldModel,
            getWorldModel:getWorldModel,
            htmlReady:htmlReady,
            update:update,
            close:close
        }

    }


    initDomEditWorldModel(closeCb) {
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_world_model', closeCb, this.statusMap, 'edit_frame', this.call.htmlReady);
    }

    closeDomEditWorldModel() {
        this.call.close();
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEditWorldModel }