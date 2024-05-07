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
let roadPixels = [];
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

function allNeighborsAreRoad(pixelIndex, groundData, groundTextureBuffer, sideGround) {
    let indexR = pixelIndex*4
    let indexG = indexR+1;
    let indexB = indexR+2;
    let indexA = indexR+3;

    if (roadPixels.indexOf(pixelIndex - 1) === -1) {
        return false;
    }
    if (roadPixels.indexOf(pixelIndex + 1) === -1) {
        return false;
    }

    if (roadPixels.indexOf(pixelIndex+sideGround) === -1) {
        return false;
    }
    if (roadPixels.indexOf(pixelIndex+sideGround + 1) === -1) {
        return false;
    }

    if (roadPixels.indexOf(pixelIndex+sideGround - 1) === -1) {
        return false;
    }

    if (roadPixels.indexOf(pixelIndex-sideGround) === -1) {
        return false;
    }
    if (roadPixels.indexOf(pixelIndex-sideGround + 1) === -1) {
        return false;
    }

    if (roadPixels.indexOf(pixelIndex-sideGround - 1) === -1) {
        return false;
    }

    return true;
}

function markRoads(groundData, groundTextureBuffer, sideGround) {

    for (let i = 0; i < roadPixels.length; i++) {
        let onlyRoadNeighbors = allNeighborsAreRoad(roadPixels[i], groundData, groundTextureBuffer, sideGround)
       if (onlyRoadNeighbors === false) {

           let indexR = roadPixels[i]*4
           let indexG = indexR+1;
           let indexB = indexR+2;
           let indexA = indexR+3;
           groundTextureBuffer[indexR] *= 0.5;
           groundTextureBuffer[indexG] *= 0.5;
           groundTextureBuffer[indexB] *= 0.5;
       }

    }

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

        if (blue !== 0) { // Roads & Buildings
            roadPixels.push(pixelIndex);
            groundTextureBuffer[indexR] = (45 + blue * 0.1 + red * 0.1 + diff*10+scatter + slope*10 + 7 );
            groundTextureBuffer[indexG] = (35 + blue * 0.2 - red * 0.1 + diff*10+scatter + slope*10 + 5 );
            groundTextureBuffer[indexB] = (55 + blue * 0.1 - red * 0.2 + diff*4 +scatter + slope*10 + 4 );
        } else if (green === 0) { //
            let wave = 20 + Math.floor(MATH.curveSqrt(height*0.25)) * 8

            if (slope < 0.3) { // flat enough

                if (red > 27) {
                    if (red > 200) {
                        groundTextureBuffer[indexR] = (200 + diff*5+scatter*2 + wave + slope*2 - shade*0.2);
                        groundTextureBuffer[indexG] = (200 + diff*10+scatter*3 + wave + slope*6 - shade*0.4);
                        groundTextureBuffer[indexB] = (200 + diff*3+scatter*2 + slope*1 - shade*0.2);
                    } else if (red > 75 ) {
                        groundTextureBuffer[indexR] = (30 + diff*5+scatter*3  + wave + slope*2 - shade*0.2);
                        groundTextureBuffer[indexG] = (15 + diff*10+scatter*3 + wave + slope*6 - shade*0.4);
                        groundTextureBuffer[indexB] = (5  + diff*3+scatter*2 + slope*1 - shade*0.2);
                    } else {
                        groundTextureBuffer[indexR] = (40 + diff*5+scatter*1 + wave + slope*2 - shade*0.2);
                        groundTextureBuffer[indexG] = (45 + diff*10+scatter*1 + wave + slope*6 - shade*0.4);
                        groundTextureBuffer[indexB] = (20 + diff*3+scatter*1 + slope*1 - shade*0.2);
                    }

                } else { // desert
                    groundTextureBuffer[indexR] = (160 + diff*15+scatter*1 + wave + slope*22 - shade*0.1);
                    groundTextureBuffer[indexG] = (130 + diff*15+scatter*1 + wave + slope*15 - shade*0.2);
                    groundTextureBuffer[indexB] = (115 + diff*11+scatter*1  + slope*10 - shade*0.1);
                }

            } else {
                slope-=0.4;
                groundTextureBuffer[indexR] = (diff*4+scatter + wave + slope*40 - shade*0.1) - red*0.01;
                groundTextureBuffer[indexG] = (diff*4+scatter + wave + slope*40 - shade*0.1) - red*0.03;
                groundTextureBuffer[indexB] = (diff*4+scatter + wave + slope*40 - shade*0.1) - red*0.05;
            }


        } else { // Woods
            let wave = 20 + Math.floor(MATH.curveSqrt(height*0.25)) * 4

            if (green > 127) {
                groundTextureBuffer[indexR] = (1 + diff*1+scatter*1 + wave + slope*1 + shade*0.02);
                groundTextureBuffer[indexG] = (1 + diff*1+scatter*2 + wave + slope*2 + 1 + shade*0.05);
                groundTextureBuffer[indexB] = (diff*1+scatter*1 + slope*1 - shade*0.1);
            } else {
                groundTextureBuffer[indexR] = (2 + diff*5+scatter*3 + wave + slope*2 - shade*0.2);
                groundTextureBuffer[indexG] = (25 + diff*10+scatter*2 + wave + slope*6 - shade*0.4);
                groundTextureBuffer[indexB] = (2 + diff*3+scatter*2 + slope*1 - shade*0.2);
            }

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
    markRoads(groundData, groundTextureBuffer, sideGround)

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