import {Vector3} from "../../../libs/three/math/Vector3.js";
import {Quaternion} from "../../../libs/three/math/Quaternion.js";

let index = [];
let remotes = [];

class Remote {
    constructor(stamp, remoteId) {
        if (remotes.indexOf(remoteId)) {
            console.log("--- REMOTE ALREADY ADDED --- FIX!")
        }
        remotes.push(remoteId)
        this.stamp = stamp;
        this.remoteId =remoteId;
        this.pos=new Vector3();
        this.scale=new Vector3();
        this.vel=new Vector3();
        this.quat=new Quaternion();
        this.remoteActionKey='';
        let action= null;
        this.lastSpatialTime=0;
        this.timeDelta=2


        let setAction = function(a) {
            action = a;
        };

        let getAction = function() {
            return action;
        };

        this.call = {
            setAction:setAction,
            getAction:getAction
        }

    }

}

export { Remote }