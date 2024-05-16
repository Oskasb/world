import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";

let tempVec = new Vector3()
let frustumFactor = 0.828;


let nodeTypesList = ["", "TRAVEL", "TREASURE", "ENCOUNTER"]
class DomEditAdventureNode {
    constructor() {

        let nodeTypeSelect;
        let node = null;
        let rootElem = null;
        let htmlElement = null;

        function update() {
            let config = node.call.getConfig();

            let pos = node.getPos();
            //    div.value = model;
            ThreeAPI.toScreenPosition(pos, tempVec);
            rootElem.style.top = 35-tempVec.y*(100/frustumFactor)+"%";
            rootElem.style.left = 60+tempVec.x*(100/frustumFactor)+"%";

        }


        function htmlElReady(el) {
            console.log("htmlElReady", el)
            rootElem = el.call.getRootElement();
            rootElem.style.transition = 'none';

            nodeTypeSelect = el.call.getChildElement('nodetype');
        //    operationSelect.value = selectedOperation;
        //    DomUtils.addClickFunction(applyOperationDiv, applyOperation)

            el.call.populateSelectList('nodetype', nodeTypesList)

            ThreeAPI.registerPrerenderCallback(update);
        }

        function close() {
            node.call.despawnNodeHost();
            ThreeAPI.unregisterPrerenderCallback(update)

            htmlElement.closeHtmlElement();
            if (htmlElement === null) {
                console.log("Element already removed")
            } else {
                poolReturn(htmlElement);
            }
            htmlElement = null;
        }

        let setAdventureNode = function(adventureNode) {
            node = adventureNode;
            node.call.spawnNodeHost();

                htmlElement = poolFetch('HtmlElement')
                htmlElement.initHtmlElement('edit_adventure_node', close, this.statusMap, 'edit_frame edit_frame_taller', htmlElReady);

        }



        this.call = {
            setAdventureNode:setAdventureNode
        }

    }


}

export { DomEditAdventureNode }