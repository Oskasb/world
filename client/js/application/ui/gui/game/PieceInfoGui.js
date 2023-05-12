import { GuiWidget} from "../elements/GuiWidget.js";
class PieceInfoGui {
    constructor(gamePiece) {

        this.statusList = [];

        this.statusListChar = [
            {
                status:'name',
                label:null,
                conf_status:'widget_piece_info_name_key',
                conf_label: 'widget_piece_info_name_value'
            },
            {
                status:'level',
                label:'Level:',
                conf_status:'widget_piece_info_elem_key',
                conf_label: 'widget_piece_info_elem_value'
            },
            {
                status:'hp',
                label:'HP:',
                conf_status:'widget_piece_info_elem_key',
                conf_label: 'widget_piece_info_elem_value'
            },
            {
                status:'maxHP',
                label:'MaxHP:',
                conf_status:'widget_piece_info_elem_key',
                conf_label: 'widget_piece_info_elem_value'
            },
            {
                status:'faction',
                label: 'Align:',
                conf_status:'widget_piece_info_elem_key',
                conf_label: 'widget_piece_info_elem_value'
            },
            {
                status:'dmg',
                label: 'damage',
                conf_status:'widget_piece_info_elem_key',
                conf_label: 'widget_piece_info_elem_value'
            },
            {
                status:'FAST',
                label: 'Atks',
                conf_status:'widget_piece_info_elem_key',
                conf_label: 'widget_piece_info_elem_value'
            },
            {
                status:'lifetime',
                label: 'Age',
                conf_status:'widget_piece_info_elem_key',
                conf_label: 'widget_piece_info_elem_value'
            }
        ]

        this.statusListItem = [
            {
                status:'name',
                label:null,
                conf_status:'widget_piece_info_name_key',
                conf_label: 'widget_piece_info_name_value'
            },
            {
                status:'item_type',
                label: 'Type:',
                conf_status:'widget_piece_info_elem_key',
                conf_label: 'widget_piece_info_elem_value'
            },
            {
                status:'lifetime',
                label: 'time',
                conf_status:'widget_piece_info_elem_key',
                conf_label: 'widget_piece_info_elem_value'
            }
        ]


        this.gamePiece = gamePiece;
        let updatePieceInfoGui = function() {
              this.updatePieceInfo();
        }.bind(this);

        let anchor = null;

        let setAnchor = function(element) {
            anchor = element;
        }
         let getAnchor = function() {
            return anchor;
        }

        this.callbacks = {
            updatePieceInfoGui:updatePieceInfoGui,
            setAnchor:setAnchor,
            getAnchor:getAnchor
        }

    }

    addProgressElement(configId, onReady) {
        let opts = GuiAPI.buildWidgetOptions(

            {
                widgetClass:'GuiProgressBar',
                widgetCallback:onReady,
                configId:configId
            }
        );

        evt.dispatch(ENUMS.Event.BUILD_GUI_ELEMENT, opts)

    }

    addContainerElement(configId, onReady) {
        let opts = GuiAPI.buildWidgetOptions(

            {
                widgetClass:'GuiExpandingContainer',
                widgetCallback:onReady,
                configId:configId
            }
        );

        evt.dispatch(ENUMS.Event.BUILD_GUI_ELEMENT, opts)

    }



    addStatusElements = function(containerElement) {
        let status = this.gamePiece.pieceState.status;

        let addStatusElement = function(statusParams) {

            let keyWidget = new GuiWidget(statusParams['conf_status'])
            let valueWidget = new GuiWidget(statusParams['conf_label'])


            if (statusParams['label'] === null) {

                let valueReady = function(widget) {
                    containerElement.guiWidget.addChild(widget);
                }
                let keyReady = function(widget) {
                    widget.setFirstSTringText(status[statusParams.status])
                    statusParams.textWidget = widget;
                    containerElement.guiWidget.addChild(widget);
                    keyWidget.initGuiWidget(null, valueReady);
                }

                valueWidget.initGuiWidget(null, keyReady);

            } else {
                let valueReady = function(widget) {
                    statusParams.textWidget = widget;
                    widget.setFirstSTringText(status[statusParams.status])
                    containerElement.guiWidget.addChild(widget);
                }
                let keyReady = function(widget) {
                    keyWidget.setFirstSTringText(statusParams.label)
                    containerElement.guiWidget.addChild(widget);
                    valueWidget.initGuiWidget(null, valueReady);
                }

                keyWidget.initGuiWidget(null, keyReady);
            }




        }


        let statusList;

        if (status.isItem) {
            statusList = this.statusListItem;
        }

        if (status.isCharacter) {
            statusList = this.statusListChar;
        }

        this.statusList = statusList;

        for (let i = 0; i < statusList.length; i++) {
            addStatusElement(statusList[i], status);
        }

    }

    activatePieceInfoGui() {

        let addContainerElement = function(configId, onReady) {
            let opts = GuiAPI.buildWidgetOptions(
                {
                    widgetClass:'GuiExpandingContainer',
                    widgetCallback:onReady,
                    configId:configId
                }
            );

            evt.dispatch(ENUMS.Event.BUILD_GUI_ELEMENT, opts)
        }


        let onReady = function(element) {
        //    element.guiWidget.initGuiWidget()
        //    element.guiWidget.applyWidgetPosition()
            this.callbacks.getAnchor().guiWidget.addChild(element.guiWidget);
            this.addStatusElements(element);
            //
        }.bind(this);

        let anchorReady = function(element) {

            this.callbacks.setAnchor(element);
            this.callbacks.updatePieceInfoGui();
            addContainerElement( 'widget_info_elem_container', onReady)
        }.bind(this);

        addContainerElement( 'widget_hidden_container', anchorReady)


        GameAPI.registerGameUpdateCallback(this.callbacks.updatePieceInfoGui)
    }

    deactivatePieceInfoGui() {
        this.statusList = [];
        GameAPI.unregisterGameUpdateCallback(this.callbacks.updatePieceInfoGui)
        let anchor = this.callbacks.getAnchor();
        anchor.guiWidget.recoverGuiWidget();

    }

    updateStatusValues = function() {
        for (let i = 0; i < this.statusList.length; i++) {
            let amount = this.gamePiece.getStatusByKey(this.statusList[i].status)
            this.statusList[i].textWidget.setFirstSTringText(amount)
        }
    }

    updatePieceInfo() {
        ThreeAPI.tempVec3.copy(this.gamePiece.getAboveHead(0.08));
        ThreeAPI.toScreenPosition(ThreeAPI.tempVec3, ThreeAPI.tempVec3b)
        let anchor = this.callbacks.getAnchor();
        anchor.guiWidget.setPosition(ThreeAPI.tempVec3b)
        this.updateStatusValues();
    }

}

export { PieceInfoGui }