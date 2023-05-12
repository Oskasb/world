import { PortraitStatusGui } from "../game/PortraitStatusGui.js";



class GuiCharacterPortrait {
    constructor(gamePiece, layoutConfId, onActivate, testActive, x, y, onReady) {
        this.portraitContainer;
        this.portraitStatusGui = new PortraitStatusGui();
        this.gamePiece = gamePiece;
        let buttonReady = function(button) {
            button.guiWidget.setWidgetIconKey(gamePiece.getStatusByKey('icon_key'))
            this.button = button;
            this.container = this.portraitContainer;
            this.guiWidget = button.guiWidget;
            this.portraitStatusGui.initPortraitStatusGui(gamePiece, button);
            onReady(this)
        }.bind(this)

        let activate = function() {
            onActivate(gamePiece);
        }

        let isActive = function() {
            return testActive(gamePiece)
        }


        let anchorReady = function(element) {
            this.portraitContainer = element;

            let opts = {
                widgetClass:'GuiSimpleButton',
                widgetCallback:buttonReady,
                configId: layoutConfId,
                onActivate:activate,
                testActive: isActive,
                interactive: true,
                set_parent:element.guiWidget,
                text: gamePiece.getStatusByKey('name'),
            };

            evt.dispatch(ENUMS.Event.BUILD_GUI_ELEMENT, opts)
        }.bind(this);

            let contopts = GuiAPI.buildWidgetOptions(
                {
                    widgetClass:'GuiExpandingContainer',
                    widgetCallback:anchorReady,
                    offset_x:  x,
                    offset_y:  y,
                    configId:'widget_gui_anchor'
                }
            );

            evt.dispatch(ENUMS.Event.BUILD_GUI_ELEMENT, contopts)

    }

    updatePortraitInteractiveState() {
        this.guiWidget.getWidgetSurface().updateInterativeState();
    }

    updateCharacterPortrait(tpf, gameTime) {
        if (this.portraitStatusGui) {
            this.portraitStatusGui.updateCharacterStatElement();
            if (this.gamePiece.isDead) {
                let iconKey = 'dead'
                this.button.guiWidget.setWidgetIconKey(iconKey)
            } else {
                let iconKey = this.gamePiece.getStatusByKey('icon_key')
                this.button.guiWidget.setWidgetIconKey(iconKey)
            }
        }
    }

}

export { GuiCharacterPortrait }