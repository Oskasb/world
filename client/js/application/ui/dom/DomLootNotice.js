import {HtmlElement} from "./HtmlElement.js";

let noticeQueue = [];

class DomLootNotice {
    constructor() {

        let htmlElement = new HtmlElement();

        let statusMap = {}

        let closeCb = function () {
            console.log("Close...")
        }

        let container;

        let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();

        //    let optElem = DomUtils.createDivElement(container, 'option_' + option['interaction'], option['text'], 'option_container ' + option['interaction'])

            let addIcon = function () {
        //        let iconElem = DomUtils.createDivElement(optElem, 'icon_' + option['interaction'], '', 'interact_icon')
            }

            setTimeout(addIcon, 100)

        let hide = function() {
            htmlElement.hideHtmlElement()
        }

            let readyCb = function () {
                container = htmlElement.call.getChildElement('notice_container')
                DomUtils.addElementClass(container, statusMap.rarity)
                let header = htmlElement.call.getChildElement('header')
            //    header.innerHTML = hostActor.getStatus(ENUMS.ActorStatus.NAME)
                DomUtils.addClickFunction(header, rebuild)
                setTimeout(hide, 1500)
            }

            let rebuild = htmlElement.initHtmlElement('loot_notice', closeCb, statusMap, 'loot_notice', readyCb);

            let notify = function(actor, item) {
                if (actor === GameAPI.getGamePieceSystem().selectedActor) {
                    console.log("loot notice", item)
                //    let visualPiece = item.visualGamePiece
                    statusMap.header = item.getStatus(ENUMS.ItemStatus.NAME);
                    statusMap.item_type = item.getStatus(ENUMS.ItemStatus.ITEM_TYPE);
                    statusMap.item_level = 'Level:'+item.getStatus(ENUMS.ItemStatus.ITEM_LEVEL);
                    statusMap.rarity = item.getStatus(ENUMS.ItemStatus.RARITY);
                    statusMap.quality = item.getStatus(ENUMS.ItemStatus.QUALITY);
                    htmlElement.showHtmlElement();

                } else {
                    console.log("Someone elses loot")
                }

            }

            let update = function () {
                let optsContainer = htmlElement.call.getChildElement('interact_container')
                if (optsContainer) {
                    let gameTime = GameAPI.getGameTime();
                    let flash = Math.sin(gameTime * 2.7) * 0.5 + 0.5;
                    let shadowSize = flash * 0.55 + 0.65
                    let color = 'rgba(99, 255, 255, 0.7)';
                    optsContainer.style.boxShadow = '0 0 ' + shadowSize + 'em ' + color;
                }
            }

            ThreeAPI.registerPrerenderCallback(update);

        let close = function () {
            ThreeAPI.unregisterPrerenderCallback(update);
            htmlElement.closeHtmlElement()
        }

        this.call = {
            close: close,
            notify: notify
        }
    }


}

export { DomLootNotice }