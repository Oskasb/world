import * as DebugUtils from "./DebugUtils.js";
import {DebugLines} from "./lines/DebugLines.js";

class DebugView {
    constructor() {
        this.debugLines = new DebugLines()
        this.inspecting = {};
        this.isActive = false;
        let onActivate = function() {
            this.activateDebugView();
        }.bind(this);

        let inspectFrameUpdate = function() {
            this.debugLines.updateDebugLines();
            this.renderInspectionFrame();
        }.bind(this);

        this.callbacks = {
            onActivate:onActivate,
            inspectFrameUpdate:inspectFrameUpdate
        }
    }

    renderInspectionFrame() {
        if (this.inspecting['nodes']) {
            let nodes = DebugUtils.getAllSceneNodes();
            for (let i = 0; i < nodes.length;i++) {
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:nodes[i].position, color:'GREEN', size:1})
            }
        }
    }

    debugModelInspection = function(event) {

        let insKey = event['inspect']
        let inspecting = false;
        if (!this.inspecting[insKey]) this.inspecting[insKey] = false;
        this.inspecting[insKey] = !this.inspecting[insKey];

        for (let key in this.inspecting) {
            if (this.inspecting[key]) inspecting = true;
            console.log(key, inspecting);
        }
        console.log("Debug View Models ", event, this.inspecting[insKey], inspecting);

            if (inspecting) {
                ThreeAPI.addPrerenderCallback(this.callbacks.inspectFrameUpdate);
            } else {
                this.debugLines.clearDebugLines();
                ThreeAPI.unregisterPrerenderCallback(this.callbacks.inspectFrameUpdate);
            }
            
    }

    initDebugView = function() {
        let onDebugModels = function(event) {
            this.debugModelInspection(event);
        }.bind(this);

        evt.on(ENUMS.Event.DEBUG_VIEW_MODELS, onDebugModels)

        let testActive = function() {
            return this.isActive;
        }.bind(this)

        DebugUtils.createDebugButton('DEBUG', this.callbacks.onActivate, testActive, 'bottom_left', 0.037, 0.03)

    }

    activateDebugView = function() {
        this.isActive = !this.isActive;
        if (!this.isActive) {
            this.deactivateDebugView()
            return;
        }
        this.page = GuiAPI.activatePage('page_debug_view');
        this.containers = this.page.containers;

        evt.dispatch(ENUMS.Event.DEBUG_VIEW_TOGGLE, {activate:this.isActive, container:this.containers['page_debug_top_right']})
        console.log("Activate Debug View", this.page)


        //    GuiAPI.getGuiDebug().setupDebugText(this.containers['page_home_bottom_left']);

    }

    deactivateDebugView() {
        this.page.closeGuiPage();
    }

}

export { DebugView }