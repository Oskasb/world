class DomEditAdventureNode {
    constructor() {


        let node = null;

        function update() {
            let config = node.call.getConfig();
        }

        function close() {
            node.call.despawnNodeHost();
            ThreeAPI.unregisterPrerenderCallback(update)
        }

        let setAdventureNode = function(adventureNode) {
            node = adventureNode;
            node.call.spawnNodeHost();
            ThreeAPI.registerPrerenderCallback(update);
        }



        this.call = {
            setAdventureNode:setAdventureNode
        }

    }


}

export { DomEditAdventureNode }