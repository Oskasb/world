import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {detachConfig, saveEncounterEdits, saveWorldModelEdits} from "../../utils/ConfigUtils.js";
import {getEditIndex} from "../../../../../Server/game/utils/EditorFunctions.js";
import {WorldModel} from "../../../game/gameworld/WorldModel.js";


class DomEditAdd {
    constructor() {

        let statusMap = null
        let rootElem = null;
        let htmlElem;
        let applyContainerDiv = null;
        let selectList = null;
        let addButtonDiv = null;
        let selectionId = "";

        function applyAdd() {


            if (addButtonDiv.innerHTML === 'TEMPLATE') {
                templateEdit = poolFetch('DomEditTemplate')

                let parent = new WorldModel()
                parent.getPos().copy(ThreeAPI.getCameraCursor().getLookAroundPoint())
                let config = detachConfig(parent.config)
                MATH.vec3ToArray(parent.getPos(), config.pos, 1);
                config.edit_id = "tpl_"+config.edit_id

                let onLoad = function() {
                    saveWorldModelEdits(parent);
                }

                let map = {
                    id:config.edit_id,
                    parent:parent,
                    config:config,
                    root:statusMap.root,
                    folder:statusMap.folder,
                    onLoad:onLoad
                }

                let closeTmpl = function() {
                    poolReturn(templateEdit);
                }

                templateEdit.initEditTool(closeTmpl, map)

            } else {
                statusMap.activateSelection(selectionId);
            }



        }

        let htmlReady = function(htmlEl) {
            htmlElem = htmlEl;
            statusMap = htmlElem.statusMap;
            rootElem = htmlEl.call.getRootElement();

            selectList = htmlElem.call.getChildElement('select_list');
            applyContainerDiv = htmlElem.call.getChildElement('apply_container');
            htmlElem.call.populateSelectList('select_list', statusMap.selectList)
            addButtonDiv = htmlElem.call.getChildElement('add_button');
            DomUtils.addClickFunction(addButtonDiv, applyAdd)
            ThreeAPI.registerPrerenderCallback(update);
            applySelection(selectionId)
        }.bind(this);


        let templateEdit = null;
        let applySelection = function(id) {
            selectionId = id;
            if (id === "") {

            //    applyContainerDiv.style.display = "none"
                addButtonDiv.innerHTML = 'TEMPLATE';
            } else {
                if (templateEdit !== null) {
                    templateEdit.closeEditTool();
                    templateEdit = null;
                }
            //    applyContainerDiv.style.display = ""
                addButtonDiv.innerHTML = 'ADD';
            }
            statusMap.selectionUpdate(selectionId);
        };

        let update = function() {
            if (selectionId !== selectList.value) {
                applySelection(selectList.value);
            }
        };

        let close = function() {

        }

        this.call = {
            htmlReady:htmlReady,
            update:update,
            close:close
        }
    }

    initEditTool(closeCb, statusMap, onReady) {

        let readyCb = function() {
            this.call.htmlReady(this.htmlElement)
            if (typeof (onReady) === 'function') {
                onReady(this);
            }
        }.bind(this)
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_add', closeCb, statusMap, 'edit_frame edit_add', readyCb);
    }

    closeEditTool() {
        this.encounter = null;
        this.call.close();
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEditAdd }