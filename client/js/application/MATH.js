if(typeof(MATH) === "undefined") {
	MATH = {};

	if (!Math.sign) {
		Math.sign = function(x) {
			// If x is NaN, the result is NaN.
			// If x is -0, the result is -0.
			// If x is +0, the result is +0.
			// If x is negative and not -0, the result is -1.
			// If x is positive and not +0, the result is +1.
			x = +x; // convert to a number
			if (x === 0 || isNaN(x)) {
				return Number(x);
			}
			return x > 0 ? 1 : -1;
		};
	}
	
}

(function(){Math.clamp=function(a,b,c){return Math.max(b,Math.min(c,a));}})();

(function(MATH){

	var blend = 0;
	var i = 0;
	var arrayShifter = [];
	var entry;
    var remove;

	MATH.TWO_PI = 2.0 * Math.PI;
    MATH.HALF_PI = 0.5 * Math.PI;
    MATH.G = -9.81;

	MATH.sign = Math.sign;

	MATH.getNowMS = function() {
		return performance.now();
	};

	var track = [];
	MATH.trackEvent = function(statEnum, value, unitEnum, digits) {
		track[0] = statEnum;
		track[1] = value;
		track[2] = unitEnum || 0;
		track[3] = digits || 0;
		return track;
	};

	MATH.quickSplice = function(array, removeEntry) {

		remove = null;

		while (array.length) {
			entry = array.pop();
			if (entry === removeEntry) {
				remove = entry;
			} else {
				arrayShifter.push(entry);
			}
		}

		while (arrayShifter.length) {
			array.push(arrayShifter.pop());
		}

		if (!remove) {
			return false;
	//		console.log("Entry not found", array, removeEntry)
		} else {
	//		console.log("Entry found", removeEntry)
		}

		return removeEntry;
	};

	MATH.emptyArray = function(array) {
		while (array.length) {
			array.pop();
		}
	};

	MATH.isEvenNumber =function(n) {
		return Math.abs(n % 2) === 1;
	}


	MATH.gridXYfromCountAndIndex = function(count, index, store) {
        store.y = Math.floor(index / Math.sqrt(count)) - Math.sqrt(count)*0.5;
        store.x = index % Math.round(Math.sqrt(count)) - Math.sqrt(count)*0.5;
	};

	MATH.getRandomObjectEntry = function(obj) {
		let keys = Object.keys(obj);
		return obj[keys[ keys.length * Math.random() << 0]];
	};

	MATH.getRandomArrayEntry = function(array) {
		return array[Math.floor(Math.random()*array.length)]
	};

	MATH.arrayContains = function(array, entry) {
		return array.indexOf(entry) !== -1;
	};

	var idx;

	MATH.getFromArrayByKeyValue = function(array, key, value) {
		for (let idx = 0; idx < array.length; idx++) {
			if (array[idx][key] === value) {
			//	console.lof("Get ", array, idx, key)
				return array[idx];
			}
		}
	};

    MATH.getFromArrayByKey = function(array, key, value) {
        for (let idx = 0; idx < array.length; idx++) {
            if (array[idx][key]) {

                //	console.lof("Get ", array, idx, key)
                return array[idx];
            }
        }
    };

	var all;
	MATH.callAll = function(array, arg1, arg2, arg3, arg4, arg5) {
		for (all = 0; all < array.length; all++) {
			array[all](arg1, arg2, arg3, arg4, arg5);
		}
	};

	MATH.callAndClearAll = function(array, arg1, arg2, arg3, arg4, arg5) {
		while(array.length) {
			let cb = array.pop()
			setTimeout(function() {
				cb(arg1, arg2, arg3, arg4, arg5);
			},0)
		}
	};

	MATH.vectorAtPositionTowards = function(sourceVec3, targVec3, distance, storeVec3) {
		storeVec3.subVectors(targVec3, sourceVec3);
		storeVec3.normalize();
		storeVec3.multiplyScalar(distance);
		storeVec3.add(sourceVec3);
	}
	function sinWave(time, speed, amplitude) {
		return Math.sin(time * speed) * amplitude;
	}

    function cosWave(time, speed, amplitude) {
        return Math.cos(time * speed) * amplitude;
    }

    MATH.animationFunctions = {
        sinwave:  sinWave,
        coswave:  cosWave
    };

	MATH.percentify = function(number, total) {
		return Math.round((number/total) * 100);
	};

	MATH.isOddNumber = function(number) {
		return number % 2;
	};

	MATH.bufferSetValueByMapKey = function(buffer, value, map, key) {
		buffer[map.indexOf(key)] = value;
	};

    MATH.bufferGetValueByMapKey = function(buffer, map, key) {
        return buffer[map.indexOf(key)];
    };

    MATH.bufferSetValueByEnum = function(buffer, value, enm) {
        buffer[enm] = value;
    };

    MATH.bufferGetValueByEnum = function(buffer, enm) {
        return buffer[enm];
    };

    MATH.mpsToKnots = function(mps) {
        return 0.514444 * mps;
    };

    MATH.mpsToMachAtSeaLevel = function(mps) {
        return mps/340.3;
    };

    MATH.mpsAtAltToMach = function(mps, alt) {
        return MATH.valueFromCurve(alt, MATH.curves.machByAlt) * MATH.mpsToMachAtSeaLevel(mps)
    };

    MATH.airDensityAtAlt = function(alt) {
        return MATH.valueFromCurve(alt, MATH.curves.densityByAlt) * 1.22;
    };

    MATH.curves = {
		"constantOne":  [[-10, 1], [10, 1]],
        "nearOne":  [[-10, 1], [0.25, 0.92], [0.75, 1.02], [10, 1]],
		"zeroToOne":    [[0, 0], [1, 1]],
		"oneToZero":    [[0, 1], [1, 0]],
		"quickFadeOut": [[0, 1], [0.9,1], [1,   0]],
		"quickFadeIn":  [[0, 0], [0.4,0.9], [1,   1]],
		"attackIn":     [[0, 1], [0.1,0], [1,   0]],
		"centerStep":   [[0, 0], [0.25,0],[0.75,1], [1, 1]],
		"quickInOut":   [[0, 0], [0.15,1], [0.85, 1], [1, 0]],
		"posToNeg":     [[0, 1], [1,-1]],
		"negToPos":     [[0,-1], [1, 1]],
		"zeroOneZero":  [[0, 0], [0.5,1], [1,  0]],
        "lateFadeIn":   [[0, 0], [0.4,0.15], [0.7,0.33],  [0.9,0.7], [1,  1]],
        "centerPeak":   [[0, 0], [0.3, 0], [0.4, 0.25], [0.45,0.8], [0.5,1], [0.55, 0.8], [0.6 ,0.25], [0.7, 0],  [1,  0]],

        "centerBlipp":  [[-1, 0], [0.30,0.0], [0.47,0.05],  [0.49,1],   [0.53,1],    [0.57,0.05],[0.7, 0], [1, 0]],

        "doubleBlipp":  [[-1, 0], [0.12, 0], [0.17, 1], [0.21, 1],   [0.25,0.1],  [0.35,0],  [0.45,0.1], [0.48,1], [0.52,1],   [0.58,0.0], [1,  0]],

        "centerHump":   [[0, 0], [0.1,0.5],   [0.2,0.75], [0.5,1],     [0.8,0.75], [0.9,0.5], [1,  0]],
		"oneZeroOne":   [[0, 1], [0.5,0], [1,  1]],
		"growShrink":   [[0, 1], [0.5,0], [1, -2]],
		"shrink":   	[[0, -0.3], [0.3, -1]],
        "machByAlt":    [[0, 1], [12200, 0.867], [12200, 0.867], [20000, 0.867], [32000, 0.88]],
        "densityByAlt": [[0, 1], [95, 0.75], [200, 0.52], [16000, 0.1], [20000, 0.05], [40000, 0.025], [80000, 0.01], [120000, 0]]
	};


    MATH.curveSigmoid = function(t) {
        return 1 / (1 + Math.exp(6 - t*12));
    };

    MATH.curveSigmoidMirrored = function(value) {
        return MATH.curveSigmoid(Math.abs(value)) * MATH.sign(value)
    };

    MATH.curveSqrt = function(value) {
        return Math.sqrt(Math.abs(value)) * MATH.sign(value)
    };

    MATH.curveQuad = function(value) {
        return value*value * MATH.sign(value)
    };


    MATH.curveCube = function(value) {
        return value*value*value
    };


    MATH.CurveState = function(curve, amplitude) {
		this.curve = curve || MATH.curves.oneToZero;
		this.amplitude = amplitude || 1;
		this.fraction = 0;
		this.value = 0
	};

	MATH.CurveState.prototype.setAmplitude = function(value) {
		this.amplitude = value;
	};

	MATH.CurveState.prototype.setCurve = function(curve) {
		this.curve = curve;
	};

	MATH.CurveState.prototype.amplitudeFromFraction = function(fraction) {
		this.fraction = fraction;
		this.value = MATH.valueFromCurve(this.fraction * (this.curve.length-1), this.curve);
		return this.amplitude*this.value;
	};


        let calcVec1 = null;
    MATH.interpolateVec3FromTo = function(startVec3, endVec3, fraction, storeVec3, mathCurveFuction) {
        if (!calcVec1) calcVec1 = new THREE.Vector3();
        calcVec1.copy(endVec3);
        calcVec1.sub(startVec3);
        if (typeof(mathCurveFuction) === 'string') {
            fraction = MATH[mathCurveFuction](fraction);
        }
        calcVec1.multiplyScalar(fraction);
        calcVec1.add(startVec3);
        storeVec3.copy(calcVec1);

    };

	MATH.interpolateFromTo = function(start, end, fraction) {
		return start + (end-start)*fraction;
	};


	MATH.calcFraction = function(start, end, current) {
		return (current-start) / (end-start);
	};


	MATH.valueIsBetween = function(value, min, max) {
        return value > min && value < max
	};

	var half32BitInt = 1047483647;
    var bigSafeValue = 53372036850;

    MATH.bigSafeValue = function() {
        return bigSafeValue;
    };

	MATH.safeInt = function(value) {
	    if (isNaN(value)) return 0;
	    return MATH.clamp(value, -bigSafeValue, bigSafeValue);
    };

	MATH.randomVector = function(vec) {
		vec.x = MATH.randomBetween(-1, 1);
		vec.y = MATH.randomBetween(-1, 1);
		vec.z = MATH.randomBetween(-1, 1);
		vec.normalize();
	};

    MATH.safeForceVector = function(vec) {
        vec.x = MATH.safeInt(vec.x);
        vec.y = MATH.safeInt(vec.y);
        vec.z = MATH.safeInt(vec.z);
    };

	MATH.remainder = function(float) {
		return float - (Math.floor(float)) 	
	};
	
	MATH.randomBetween = function(min, max) {
		return min + Math.random() * (max-min);
	};

	MATH.nearestHigherPowerOfTwo = function (value) {
		return Math.floor(Math.pow(2, Math.ceil(Math.log(value) / Math.log(2))));
	};
	
	MATH.getInterpolatedInCurveAboveIndex = function(value, curve, index) {
		return curve[index][1] + (value - curve[index][0]) / (curve[index+1][0] - curve[index][0])*(curve[index+1][1]-curve[index][1]);
	};


	MATH.triangleArea = function (t1, t2, t3) {
		return Math.abs(t1.x * t2.y + t2.x * t3.y + t3.x * t1.y
				- t2.y * t3.x - t3.y * t1.x - t1.y * t2.x) / 2;
	};


	MATH.barycentricInterpolation = function (t1, t2, t3, p) {
		var t1Area = this.triangleArea(t2, t3, p);
		var t2Area = this.triangleArea(t1, t3, p);
		var t3Area = this.triangleArea(t1, t2, p);

		// assuming the point is inside the triangle
		var totalArea = t1Area + t2Area + t3Area;
		if (!totalArea) {

			if (p[0] === t1[0] && p[2] === t1[2]) {
				return t1;
			} else if (p[0] === t2[0] && p[2] === t2[2]) {
				return t2;
			} else if (p[0] === t3[0] && p[2] === t3[2]) {
				return t3;
			}
		}

		p.z = (t1Area * t1.z + t2Area * t2.z + t3Area * t3.z) / totalArea;
		return p
	};

	MATH.getAt = function(array1d, segments, x, y) {

		var yFactor = (y) * (segments+1);

		var idx = (yFactor + x);
//    console.log(y, yFactor, xFactor, idx);
		return array1d[idx]
	};

	var p1  = {x:0, y:0, z:0};
	var p2  = {x:0, y:0, z:0};
	var p3  = {x:0, y:0, z:0};


	var setTri = function(tri, x, y, z) {
		tri.x = x;
		tri.y = y;
		tri.z = z
	};
	
	
	
	var points = [];

	MATH.getTriangleAt = function(array1d, segments, x, y) {

		var xc = Math.ceil(x);
		var xf = Math.floor(x);
		var yc = Math.ceil(y);
		var yf = Math.floor(y);

		var fracX = x - xf;
		var fracY = y - yf;



		p1.x = xf;
		p1.y = yc;

		//   console.log(xf, yc);
		p1.z = this.getAt(array1d, segments, xf, yc);


		setTri(p1, xf, yc, this.getAt(array1d, segments,xf, yc));
		setTri(p2, xc, yf, this.getAt(array1d, segments,xc, yf));


		if (fracX < 1-fracY) {
			setTri(p3,xf,yf,this.getAt(array1d, segments,xf, yf));
		} else {
			setTri(p3, xc, yc, this.getAt(array1d, segments,xc, yc));
		}

		points[0] = p1;
		points[1] = p2;
		points[2] = p3;
		return points;
	};

	MATH.valueFromCurve = function(value, curve) {
		for (i = 0; i < curve.length; i++) {
			if (!curve[i+1]) {
			//	console.log("Curve out end value", value, curve.length-1, curve[curve.length-1][1]);
				return curve[curve.length-1][1];
			}
			if (curve[i+1][0] >= value) return MATH.getInterpolatedInCurveAboveIndex(value, curve, i)
		}
		console.log("Curve out of bounds", curve.length-1 , value);
		return curve[curve.length-1][1];
	};

	MATH.blendArray = function(from, to, frac, store) {
		for (i = 0; i < store.length; i++) {
			store[i] = (1-frac)*from[i] + frac*to[i];
		}
	};

    MATH.decimalify = function(value, scale) {
		return Math.round(value*scale) / scale;
    };


    MATH.sphereDisplacement = function(radius, depth) {
    	if (depth < radius) return 0;
        if (depth > radius*2) depth = radius*2;
        return  1/3 * Math.PI * depth*depth * (3*radius-depth)
    };

	MATH.curveBlendArray = function(value, curve, from, to, store) {
		blend = MATH.valueFromCurve(value, curve);
		MATH.blendArray(from, to, blend, store);
	};
	
	MATH.moduloPositive = function (value, size) {
		var wrappedValue = value % size;
		wrappedValue += wrappedValue < 0 ? size : 0;
		return wrappedValue;
	};

    MATH.modulo = function (value, limit) {
        return value % limit;
    };

    MATH.nearestAngle = function(angle) {
        if (angle > Math.PI) {
            angle -= MATH.TWO_PI;
        } else if (angle < 0) {
            angle += MATH.TWO_PI;
        }
        return angle;
    };

	MATH.lineDistance = function(fromX, fromY, toX, toY) {
		return Math.sqrt((fromX - toX)*(fromX - toX) + (fromY - toY)*(fromY - toY));
	};

	MATH.sillyRandom = function(seed) {
		return MATH.remainder(Math.sin(seed) * 9999.991 + Math.cos(seed));
	};

	MATH.sillyRandomBetween = function(min, max, seed) {
		return MATH.sillyRandom(seed)*(max-min) + min;
	};

	MATH.randomRotateObj = function(obj3d, rotArray, seed) {
		obj3d.rotateX((MATH.sillyRandom(seed)-0.5) * rotArray[0] * 2)
		obj3d.rotateY((MATH.sillyRandom(seed+1)-0.5) * rotArray[1] *2)
		obj3d.rotateZ((MATH.sillyRandom(seed+2)-0.5) * rotArray[2] *2)
	}

	MATH.rotateObj = function(obj3d, rotArray) {
		obj3d.rotateX(rotArray[0])
		obj3d.rotateY(rotArray[1])
		obj3d.rotateZ(rotArray[2])
	}

	MATH.angleInsideCircle = function(angle) {
		if (angle < -Math.PI) angle+= MATH.TWO_PI;
		if (angle > Math.PI) angle-= MATH.TWO_PI;
		return angle;
	};

	MATH.subAngles = function(a, b) {
		return Math.atan2(Math.sin(a-b), Math.cos(a-b));
	};
	
	MATH.radialLerp = function(a, b, w) {
		var cs = (1-w)*Math.cos(a) + w*Math.cos(b);
		var sn = (1-w)*Math.sin(a) + w*Math.sin(b);
		return Math.atan2(sn,cs);
	};

	MATH.addAngles = function(a, b) {
		return Math.atan2(Math.sin(a+b), Math.cos(a+b));
	};


	MATH.radialToVectorXY = function(angle, distance, store) {
		store.x = Math.cos(angle)*distance;
		store.y = Math.sin(angle)*distance;
	};

	MATH.spreadVector = function(vec, spreadV) {
		vec.x += spreadV.x * (Math.random()-0.5);
		vec.y += spreadV.y * (Math.random()-0.5);
		vec.z += spreadV.z * (Math.random()-0.5);
	};

	MATH.distanceBetween = function(vec3a, vec3b) {
		if (!calcVec1) calcVec1 = new THREE.Vector3();
		calcVec1.subVectors(vec3a, vec3b);
		return calcVec1.length();
	}

    MATH.expandVector = function(vec, expand) {
        vec.x += expand*Math.sign(vec.x);
        vec.y += expand*Math.sign(vec.y);
        vec.z += expand*Math.sign(vec.z);
    };

	MATH.vec3FromArray = function(vec3, array) {
		vec3.x = array[0];
		vec3.y = array[1];
		vec3.z = array[2];
	}

	MATH.vectorXZToAngleAxisY = function(vec) {
		return Math.atan2(vec.x, vec.z);
	};

	MATH.vectorXYToAngleAxisZ = function(vec) {
		return -Math.atan2(vec.x, vec.y);
	};

    MATH.angleZFromVectorToVector = function(fromVec, toVec) {
        return Math.atan2(toVec.y-fromVec.y, toVec.x-fromVec.x) // + Math.PI*0.5;
    };

	MATH.vectorYZToAngleAxisX = function(vec) {
		return Math.atan2(vec.getY(), vec.getZ()) + Math.PI;
	};
	
	
	MATH.applyNormalVectorToPitch = function(normalVec, upVec) {
		upVec.setX(MATH.subAngles(upVec.getX() - normalVec.getX()));
	};

	MATH.applyNormalVectorToRoll = function(normalVec, tiltVec) {
		tiltVec.setZ(MATH.subAngles(tiltVec.getZ(), normalVec.getZ()));
	};

	
	MATH.radialClamp = function(value, min, max) {

		var zero = (min + max)/2 + ((max > min) ? Math.PI : 0);
		var _value = MATH.moduloPositive(value - zero, MATH.TWO_PI);
		var _min = MATH.moduloPositive(min - zero, MATH.TWO_PI);
		var _max = MATH.moduloPositive(max - zero, MATH.TWO_PI);

		if (value < 0 && min > 0) { min -= MATH.TWO_PI; }
		else if (value > 0 && min < 0) { min += MATH.TWO_PI; }
		if (value > MATH.TWO_PI && max < MATH.TWO_PI) { max += MATH.TWO_PI; }

		return _value < _min ? min : _value > _max ? max : value;
	};

    MATH.clamp = function(value, min, max) {
        return value < min ? min : value > max ? max : value;
    };

	MATH.expand = function(value, min, max) {
		if (value > min && value < max) {
			return min;
		}
		return value;
	};

    var mag;

    MATH.pitchFromQuaternion = function(q) {
        mag = Math.sqrt(q.w*q.w + q.x*q.x);
        return 2*Math.acos(q.x / mag);
    };

    MATH.yawFromQuaternion = function(q) {
        mag = Math.sqrt(q.w*q.w + q.y*q.y);
        return 2*Math.acos(q.y / mag);
    };

    MATH.rollFromQuaternion = function(q) {
        mag = Math.sqrt(q.w*q.w + q.z*q.z);
        return -(2*Math.acos(q.z / mag)-Math.PI);
    };


    MATH.horizonAttitudeFromQuaternion = function(q) {

        calcVec.set(0, 0, 1);
        calcVec.applyQuaternion(q);
        // calcVec.y = 0;
        // calcVec.normalize();
        return calcVec.y * Math.PI // Math.atan2(calcVec.x, calcVec.y);

        return Math.atan2(2*q.x*q.w - 2*q.y*q.z, 1 - 2*q.x*q.x - 2*q.z*q.z);
    };

    MATH.compassAttitudeFromQuaternion = function(q) {

        calcVec.set(0, 0, 1);
        calcVec.applyQuaternion(q);
        // calcVec.y = 0;
        // calcVec.normalize();
        return calcVec.y * Math.PI // Math.atan2(calcVec.x, calcVec.y);

        return Math.atan2(2*q.x*q.w - 2*q.y*q.z, 1 - 2*q.x*q.x - 2*q.z*q.z);
    };

    MATH.rollAttitudeFromQuaternion = function(q) {
        var mag = Math.sqrt(q.w*q.w + q.z*q.z);
        return 2*Math.acos(-q.z / mag) - Math.PI;
    };


})(MATH);