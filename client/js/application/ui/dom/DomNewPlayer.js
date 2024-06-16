import {poolFetch} from "../../utils/PoolUtils.js";

class DomNewPlayer {
    constructor() {

        function onUpdate(inValue, validationCb) {

        }

        function onSubmit(inValue, sMap) {

        }

        let statusMap = {
            in:"",
            out:"",
            status:"",
            value:"",
            NAME:"name...",
            onUpdate:onUpdate,
            onSubmit:onSubmit
        }



        let readyCb = function() {

            let nameDiv = htmlElement.call.getChildElement('NAME');
        //    headerDiv = htmlElement.call.getChildElement('header_container');
        //    topDiv = htmlElement.call.getChildElement('top_container');
        //    bottomDiv = htmlElement.call.getChildElement('bottom_container');
            let reloadDiv = htmlElement.call.getChildElement('reload');
        //    DomUtils.addClickFunction(invDiv, openInventory)
            DomUtils.addClickFunction(reloadDiv, init)


        }

        let stringEditClose = function() {
            console.log("Close String Edit")
        }

    //    init();
        let editString = poolFetch('DomEditString')
        editString.initEditTool(stringEditClose, statusMap, init)




        let htmlElement = poolFetch('HtmlElement')
        function init() {
            htmlElement.initHtmlElement('new_player', null, statusMap, 'full_screen', readyCb);
        }




    }

}

export { DomNewPlayer }