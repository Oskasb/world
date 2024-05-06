import {ENUMS} from "../ENUMS.js";
import {MATH} from "../MATH.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";

let tempVec = new Vector3()
let normVec = new Vector3()

console.log("Worker Loaded", ENUMS.ActorStatus.IS_ACTIVE)


function saveBufferAsPng(worldLevel, buffer) {
    postMessage({worldLevel:worldLevel, buffer:buffer})
}


function getNormal(pixel, buffer, normStore) {
    let side = Math.sqrt(buffer.length/4)
    tempVec.y = buffer[pixel];

    if (pixel+4 < buffer.length) {
        tempVec.x = tempVec.y - buffer[pixel+4];
    } else {
        tempVec.x = tempVec.y - buffer[pixel];
    }


    if (pixel+side < buffer.length) {
        tempVec.z = tempVec.x - buffer[pixel+side*4]
    } else {
        tempVec.z = tempVec.x - buffer[pixel]
    }
    tempVec.normalize();
    normStore.y = 1 - Math.abs(tempVec.x) - Math.abs(tempVec.z);
    normStore.x = tempVec.x;
    normStore.z = tempVec.z;
    normStore.normalize();
}

function processHeightData(worldLevel, minHeight, maxHeight, sideSize, heightData) {

    let heightTextureBuffer = new Uint8ClampedArray(heightData.length)

    let heightDiff = maxHeight-minHeight;

    let lastHeight = 0;

    for (let i = 0; i < heightData.length; i++) {

            let indexR = (i)*4
            let indexG = indexR+1;
            let indexB = indexR+2;
            let indexA = indexR+3;

            let seed = indexR * 0.01;
            let scatter = Math.floor(MATH.sillyRandom(seed) * 40)

            let pixelR = heightData[indexR]

            let heightFraction = pixelR / 255;
            let height = minHeight + heightFraction*heightDiff;

            let diff = lastHeight - height;



            if (height > 0) {
                // AboveWater
                let wave = 20 + Math.floor(MATH.curveSqrt(height*0.25)) * 15

                getNormal(indexR, heightData, normVec);

                heightTextureBuffer[indexR] = (diff*50+scatter + wave + normVec.x*150);
                heightTextureBuffer[indexG] = (diff*50+scatter + wave + (normVec.y - 0.75)*50);
                heightTextureBuffer[indexB] = (diff*50+scatter + wave + normVec.z*150);
                heightTextureBuffer[indexA] = 255;

            } else {
                // Below Water
                scatter = Math.floor(scatter*heightFraction*15);
                let depth = height - minHeight;
                let shoreline = Math.min(MATH.curveQuad(Math.abs(height*0.8)), 1);

                heightTextureBuffer[indexR] = 66 + Math.floor(diff*2 + pixelR * depth*scatter*2 ) * shoreline*2;
                heightTextureBuffer[indexG] = 71 + Math.floor(diff*2 + pixelR * depth*scatter*3 ) * shoreline*3;
                heightTextureBuffer[indexB] = 98 + Math.floor(diff*2 + pixelR * depth*scatter*4 ) * shoreline*4;
                heightTextureBuffer[indexA] = 255;
            }

        lastHeight = height;
    }

    console.log("heightTextureBuffer", heightTextureBuffer)
    saveBufferAsPng(worldLevel, heightTextureBuffer);
}

function handleMessage(msg) {

    let worldLevel = msg.data.worldLevel;
    let heightData = msg.data.heightData;
    let groundData = msg.data.groundData;

    let minHeight =  msg.data.minHeight;
    let maxHeight =  msg.data.maxHeight;

    let sideHeight = Math.sqrt(heightData.length/4)
    let sideGround = Math.sqrt(groundData.length/4)

    processHeightData(worldLevel, minHeight, maxHeight, sideHeight, heightData);

    console.log("Map Msg", sideHeight, sideGround, heightData, groundData);


}


onmessage = function (oEvent) {
    handleMessage(oEvent);
};

postMessage("Loaded")