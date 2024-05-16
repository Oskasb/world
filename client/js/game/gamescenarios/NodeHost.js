class NodeHost {
    constructor() {

        this.node = null;


        let update = function () {
            let config = this.node.call.getConfig();

        }.bind(this)

        this.call = {
            update:update,
            close:close
        }

    }

    activateNodeHost(node) {
        this.node = node;
        GameAPI.registerGameUpdateCallback(this.call.update);
    }

    deactivateNodeHost() {
        GameAPI.unregisterGameUpdateCallback(this.call.update);
    }

}

export { NodeHost }