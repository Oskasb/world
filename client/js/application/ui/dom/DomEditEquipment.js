import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {configDataList, detachConfig} from "../../utils/ConfigUtils.js";
import {ENUMS} from "../../ENUMS.js";



class DomEditEquipment {
    constructor() {

        let statusMap = null;
        let itemSlots = null;
        let htmlElem = null;

        let itemConfigs = null;

        let slotToItemMap = {};

        let onItemsData = function(data) {
            itemConfigs = data;

            for (let key in itemConfigs) {
                let cfg = itemConfigs[key];
                let slot = cfg['equip_slot'];

                if (!slotToItemMap[slot]) {
                    slotToItemMap[slot] = [""];
                }

                slotToItemMap[slot].push(key)

            }

            console.log("onItemsData itemConfigs", slotToItemMap, itemConfigs)
        }

        configDataList("GAME","ITEMS", onItemsData)


        function toolClosedCB() {
        //    toolSelectDiv.value = "MODELS";
        }

        let htmlReady = function(htmlEl) {
            htmlElem = htmlEl;
            statusMap = htmlElem.statusMap;
            let actor = statusMap.parent;
            itemSlots = actor.actorEquipment.itemSlots;

            let container = htmlElem.call.getChildElement('selections_container');

            let html = "";

            for (let key in itemSlots) {
                let id = itemSlots[key].slotId;
                html += "<label for="+id+">"+id+"</label><select name="+id+" id="+id+"></select>"
            }

            container.innerHTML = html;

            setTimeout(function() {
                setupLists()
            }, 200)

        }


        function setupLists() {

            for (let key in itemSlots) {
                let id = itemSlots[key].slotId;
                let list = slotToItemMap[id] || [""];
                let item = itemSlots[key].item;
                let selection = "";

                if (item !== null) {
                    selection = item.configId;
                }

                let listElem = htmlElem.call.getChildElement(id);
                if (!listElem) {
                    console.log("No Elem ", id, key);
                }
                console.log("slotToItemMap id ", id, list, slotToItemMap);
                htmlElem.call.populateSelectList(id, list);
            //    listElem.value = selection;
            }

            ThreeAPI.registerPrerenderCallback(update);
        }

        let update = function() {


            for (let key in itemSlots) {
                let id = itemSlots[key].slotId;
                let listElem = htmlElem.call.getChildElement(id);
                let item = itemSlots[key].item;
                let selection = "";
                if (item !== null) {
                    selection = item.configId;
                }
                if (listElem.value !== selection) {
            //        console.log("Slot selection updated", id, selection)
                }
            }

        }

        let close = function() {
            ThreeAPI.unregisterPrerenderCallback(this.call.update);
            this.htmlElement.closeHtmlElement();
            poolReturn(this.htmlElement);
            this.htmlElement = null;
            poolReturn(this)
        }.bind(this);

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
        this.htmlElement.initHtmlElement('edit_equipment', closeCb, statusMap, 'edit_frame edit_equipment', readyCb);
    }


    closeEditTool() {
        this.call.close();
    }

}

export { DomEditEquipment }