import {MATH} from "../MATH.js";
import {detachConfig, parseConfigDataKey, saveAdventureEdits} from "./ConfigUtils.js";

function addNodeToAdventureAtPos(adventure, pos) {
    let nodeCfg = {
        pos : [0, 0, 0]
    }
    MATH.vec3ToArray(pos, nodeCfg.pos, 10);
    adventure.config.nodes.push(nodeCfg);
    saveAdventureEdits(adventure);
}

function saveAdventureNodeEdit(node) {
    node.adventure.config = detachConfig(node.adventure.config)
    saveAdventureEdits(node.adventure)
}


export {
    addNodeToAdventureAtPos,
    saveAdventureNodeEdit
}