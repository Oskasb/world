import { SpatialTransition } from "../../application/utils/SpatialTransition.js";
import {notifyCameraStatus} from "../../3d/camera/CameraFunctions.js";
import {evt} from "../../application/event/evt.js";
import {configDataList} from "../../application/utils/ConfigUtils.js";
import {ENUMS} from "../../application/ENUMS.js";
import {poolFetch} from "../../application/utils/PoolUtils.js";
import {VisualDestinationsLayer} from "../visuals/VisualDestinationsLayer.js";
import {WorldAdventureUiSystem} from "../../application/ui/gui/systems/WorldAdventureUiSystem.js";

let spatialTransition

let completedEncounters = [];
let lootedTreasured = [];
let startingItems = [];

let worldAdventures = {};
let activeAdventures = [];

let nearbyAdventures = [];

let actionableAdventures = []

function getActiveWorldLevelAdventures() {

    MATH.emptyArray(actionableAdventures);

    let worldLevel = GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)
    if (!worldAdventures[worldLevel]) {
        worldAdventures[worldLevel] = [];
    }
    let advs = worldAdventures[worldLevel];

    for (let i = 0; i < advs.length; i++) {
        let adv = advs[i];
        let add = adv.call.testCriteria();
        if (add === true) {
            actionableAdventures.push(adv);
        }
    }

    return actionableAdventures;
}


function encounterCompleted(event) {
    console.log("Enc Completed", event, activeAdventures);
    completedEncounters.push(event.worldEncounterId);

    let advs = getActiveWorldLevelAdventures()

    for (let i = 0; i < advs.length; i++) {
        advs[i].call.notifyEncounterCompleted(event.worldEncounterId, event.worldEncounter)
    }

}


class GameAdventureSystem {
    constructor() {
        let worldAdvUiSys = new WorldAdventureUiSystem(this);

        spatialTransition  = new SpatialTransition();
        let adventureConfigs = [];
        this.startActor = null;
        this.page = null;

        evt.on(ENUMS.Event.ENCOUNTER_COMPLETED, encounterCompleted)

        let visualDestinationLayer = new VisualDestinationsLayer();

        let wAdvs = [];

        let activateworldLevelAdventures = function() {
            wAdvs = this.getWorldAdventures();
            for (let i = 0; i < wAdvs.length; i++) {
                wAdvs[i].call.spawnWorldAdventure();
            }
            visualDestinationLayer.setDestinations(nearbyAdventures);
            visualDestinationLayer.on();
        }.bind(this)

        function deactivateActiveAdventures() {

            let activeActor = GameAPI.getGamePieceSystem().selectedActor;

            if (activeActor) {
                let activeAdventureId =  activeActor.getStatus(ENUMS.ActorStatus.ACTIVE_ADVENTURE);
                if (activeAdventureId !== "") {
                    activeActor.setStatusKey(ENUMS.ActorStatus.ACTIVE_ADVENTURE, "")
                }
            }

            while (activeAdventures.length) {
                let adv = activeAdventures.pop();
                adv.call.sleepAdventure()
                adv.call.despawnWorldAdventure()
            }
            visualDestinationLayer.off();
        }

        let active = false;
        let worldLevel = -1;

        let inCombat = false;


        function updateNearbyAdventures() {
            MATH.emptyArray(nearbyAdventures);

            for (let i = 0; i < wAdvs.length; i++) {
                let adv = wAdvs[i];
                if (adv.call.isCompleted() === false) {
                    adv.call.updateDistance();

                    if (adv.distance < 200) {
                        nearbyAdventures.push(adv);
                    }
                }
            }

            nearbyAdventures.sort((a, b) => a.distance - b.distance)
            if (nearbyAdventures.length > 3) {
                nearbyAdventures.length = 3;
            }

            for (let i = 0; i < nearbyAdventures.length; i++) {
                nearbyAdventures[i].call.update()
            }

        }

        let updateActiveAdventure = function(advId) {
            let adv = this.getAdventureById(advId);
            if (typeof (adv) === 'object') {
                adv.call.updateDistance();
                adv.call.update();
            }

        }.bind(this);

            function update() {

                let activeCombat = GameAPI.checkInCombat()
                if (activeCombat !== inCombat) {
                    inCombat = activeCombat
                    if (inCombat) {
                        visualDestinationLayer.off()
                    } else {
                        visualDestinationLayer.on()
                    }
                }

            if (worldLevel !== GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)) {
                worldLevel = GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL);
                deactivateActiveAdventures()
                activateworldLevelAdventures();
            }


            let activeAdventureId = "";
                let activeActor = GameAPI.getGamePieceSystem().selectedActor;

                if (activeActor) {
                    activeAdventureId =  activeActor.getStatus(ENUMS.ActorStatus.ACTIVE_ADVENTURE);
                }

