import {GuiButtonFrame} from "./GuiButtonFrame.js";
import {poolFetch} from "../../../utils/PoolUtils.js";
import {frameFeedbackMap} from "../../../../game/visuals/Colors.js";

class GuiActorActionButton {
    constructor(actor, actionId, layoutConfId, onActivate, testActive, x, y, onReady, frameWidgetId, hpProgressId) {

        this.actor = actor;
        this.action = poolFetch('ActorAction')
        this.action.setActionKey(actor, actionId);


        this.name = this.action.visualAction.name;
        this.iconKey = this.action.visualAction.iconKey;
        this.portraitContainer;

        let action = this.action;
        let activate = function() {
            onActivate(action, actionId);
        }

        let isActive = function() {



            return testActive(action)
        }

        let buttonState = null;
        let buttonStateTime = 0;
        let buttonStateDuration = 1;
        let stateProgress = 0;
        let buttonStateStartTime = 0;
        let buttonStateKey = "none";


        let updateButtonState = function(tpf) {

            if (actor.call.getRemote()) {
                if (typeof (actor.call.getRemote().call.getActionById) === 'function') {
                    action = actor.call.getRemote().call.getActionById(actionId);
                    if (!action) {
                        return;
                    } else {
                        return;
                    }
                }
            }

            let newButtonState = action.call.getStatus(ENUMS.ActionStatus.BUTTON_STATE);
            if (newButtonState !== buttonState) {
                buttonState = newButtonState;
                buttonStateKey = ENUMS.getKey('ButtonState', buttonState)
                buttonStateTime = 0;
                buttonStateStartTime =  action.call.getStatus(ENUMS.ActionStatus.STEP_START_TIME)
                buttonStateDuration = action.call.getStatus(ENUMS.ActionStatus.STEP_END_TIME)
                let frameFbConfId = frameFeedbackMap[buttonStateKey];
                this.button.guiWidget.guiSurface.setFeedbackConfigId(frameFbConfId || 'feedback_icon_button_item')
            }

            stateProgress = MATH.calcFraction(buttonStateTime, buttonStateStartTime, buttonStateDuration);
            buttonStateTime += tpf;

            this.button.guiWidget.guiSurface.applyStateFeedback()

            this.updateButtonState(tpf);
        }.bind(this)

        this.call = {
            isActive:isActive,
            updateButtonState:updateButtonState
        }

        let buttonReady = function(button) {
            button.guiWidget.setWidgetIconKey(this.iconKey)
            this.button = button;
            this.container = this.portraitContainer;
            this.guiWidget = button.guiWidget;
            this.buttonFrame = new GuiButtonFrame(this.guiWidget, frameWidgetId);
            ThreeAPI.addPrerenderCallback(this.call.updateButtonState)
            onReady(this)
        }.bind(this)



        let anchorReady = function(element) {
            this.portraitContainer = element;

            let opts = {
                widgetClass:'GuiSimpleButton',
                widgetCallback:buttonReady,
                configId: layoutConfId,
                onActivate: activate,
                testActive: isActive,
                interactive: true,
                set_parent:element.guiWidget,
                text: this.name,
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


    updateButtonState(tpf) {

        this.guiWidget.getWidgetSurface().updateInterativeState();
        this.buttonFrame.updateButtonFrame(tpf);

    }

    removeGuiWidget() {
        this.action.recoverAttack()
        ThreeAPI.unregisterPrerenderCallback(this.call.updateButtonState)
        this.guiWidget.recoverGuiWidget()
    }


}

export { GuiActorActionButton }