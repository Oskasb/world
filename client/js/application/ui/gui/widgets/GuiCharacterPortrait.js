import { PortraitStatusGui } from "../game/PortraitStatusGui.js";


class GuiCharacterPortrait {
    constructor(actor, layoutConfId, onActivate, testActive, x, y, onReady) {
        this.portraitContainer;
        this.portraitStatusGui = new PortraitStatusGui();
        this.actor = actor;
        let buttonReady = function(button) {
            button.guiWidget.setWidgetIconKey(actor.getStatus('icon_key'))
            this.button = button;
            this.container = this.portraitContainer;
            this.guiWidget = button.guiWidget;
            this.portraitStatusGui.initPortraitStatusGui(actor, button);
            GuiAPI.addGuiUpdateCallback(this.portraitStatusGui.callbacks.updateCharStatGui)
            onReady(this)
        }.bind(this)

        let activate = function() {
            onActivate(actor);
        }

        let isActive = function() {
            return testActive(actor)
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
                text: actor.getStatus('name'),
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
            if (this.actor.getStatus('dead')) {
                let iconKey = 'dead'
                this.button.guiWidget.setWidgetIconKey(iconKey)
            } else {
                let iconKey = this.actor.getStatus('icon_key')
                this.button.guiWidget.setWidgetIconKey(iconKey)
            }
        }
    }

    closeCharacterPortrait() {
        GuiAPI.removeGuiUpdateCallback(this.portraitStatusGui.callbacks.updateCharStatGui)
        this.guiWidget.recoverGuiWidget()
    }

}

export { GuiCharacterPortrait }