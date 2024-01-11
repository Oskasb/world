import {unregisterGameServerUpdateCallback} from "../utils/GameServerFunctions.js";
import {
    getDestination,
    getStatusPosition
} from "./ActorStatusFunctions.js";
import {ENUMS} from "../../../client/js/application/ENUMS.js";

let actorTurnSequencer = null;
function setSequencer(sequencer) {
    console.log("setSequencer", sequencer)
    actorTurnSequencer = sequencer;
}

function getSequencer() {
    return actorTurnSequencer;
}

function updateActorInit(tpf) {
    let seqTime = getSequencer().getSequenceProgress()

    if (seqTime > 1) {
        unregisterGameServerUpdateCallback(updateActorInit)
        getSequencer().call.stateTransition()
        tpf = 0;
    }
    getSequencer().advanceSequenceProgress(tpf*2);
}

function updateActorTileSelect(tpf) {
    let sequencer = getSequencer();

    let seqTime = sequencer.getSequenceProgress()

    if (seqTime > 1) {
        unregisterGameServerUpdateCallback(updateActorTileSelect)
        getSequencer().call.stateTransition()
        tpf = 0;
    } else {
        let actor = sequencer.actor;
        let tilePath = actor.tilePath;
        let serverEncounter = sequencer.serverEncounter;
        let pathTiles = tilePath.pathTiles;
        let pathPoints = actor.getStatus(ENUMS.ActorStatus.PATH_POINTS);

        if (seqTime === 0) {
            let serverGrid = serverEncounter.serverGrid;
            let gridTiles = serverGrid.gridTiles;
            let destinationPos = getDestination(actor)
            let destinationTile = serverGrid.getTileByPos(destinationPos);
            let startTile = serverGrid.getTileByPos(getStatusPosition(actor));
            console.log("From To: ", startTile, destinationTile);
            serverGrid.selectTilesBeneathPath(startTile, destinationTile, gridTiles, tilePath);
            actor.serverActorPathWalker.setPathPoints(pathPoints);
        }


        let tileCount = pathTiles.length;

        while (pathPoints.length) {
            pathPoints.pop()
        }

        let drawTiles = Math.ceil(tileCount * seqTime);

        for (let i = 0; i < drawTiles; i++) {
            let gridPoint = pathTiles[i].gridPoint;
            pathPoints.push(gridPoint.point);
        }
    //    console.log("Set path points: ", pathPoints, tilePath);
        serverEncounter.sendActorStatusUpdate(actor);

    }

    sequencer.advanceSequenceProgress(tpf);
}

function updateActorTurnMove(tpf) {

    let actor = sequencer.actor;
    let tileCount = actor.serverActorPathWalker.tileCount();
    let seqTime = getSequencer().getSequenceProgress()
    if (seqTime > 1) {
        unregisterGameServerUpdateCallback(updateActorTurnMove)
        getSequencer().call.stateTransition()
        tpf = 0;
    } else {
        actor.serverActorPathWalker.walkPath(seqTime);
    }
    getSequencer().advanceSequenceProgress(tpf/tileCount);
}

function updateActorTargetSelect(tpf) {

    let seqTime = getSequencer().getSequenceProgress()
    if (seqTime > 1) {

        unregisterGameServerUpdateCallback(updateActorTargetSelect)
        getSequencer().call.stateTransition()
        tpf = 0;
    }
    getSequencer().advanceSequenceProgress(tpf*0.7);
}


function updateActorEvaluateTarget(tpf) {

    let seqTime = getSequencer().getSequenceProgress()

    if (seqTime > 1) {
        unregisterGameServerUpdateCallback(updateActorEvaluateTarget)
        getSequencer().call.stateTransition()
        tpf = 0;
    }

    getSequencer().advanceSequenceProgress(tpf * 0.75);
}

function updateActorSelectAttack(tpf) {

 //   let actor = getSequencer().getGameActor()
    let seqTime = getSequencer().getSequenceProgress()

 //   evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:actor.getSpatialPosition(), to:getSequencer().getTargetActor().getSpatialPosition(), color:'RED'});

    if (seqTime === 0) {
 //       getSequencer().selectedAttack = attackSelector.selectActorAction(actor)
    }


 //   let attack = getSequencer().selectedAttack;
    let holdTime = attack.getStepDuration('selected')

 //   let target = getSequencer().getTargetActor();
 //   attack.setActionTargetId(target.id);
 //   viewPrecastAction(getSequencer(), target)

    if (seqTime > holdTime) {
        unregisterGameServerUpdateCallback(updateActorSelectAttack)
        getSequencer().call.stateTransition()
        tpf = 0;
    }

    getSequencer().advanceSequenceProgress(tpf);
}


function updateActorApplyAttack(tpf) {

    let actor = getSequencer().getGameActor()
    let target = getSequencer().getTargetActor();
    let seqTime = getSequencer().getSequenceProgress()

    let attack = getSequencer().selectedAttack;

    if (seqTime === 0) {

        unregisterGameServerUpdateCallback(updateActorApplyAttack)

        attack.activateAttack(getSequencer().call.stateTransition)
        tpf = 0;
    }

    getSequencer().advanceSequenceProgress(tpf * 1.5);

}


function updateActorClose(tpf) {
    let seqTime = getSequencer().getSequenceProgress()

    if (seqTime > 1) {
        unregisterGameServerUpdateCallback(updateActorClose)
        getSequencer().call.stateTransition()
        tpf = 0;
    }

    getSequencer().advanceSequenceProgress(tpf*1.2);
}

export {
    setSequencer,
    updateActorInit,
    updateActorTileSelect,
    updateActorTurnMove,
    updateActorTargetSelect,
    updateActorEvaluateTarget,
    updateActorSelectAttack,
    updateActorApplyAttack,
    updateActorClose
}