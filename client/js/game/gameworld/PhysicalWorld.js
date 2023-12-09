

let AMMO;

class PhysicalWorld {
    constructor() {
        this.physicalModels = [];
        AMMO = new Ammo();

        ThreeAPI.addPostrenderCallback(this.updatePhysicalWorld);
    }

    addPhysicalModel(physicalModel) {
        this.physicalModels.push(physicalModel)
    }

    removePhysicalModel(physicalModel) {
        MATH.splice(this.physicalModels, physicalModel);
    }

    pointIntersectsPhysicalWorld(pos) {

    }

    updatePhysicalWorld(tpf) {

    }


}

export {PhysicalWorld}