                if (activeAdventureId !== "") {
                    updateActiveAdventure(activeAdventureId);
                } else {
                    updateNearbyAdventures()
                }

        }

        let onData = function(data) {
            adventureConfigs = data;
        }

        configDataList("WORLD_ADVENTURE","ADVENTURES", onData)


        function activateAdventures() {
            if (active === false) {
                active = true;
                GameAPI.registerGameUpdateCallback(update);
                worldAdvUiSys.on();
            }
        }

        function playerAdventureActivated(activeNodes, wAdv) {
                console.log("playerAdventureActivated", activeNodes);
            visualDestinationLayer.call.setList(activeNodes)

            for (let i = 0; i < wAdvs.length; i++) {
                wAdvs[i].call.hideIndicator()
            }

            let activeActor = GameAPI.getGamePieceSystem().selectedActor;

            if (activeActor) {
                activeActor.setStatusKey(ENUMS.ActorStatus.ACTIVE_ADVENTURE, wAdv.id);
            }

        }

        let playerAdventureDeActivated = function(worldAdventure) {
            console.log("playerAdventureDeActivated", worldAdventure);

            visualDestinationLayer.call.setList(nearbyAdventures)

            if (worldAdventure.call.isCompleted() === false) {
                console.log("nearbyAdventures", nearbyAdventures)
                // activeAdventures.push(worldAdventure)
            }

            let activeActor = GameAPI.getGamePieceSystem().selectedActor;

            if (activeActor) {

                if (worldAdventure.id === activeActor.getStatus(ENUMS.ActorStatus.ACTIVE_ADVENTURE)) {
                    activeActor.setStatusKey(ENUMS.ActorStatus.ACTIVE_ADVENTURE, "");
                }

            }

        }.bind(this);


            function processRewardItem(item) {
                let activeActor = GameAPI.getGamePieceSystem().selectedActor;
                activeActor.processItemLooted(item);
            }

            let adventureCompleted = function(wAdv) {
                setSelectedAdventure(null);



                playerAdventureDeActivated(wAdv)
                let activeActor = GameAPI.getGamePieceSystem().selectedActor;
                let dataList = activeActor.getStatus(ENUMS.ActorStatus.COMPLETED_ADVENTURES)
                if (dataList.indexOf(wAdv.id) === -1) {
                    dataList.push(wAdv.id)
                    activeActor.setStatusKey(ENUMS.ActorStatus.COMPLETED_ADVENTURES, dataList)

                    let wAdvs = this.getWorldAdventures();

                    if (wAdvs.indexOf(wAdv) !== -1) {
                        MATH.splice(wAdvs, wAdv)
                    } else {
                        console.log("completed adventure should be present as active until completion")
                    }


                    let reward = wAdv.config.reward || null;

                    if (typeof (reward) === "string") {
                    //    attachItemReward(reward, innerHtml)
                        evt.dispatch(ENUMS.Event.LOAD_ITEM,  {id: reward, callback:processRewardItem})
                    } else if (reward !== null) {
                        if (typeof(reward.length) === 'number') {
                            for (let i = 0; i < reward.length; i++) {
                    //            attachItemReward(reward[i])
                                evt.dispatch(ENUMS.Event.LOAD_ITEM,  {id: reward[i], callback:processRewardItem})
                            }
                        }
                    }

                } else {
                    console.log("wAdv id already registered as complete, should not happen")
                }
            }.bind(this);


            function getNearbyAdventures(store) {
                MATH.copyArrayValues(nearbyAdventures, store);
                return store;
                // return nearbyAdventures;
            }

            let selectedAdventure = null;

            function setSelectedAdventure(adv) {
                selectedAdventure = adv;
                let activeActor = GameAPI.getGamePieceSystem().selectedActor;
                if (adv !== null) {

                    if (activeActor) {
                        activeActor.setStatusKey(ENUMS.ActorStatus.SELECTED_ADVENTURE, selectedAdventure.id);
                    } else {
                        ThreeAPI.getCameraCursor().getLookAroundPoint().copy(adv.getPos())
                    }
                } else {
                    GameAPI.getPlayer().setFocusOnPosition(null);
                    if (activeActor) {
                        activeActor.setStatusKey(ENUMS.ActorStatus.SELECTED_ADVENTURE, '');
                    }
                }

            }

        function getSelectedAdventure() {
            return selectedAdventure;
        }

        this.call = {
            activateAdventures:activateAdventures,
            playerAdventureActivated:playerAdventureActivated,
            playerAdventureDeActivated:playerAdventureDeActivated,
            adventureCompleted:adventureCompleted,
            getNearbyAdventures:getNearbyAdventures,
            setSelectedAdventure:setSelectedAdventure,
            getSelectedAdventure:getSelectedAdventure
        }


    }

    getCompletedEncounters() {
        return completedEncounters;
    }

    getLootedTreasures() {
        return lootedTreasured;
    }


    getActiveWorldAdventures() {
        return activeAdventures;
    }

    getWorldAdventures() {
        return getActiveWorldLevelAdventures()
    }

    getAdventureById(advId) {
        let advs = getActiveWorldLevelAdventures();
        for (let i = 0; i < advs.length; i++) {
            if (advs[i].id === advId) {
                return advs[i];
            }
        }
    }

    registerAdventure(worldLevel, worldAdventure) {
        if (!worldAdventures[worldLevel]) {
            worldAdventures[worldLevel] = [];
        }
        worldAdventures[worldLevel].push(worldAdventure);
    //    console.log("registerAdventure", worldLevel, worldAdventure, worldAdventures)
    }


    selectAdventure(event) {
        let equippedItems;
        let actor = this.startActor;
        notifyCameraStatus(ENUMS.CameraStatus.CAMERA_MODE, ENUMS.CameraControls.CAM_AUTO, true)
        notifyCameraStatus(ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, false)
        notifyCameraStatus(ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, false)
        if (event['activate_selection'] === true) {
            //    actor.activateWalkGrid(3);
            actor.call.activateActionKey("ACTION_TRAVEL_WALK", ENUMS.ActorStatus.TRAVEL)


            evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, {request:ENUMS.ClientRequests.UPDATE_STRONGHOLD, status:{TEMPLATE:actor.getStatus(ENUMS.ActorStatus.STRONGHOLD_ID)}})

            setTimeout(function() {
                evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, {request:ENUMS.ClientRequests.LOAD_SERVER_ACTOR, status:actor.getStatus()})
            }, 200)

            actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_INACTIVE)
            this.startActor.setStatusKey(ENUMS.ActorStatus.HP, this.startActor.getStatus(ENUMS.ActorStatus.MAX_HP))
        //    GameAPI.getGamePieceSystem().addActorToPlayerParty(this.startActor);
        //    GameAPI.getGamePieceSystem().playerParty.selectPartyActor(this.startActor);
            GameAPI.getGamePieceSystem().playerActorId = actor.id;
            GameAPI.getGamePieceSystem().startingItems = startingItems;
            //    this.startActor.travelMode.mode = null;
            if (this.page !== null) {
                GuiAPI.closePage(this.page);
            }
            if (client.page !== null) {
                GuiAPI.closePage(client.page)
            }

            client.page = null;

            this.startActor.removeGameActor();
            return;
        }

        let lookAroundPoint = ThreeAPI.getCameraCursor().getLookAroundPoint();

        MATH.vec3FromArray(spatialTransition.targetPos, event.pos);
        spatialTransition.targetPos.y = ThreeAPI.terrainAt(spatialTransition.targetPos);
        ThreeAPI.getCameraCursor().setZoomDistance(5)
        let actorId = event['actor_id'];
        let pageId = event['page_id'] || null;
        let worldEncounters = event['world_encounters'] || [];
        worldEncounters.push('portals_20')
        evt.dispatch(ENUMS.Event.LOAD_ADVENTURE_ENCOUNTERS, {world_encounters:[]})

        if (this.startActor) {
            let deactivateActor = this.startActor;
            setTimeout(function() {
                deactivateActor.removeGameActor();
            }, 10)
        }

        if (this.page) {
            GuiAPI.closePage(this.page)
            this.page = null;
        }

        let _this = this;

        let actorLoaded = function(actor) {

            MATH.emptyArray(startingItems);

            let equipCb = function(item) {
            //    console.log("Equip CB", item)
                startingItems.push(item);
                actor.equipItem(item);
            }

            let addToInvCb = function(item) {
                actor.actorInventory.addInventoryItem(item);
            }

            let delayed = function() {
                let status = event['status']


                for (let key in status) {
                    actor.setStatusKey(key, status[key])
                }



                equippedItems = event['equipped_items']

                if (equippedItems) {
                    for (let i = 0; i < equippedItems.length; i++) {
                        evt.dispatch(ENUMS.Event.LOAD_ITEM, {id: equippedItems[i], callback:equipCb})
                    }
                }

                let inventoryItems = event['inventory_items']

                if (inventoryItems) {
                    for (let i = 0; i < inventoryItems.length; i++) {
                        evt.dispatch(ENUMS.Event.LOAD_ITEM, {id: inventoryItems[i], callback:addToInvCb})
                    }
                }

            }

            let onActorReady = function() {
                setTimeout(delayed, 10);
            }

            actor.activateGameActor(onActorReady);
            this.startActor = actor;
        }.bind(this);

        evt.dispatch(ENUMS.Event.LOAD_ACTOR,  {id: actorId, pos:spatialTransition.targetPos, callback:actorLoaded})

        let onArriveCB = function(atPos) {
            evt.dispatch(ENUMS.Event.LOAD_ADVENTURE_ENCOUNTERS, {world_encounters:worldEncounters})
            setTimeout(function() {
                if (_this.page !== null) {
                    GuiAPI.closePage(_this.page)
                    _this.page = null;
                }
                if (pageId !== null) {
                    _this.page = GuiAPI.activatePage(pageId);
                }

                notifyCameraStatus(ENUMS.CameraStatus.CAMERA_MODE, ENUMS.CameraControls.CAM_ORBIT, true)
            }, 200)
        }.bind(this)

        let distance = MATH.distanceBetween(spatialTransition.targetPos, lookAroundPoint);

        spatialTransition.initSpatialTransition(lookAroundPoint, spatialTransition.targetPos, 1, onArriveCB, 15+distance*0.25, 'curveSigmoid')

    }



}

export { GameAdventureSystem }