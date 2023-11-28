import {GuiWidget} from "../elements/GuiWidget.js";
import {poolReturn} from "../../../utils/PoolUtils.js";
import {elementColorMap} from "../../../../game/visuals/Colors.js";

let trackMap = {}
    trackMap[ENUMS.ActorStatus.SELECTED_ENCOUNTER] = 'icon_dagger'
    trackMap[ENUMS.ActorStatus.REQUEST_PARTY] = 'CAM_PARTY'



function getWidgetByStatus(statusKey, statusWidgets) {
    return statusWidgets[statusKey]
}

function updateStatusTracker(statusKey, iconKey, actor, statusWidgets, index) {
    let status = actor.getStatus(statusKey)
    let widget = getWidgetByStatus(statusKey, statusWidgets)

    let widgetRdy = function(widgt) {
        widgt.setWidgetIconKey(iconKey);
        widgt.getWidgetSurface()
        widget.icon.setGuiIconColorRGBA(elementColorMap['STATUS_HINT'])
    }

    if (status) {
        if (!widget) {
            widget = new GuiWidget('icon_actor_status_hint');
            widget.statusKey = statusKey;
            widget.initGuiWidget(null, widgetRdy);
            statusWidgets[statusKey] = widget;
        } else {
            let pos = actor.getSpatialPosition()
            pos.y += actor.getStatus(ENUMS.ActorStatus.HEIGHT) + 0.7;
            GuiAPI.worldPosToScreen(pos, ThreeAPI.tempVec3, 0.41, 0.0)
            ThreeAPI.tempVec3.y -= 0.03;
            ThreeAPI.tempVec3.x += 0.012;
            ThreeAPI.tempVec3.x -= index * 0.026;
            widget.offsetWidgetPosition(ThreeAPI.tempVec3);
        }
    } else {
        if (widget) {
            widget.recoverGuiWidget();
            statusWidgets[statusKey] = null;
        }
    }
}

function updateWorldActorStatus(actor, statusWidgets) {

    let count = 0;

    for (let key in trackMap) {
        updateStatusTracker(key, trackMap[key], actor, statusWidgets, count);
        count++;
    }

}

class WorldActorStatusUI {
    constructor() {

        let actor;

        let statusWidgets = {};

        let setActor = function(actr) {
            actor = actr;
        }

        let update = function() {
            updateWorldActorStatus(actor, statusWidgets);
        }

        let getWidgets = function() {
            return statusWidgets;
        }

        this.call = {
            update:update,
            setActor:setActor,
            getWidgets:getWidgets
        }
    }

    activateWorldActorStatus(actor) {
        this.call.setActor(actor);
        ThreeAPI.addPrerenderCallback(this.call.update)
    }

    deactivateWorldActorStatus() {
        poolReturn(this);

        let statusWidgets = this.call.getWidgets();

        for (let key in statusWidgets) {
            if (statusWidgets[key]) {
                statusWidgets[key].recoverGuiWidget();
                statusWidgets[key] = null;
            }
        }

        ThreeAPI.unregisterPrerenderCallback(this.call.update)
    }

}

export {WorldActorStatusUI}