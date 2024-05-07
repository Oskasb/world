import {MATH} from "../MATH.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import {Triangle} from "../../../libs/three/math/Triangle.js";


let tempVec = new Vector3()
let normVec = new Vector3()
let triangle = new Triangle()
let lastHeight = 0;
let heightDiff;
let minHeight;
let maxHeight;

triangle.a.x =  0;
triangle.a.z =  0;

triangle.b.x =  1;
triangle.b.z =  0;

triangle.c.x =  0;
triangle.c.z =  1;


function saveBufferAsPng(worldLevel, buffer) {
    postMessage({worldLevel:worldLevel, buffer:buffer})
}


function getNormal(pixel, buffer, normStore) {
    let side = Math.sqrt(buffer.length/4)
    triangle.a.y = buffer[pixel];

    if (pixel+4 < buffer.length) {
        triangle.b.y = buffer[pixel+4];
    } else {
        triangle.b.y = buffer[pixel];
    }

    if (pixel+side < buffer.length) {
        triangle.c.y = buffer[pixel+side*4]
    } else {
        triangle.c.y = buffer[pixel]
    }
    triangle.getNormal(normStore)

}

function drawGroundTexturePixel(pixelIndex, height, slope, diff, shade, groundData, groundTextureBuffer) {

    let indexR = pixelIndex*4
    let indexG = indexR+1;
    let indexB = indexR+2;
    let indexA = indexR+3;

    let red = groundData[indexR];
    let green = groundData[indexG];
    let blue = groundData[indexB];
    let alpha = groundData[indexA];

    let seed = indexR * 0.01;
    let scatter = Math.floor(MATH.sillyRandom(seed) * 40)

    if (height > 0) {
        // AboveWater

        if (blue !== 0) {
            groundTextureBuffer[indexR] = (blue * 0.2 + diff*10+scatter + slope*20 + 50 - shade*0.1);
            groundTextureBuffer[indexG] = (blue * 0.2 + diff*10+scatter + slope*20 + 50 - shade*0.1);
            groundTextureBuffer[indexB] = (blue * 0.2 + diff*10+scatter + slope*20 + 80 - shade*0.1);
        } else if (green === 0) { //
            let wave = 20 + Math.floor(MATH.curveSqrt(height*0.25)) * 15

            if (slope < 0.4) {
                groundTextureBuffer[indexR] = (20 + diff*5+scatter*2 + wave + slope*2 - shade*0.1);
                groundTextureBuffer[indexG] = (10 + diff*20+scatter*3 + wave + slope*5 + 40 - shade*0.1);
                groundTextureBuffer[indexB] = (diff*5+scatter*2 + wave + slope*2 - shade*0.1);
            } else {
                slope-=0.4;
                groundTextureBuffer[indexR] = (diff*4+scatter + wave + slope*50 - shade*0.1);
                groundTextureBuffer[indexG] = (diff*4+scatter + wave + slope*50 - shade*0.1);
                groundTextureBuffer[indexB] = (diff*4+scatter + wave + slope*50 - shade*0.1);
            }


        } else {
            let wave = 20 + Math.floor(MATH.curveSqrt(height*0.25)) * 4

            groundTextureBuffer[indexR] = (4 + diff*2+scatter*2 + wave + slope*1 - shade*0.1);
            groundTextureBuffer[indexG] = (4 + diff*5+scatter*4 + wave + slope*2 + 10 - shade*0.1);
            groundTextureBuffer[indexB] = (diff*1+scatter*1 + slope*1 - shade*0.1);
        }

    } else {
        // Below Water
        let depth = height - minHeight;

        scatter = Math.floor(scatter*depth*10);

        let depthFactor = depth*scatter * 0.05
        let slopeFactor = depthFactor*slope

        groundTextureBuffer[indexR] = 66 + Math.floor(diff * 1 + depthFactor*0.5 + slopeFactor * 0.8 ) ;
        groundTextureBuffer[indexG] = 71 + Math.floor(diff * 2 + depthFactor + slopeFactor * 1.5 );
        groundTextureBuffer[indexB] = 98 + Math.floor(diff * 2 + depthFactor*1.4 + slopeFactor );
    }
    groundTextureBuffer[indexA] = 255;
}

function processHeightPixel(pxx, pxy, heightData, sideHeight, groundData, sideGround, groundTextureBuffer) {

    let pixelIndex = pxx + pxy*sideHeight;

    let indexR = pixelIndex*4
    let indexG = indexR+1;
    let indexB = indexR+2;
    let indexA = indexR+3;

    let pixelR = heightData[indexR];
    let pixelB = heightData[indexB];

    let heightFraction = pixelR / 255;
    let height = minHeight + heightFraction*heightDiff;

    let diff = lastHeight - height;

    getNormal(indexR, heightData, normVec);

    let slope = 1 - Math.abs( normVec.y );

    let scaledPixelA = pxx*2 + pxy*2*sideGround;
    let scaledPixelB = pxx*2 + pxy*2*sideGround+1;
    let scaledPixelC = pxx*2 + (pxy*2+1)*sideGround;
    let scaledPixelD = pxx*2 + (pxy*2+1)*sideGround+1;

    drawGroundTexturePixel(scaledPixelA, height, slope, diff, pixelB, groundData, groundTextureBuffer);
    drawGroundTexturePixel(scaledPixelB, height, slope, diff, pixelB, groundData, groundTextureBuffer);
    drawGroundTexturePixel(scaledPixelC, height, slope, diff, pixelB, groundData, groundTextureBuffer);
    drawGroundTexturePixel(scaledPixelD, height, slope, diff, pixelB, groundData, groundTextureBuffer);

    lastHeight = height;

}

function processHeightData(worldLevel, minHeight, maxHeight, heightData, groundData) {

    let sideHeight = Math.sqrt(heightData.length/4)
    let sideGround = Math.sqrt(groundData.length/4)

    let groundTextureBuffer = new Uint8ClampedArray(groundData.length)
    heightDiff = maxHeight-minHeight;
    lastHeight = 0;

    for (let i = 0; i < sideHeight; i++) {
        for (let j = 0; j < sideHeight; j++) {
            processHeightPixel(i, j, heightData, sideHeight, groundData, sideGround, groundTextureBuffer);
        }


    }

    console.log("heightTextureBuffer", groundTextureBuffer)
    saveBufferAsPng(worldLevel, groundTextureBuffer);
}

function handleMessage(msg) {

    let worldLevel = msg.data.worldLevel;
    let heightData = msg.data.heightData;
    let groundData = msg.data.groundData;

    minHeight =  msg.data.minHeight;
    maxHeight =  msg.data.maxHeight;



    processHeightData(worldLevel, minHeight, maxHeight, heightData, groundData);

   // console.log("Map Msg", sideHeight, sideGround, heightData, groundData);


}


onmessage = function (oEvent) {
    handleMessage(oEvent);
};

postMessage("Loaded")