import { LineRenderSystem } from "./LineRenderSystem.js";

class DebugLines {
    constructor() {

        let lineDenderSystem  = new LineRenderSystem();
        this.lineDenderSystem = lineDenderSystem;
        let tempVec1 = new THREE.Vector3();
        let tempVec2 = new THREE.Vector3();
        let color;



        let updateFrame = function() {
            this.updateDebugLines()
            ThreeAPI.threeSetup.removePostrenderCallback(postRenderCall);
        }.bind(this);

        let postRenderCall = function() {
            updateFrame();
        }

        let renderCall = function() {
            this.lineDenderSystem.activate();
            ThreeAPI.threeSetup.addPostrenderCallback(postRenderCall);
        }.bind(this)

        let drawLine = function(event) {
            color = lineDenderSystem.color(event.color);
            lineDenderSystem.drawLine(event.from, event.to, color)
            renderCall()
        };

        let drawCross = function(event) {
            color = lineDenderSystem.color(event.color);
            lineDenderSystem.drawCross(event.pos, color, event.size);
            renderCall()
        };


        let drawBox = function(args) {
            tempVec1.set(args[0], args[1], args[2]);
            tempVec2.set(args[3], args[4], args[5]);
            color = lineDenderSystem.color(ENUMS.getKey('Color', args[6]));
            lineDenderSystem.drawAABox(tempVec1, tempVec2, color)
        };

        evt.on(ENUMS.Event.DEBUG_DRAW_LINE, drawLine);
        evt.on(ENUMS.Event.DEBUG_DRAW_CROSS, drawCross);
        evt.on(ENUMS.Event.DEBUG_DRAW_AABOX, drawBox);

    };

    updateDebugLines = function() {
        this.lineDenderSystem.render();
    };

    clearDebugLines = function() {
        this.lineDenderSystem.render();
        this.lineDenderSystem.render();
    }

}

export { DebugLines }