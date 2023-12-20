
(function(){Math.clamp=function(a,b,c){return Math.max(b,Math.min(c,a));}})();

function sinWave(time, speed, amplitude) {
	return Math.sin(time * speed) * amplitude;
}

function cosWave(time, speed, amplitude) {
	return Math.cos(time * speed) * amplitude;
}


let calcVec1 = null;

let half32BitInt = 1047483647;
let bigSafeValue = 53372036850;
let tempRandVec = null;
let p1  = {x:0, y:0, z:0};
let p2  = {x:0, y:0, z:0};
let p3  = {x:0, y:0, z:0};
let setTri = function(tri, x, y, z) {
	tri.x = x;
	tri.y = y;
	tri.z = z
};

let points = [];
let mag;
let calcVec = null;
let euler = null;
let progString = ''

let blend = 0;
let i = 0;
let idx;
let arrayShifter = [];
let entry;
let remove;
let track = [];
let rgba = {};

let	curves = {
		"constantOne":  [[-10, 1], [10, 1]],
		"nearOne":  [[-10, 1], [0.25, 0.92], [0.75, 1.02], [10, 1]],
		"zeroToOne":    [[0, 0], [1, 1]],
		"oneToZero":    [[0, 1], [1, 0]],
		"quickFadeOut": [[0, 1], [0.9,1], [1,   0]],
		"quickFadeIn":  [[0, 0], [0.4,0.9], [1,   1]],
		"attackIn":     [[0, 1], [0.1,0], [1,   0]],
		"centerStep":   [[0, 0], [0.25,0],[0.75,1], [1, 1]],

		"edgeStep":     [[0, 0], [0.35,0.45],[0.65,0.55], [1, 1]],
		"quickInOut":   [[0, 0], [0.15,1], [0.85, 1], [1, 0]],
		"posToNeg":     [[0, 1], [1,-1]],
		"negToPos":     [[0,-1], [1, 1]],
		"zeroOneZero":  [[0, 0], [0.5,1], [1,  0]],
		"lateFadeIn":   [[0, 0], [0.4,0.15], [0.7,0.33],  [0.9,0.7], [1,  1]],
		"centerPeak":   [[0, 0], [0.3, 0], [0.4, 0.25], [0.45,0.8], [0.5,1], [0.55, 0.8], [0.6 ,0.25], [0.7, 0],  [1,  0]],

		"radialFade":   [[-3.14, 1], [-2.7,0.75], [-2,0.2], [0,0],[2,0.2], [2.7,0.75], [3.14,1]],
		"unitFade":     [[-1, 1], [-0.7,0.75], [-0.5,0.2], [0,0],[0.5,0.2], [0.7,0.75], [1,1]],
		"unitFlip":     [[-1, -1], [-0.1,-1],[0.1,1], [1, 1]],
		"halfUnitFade":     [[-0.5, 1], [-0.4,0.75], [-0.25,0.1], [0,0],[0.25,0.1], [0.4,0.75], [0.5,1]],
		"centerBlipp":  [[-1, 0], [0.30,0.0], [0.47,0.05],  [0.49,1],   [0.53,1],    [0.57,0.05],[0.7, 0], [1, 0]],

		"doubleBlipp":  [[-1, 0], [0.12, 0], [0.17, 1], [0.21, 1],   [0.25,0.1],  [0.35,0],  [0.45,0.1], [0.48,1], [0.52,1],   [0.58,0.0], [1,  0]],

		"centerHump":   [[0, 0], [0.1,0.5],   [0.2,0.75], [0.5,1],     [0.8,0.75], [0.9,0.5], [1,  0]],
		"oneZeroOne":   [[0, 1], [0.5,0], [1,  1]],
		"growShrink":   [[0, 1], [0.5,0], [1, -2]],
		"shrink":   	[[0, -0.3], [0.3, -1]],
		"machByAlt":    [[0, 1], [12200, 0.867], [12200, 0.867], [20000, 0.867], [32000, 0.88]],
		"densityByAlt": [[0.1, 2.0], [1, 1.6], [4, 1.55], [15, 1.4], [100, 0.6],  [300, 0.5], [120000, 0]]
	};


class MATH {
	constructor() {
		if (!Math.sign) {
			Math.sign = function (x) {
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

		this.curves = curves;
		this.TWO_PI = 2.0 * Math.PI;
		this.HALF_PI = 0.5 * Math.PI;
		this.G = -9.81;
		this.sign = Math.sign;


	}

		getNowMS = function() {
			return performance.now();
		};


		trackEvent = function(statEnum, value, unitEnum, digits) {
			track[0] = statEnum;
			track[1] = value;
			track[2] = unitEnum || 0;
			track[3] = digits || 0;
			return track;
		};

		quickSplice = function(array, removeEntry) {

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

		splice = function(array, removeEntry) {
			let idx = array.indexOf(removeEntry)
			if (idx === -1) {
				return false;
			}
			array.splice(idx, 1)

			return removeEntry
		};

		emptyArray = function(array) {
			while (array.length) {
				array.pop();
			}
		};

		isEvenNumber =function(n) {
			return Math.abs(n % 2) === 1;
		}



		gridXYfromCountAndIndex = function(count, index, store) {
			store.y = Math.floor(index / Math.sqrt(count)) - Math.sqrt(count)*0.5;
			store.x = index % Math.round(Math.sqrt(count)) - Math.sqrt(count)*0.5;
		};

		getRandomObjectEntry = function(obj) {
			let keys = Object.keys(obj);
			return obj[keys[ keys.length * Math.random() << 0]];
		};

		getRandomArrayEntry = function(array) {
			return array[Math.floor(Math.random()*array.length)]
		};

		getSillyRandomArrayEntry = function(array, seed) {
			return array[Math.floor(this.sillyRandom(seed)*array.length)]
		};


		sillyRandomBetweenColors = function(rgba1, rgba2, seed, store) {
			if (!store) store = rgba;
			store.r = this.sillyRandomBetween(rgba1[0], rgba2[0], seed);
			store.g = this.sillyRandomBetween(rgba1[1], rgba2[1], seed+1);
			store.b = this.sillyRandomBetween(rgba1[2], rgba2[2], seed+2);
			store.a = this.sillyRandomBetween(rgba1[3], rgba2[3], seed+3);
			return store;
		}

		rgbaToXYZW = function(rgba, store) {
			store.x = rgba.r;
			store.y = rgba.g;
			store.z = rgba.b;
			store.w = rgba.a;
		}

		arrayContains = function(array, entry) {
			return array.indexOf(entry) !== -1;
		};



		getFromArrayByKeyValue = function(array, key, value) {
			for (let idx = 0; idx < array.length; idx++) {
				if (array[idx][key] === value) {
					//	console.lof("Get ", array, idx, key)
					return array[idx];
				}
			}
		};

		getFromArrayByKey = function(array, key, value) {
			for (let idx = 0; idx < array.length; idx++) {
				if (array[idx][key]) {

					//	console.lof("Get ", array, idx, key)
					return array[idx];
				}
			}
		};

		callAll = function(array, arg1, arg2, arg3, arg4, arg5) {
			for (let all = 0; all < array.length; all++) {
				array[all](arg1, arg2, arg3, arg4, arg5);
			}
		};


		forAll = function(array, func, arg1, arg2, arg3, arg4, arg5) {
			for (let all = 0; all < array.length; all++) {
				func(array[all], arg1, arg2, arg3, arg4, arg5);
			}
		};

		callAndClearAll = function(array, arg1, arg2, arg3, arg4, arg5) {
			while(array.length) {
				let cb = array.pop()
				cb(arg1, arg2, arg3, arg4, arg5);
			}

		};

		vectorAtPositionTowards = function(sourceVec3, targVec3, distance, storeVec3) {
			storeVec3.subVectors(targVec3, sourceVec3);
			storeVec3.normalize();
			storeVec3.multiplyScalar(distance);
			storeVec3.add(sourceVec3);
		}


		animationFunctions = {
			sinwave:  sinWave,
			coswave:  cosWave
		};

		percentify = function(number, total) {
			return Math.round((number/total) * 100);
		};


		isOddNumber = function(number) {
			return number % 2;
		};

		bufferSetValueByMapKey = function(buffer, value, map, key) {
			buffer[map.indexOf(key)] = value;
		};

		bufferGetValueByMapKey = function(buffer, map, key) {
			return buffer[map.indexOf(key)];
		};

		bufferSetValueByEnum = function(buffer, value, enm) {
			buffer[enm] = value;
		};

		bufferGetValueByEnum = function(buffer, enm) {
			return buffer[enm];
		};

		mpsToKnots = function(mps) {
			return 0.514444 * mps;
		};

		mpsToMachAtSeaLevel = function(mps) {
			return mps/340.3;
		};

		mpsAtAltToMach = function(mps, alt) {
			return this.valueFromCurve(alt, curves.machByAlt) * this.mpsToMachAtSeaLevel(mps)
		};

		airDensityAtAlt = function(alt) {
			return this.valueFromCurve(alt, curves.densityByAlt) * 1.0;
		};


		curveSigmoid = function(t) {
			return 1 / (1 + Math.exp(6 - t*12));
		};

		curveSigmoidInverted = function(t) {
			return 1/this.curveSigmoid(t);
		}

		curveEdge = function(t) {
			return this.curveSin(t) * 0.5 + t * 0.5;
		};

		curveLinear = function(t) {
			return t;
		};

		curveSin = function(t) {
			return Math.sin(t*this.HALF_PI);
		};

		curveCos = function(t) {
			return 1-Math.cos(t*this.HALF_PI);
		};

		curveSigmoidMirrored = function(value) {
			return this.curveSigmoid(Math.abs(value)) * this.sign(value)
		};

		curveSqrt = function(value) {
			return Math.sqrt(Math.abs(value)) * this.sign(value)
		};

		curveQuad = function(value) {
			return value*value * this.sign(value)
		};

		curveParabola = function(value) {
			return this.curveQuad( (2 * (value -0.5)) )
		}

		curveParabolaInverted = function(value) {
			return 1 - this.curveParabola(value);
		}

		curveCube = function(value) {
			return value*value*value
		};


		CurveState = function(curve, amplitude) {
			this.curve = curve || curves.oneToZero;
			this.amplitude = amplitude || 1;
			this.fraction = 0;
			this.value = 0

			this.setAmplitude = function(value) {
				this.amplitude = value;
			}.bind(this);

			this.setCurve = function(curve) {
				this.curve = curve;
			}.bind(this);

			this.amplitudeFromFraction = function(fraction) {
				this.fraction = fraction;
				this.value = this.valueFromCurve(this.fraction * (this.curve.length-1), this.curve);
				return this.amplitude*this.value;
			}.bind(this);

		};





		interpolateVec3FromTo = function(startVec3, endVec3, fraction, storeVec3, mathCurveFuction) {
			if (!calcVec1) calcVec1 = new THREE.Vector3();
			calcVec1.copy(endVec3);
			calcVec1.sub(startVec3);
			if (typeof(mathCurveFuction) === 'string') {
				fraction = this[mathCurveFuction](fraction);
			}
			calcVec1.multiplyScalar(fraction);
			calcVec1.add(startVec3);
			storeVec3.copy(calcVec1);

		};

		interpolateFromTo = function(start, end, fraction) {
			return start + (end-start)*fraction;
		};


		calcFraction = function(start, end, current) {
			if (start === end) {
				return 1;
			}
			return (current-start) / (end-start);
		};


		valueIsBetween = function(value, min, max) {
			return value >= min && value <= max
		};



		bigSafeValue = function() {
			return bigSafeValue;
		};

		safeInt = function(value) {
			if (isNaN(value)) return 0;
			return this.clamp(value, -bigSafeValue, bigSafeValue);
		};


		randomVector = function(vec) {
			if (!tempRandVec) tempRandVec =  new THREE.Vector3()
			if (!vec) vec=tempRandVec;
			vec.x = this.randomBetween(-1, 1);
			vec.y = this.randomBetween(-1, 1);
			vec.z = this.randomBetween(-1, 1);
			vec.normalize();
			return vec;
		};

		safeForceVector = function(vec) {
			vec.x = this.safeInt(vec.x);
			vec.y = this.safeInt(vec.y);
			vec.z = this.safeInt(vec.z);
		};

		remainder = function(float) {
			return float - (Math.floor(float))
		};

		randomBetween = function(min, max) {
			return min + Math.random() * (max-min);
		};

		nearestHigherPowerOfTwo = function (value) {
			return Math.floor(Math.pow(2, Math.ceil(Math.log(value) / Math.log(2))));
		};

		getInterpolatedInCurveAboveIndex = function(value, curve, index) {
			return curve[index][1] + (value - curve[index][0]) / (curve[index+1][0] - curve[index][0])*(curve[index+1][1]-curve[index][1]);
		};


		triangleArea = function (t1, t2, t3) {
			return Math.abs(t1.x * t2.y + t2.x * t3.y + t3.x * t1.y
				- t2.y * t3.x - t3.y * t1.x - t1.y * t2.x) / 2;
		};


		barycentricInterpolation = function (t1, t2, t3, p) {
			let t1Area = this.triangleArea(t2, t3, p);
			let t2Area = this.triangleArea(t1, t3, p);
			let t3Area = this.triangleArea(t1, t2, p);

			// assuming the point is inside the triangle
			let totalArea = t1Area + t2Area + t3Area;
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

		getAt = function(array1d, segments, x, y) {

			var yFactor = (y) * (segments+1);

			let idx = (yFactor + x);
//    console.log(y, yFactor, xFactor, idx);
			return array1d[idx]
		};


		getTriangleAt = function(array1d, segments, x, y) {

			let xc = Math.ceil(x);
			let xf = Math.floor(x);
			let yc = Math.ceil(y);
			let yf = Math.floor(y);

			let fracX = x - xf;
			let fracY = y - yf;



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

		valueFromCurve = function(value, curve) {
			for (i = 0; i < curve.length; i++) {
				if (!curve[i+1]) {
					//	console.log("Curve out end value", value, curve.length-1, curve[curve.length-1][1]);
					return curve[curve.length-1][1];
				}
				if (curve[i+1][0] >= value) return this.getInterpolatedInCurveAboveIndex(value, curve, i)
			}
			console.log("Curve out of bounds", curve.length-1 , value);
			return curve[curve.length-1][1];
		};

		blendArray = function(from, to, frac, store) {
			for (i = 0; i < store.length; i++) {
				store[i] = (1-frac)*from[i] + frac*to[i];
			}
		};

		decimalify = function(value, scale) {
			return Math.round(value*scale) / scale;
		};


		sphereDisplacement = function(radius, depth) {
			if (depth < radius) return 0;
			if (depth > radius*2) depth = radius*2;
			return  1/3 * Math.PI * depth*depth * (3*radius-depth)
		};

		curveBlendArray = function(value, curve, from, to, store) {
			blend = this.valueFromCurve(value, curve);
			this.blendArray(from, to, blend, store);
		};

		moduloPositive = function (value, size) {
			var wrappedValue = value % size;
			wrappedValue += wrappedValue < 0 ? size : 0;
			return wrappedValue;
		};

		modulo = function (value, limit) {
			return value % limit;
		};

		nearestAngle = function(angle) {
			if (angle > Math.PI) {
				angle -= MATH.TWO_PI;
			} else if (angle < 0) {
				angle += MATH.TWO_PI;
			}
			return angle;
		};

		lineDistance = function(fromX, fromY, toX, toY) {
			return Math.sqrt((fromX - toX)*(fromX - toX) + (fromY - toY)*(fromY - toY));
		};

		sillyRandom = function(seed) {
			return this.remainder(Math.sin(seed) * 9999.991 + Math.cos(seed));
		};

		sillyRandomBetween = function(min, max, seed) {
			return this.sillyRandom(seed)*(max-min) + min;
		};

		randomRotateObj = function(obj3d, rotArray, seed) {
			obj3d.rotateX((this.sillyRandom(seed)-0.5) * rotArray[0] * 2)
			obj3d.rotateY((this.sillyRandom(seed+1)-0.5) * rotArray[1] *2)
			obj3d.rotateZ((this.sillyRandom(seed+2)-0.5) * rotArray[2] *2)
		}

		rotateObj = function(obj3d, rotArray) {
			obj3d.rotateX(rotArray[0])
			obj3d.rotateY(rotArray[1])
			obj3d.rotateZ(rotArray[2])
		}

		angleInsideCircle = function(angle) {
			if (angle < -Math.PI) angle+= this.TWO_PI;
			if (angle > Math.PI) angle-= this.TWO_PI;
			return angle;
		};


		numberToDigits = function(current, digits, min) {
			progString = ''
			if (typeof(digits) === 'number') {
				if (digits === 0) {
					progString += Math.round(current);
				} else {
					progString += parseFloat((current).toFixed(digits)).toString().replace(/\.([0-9])$/, ".$"+digits)
					if (progString.length < digits + min) {
						progString += '.';
						for (let i = 0; i < digits; i++) {
							progString+= '0';
						}
					}
				}
			} else {
				progString = ''+current;
			}

			return progString;
		};

		wrapValue = function(wrapRange, value) {
			return this.clamp((wrapRange+value) % wrapRange, 0, wrapRange)-wrapRange*0.5;
		};

		subAngles = function(a, b) {
			return Math.atan2(Math.sin(a-b), Math.cos(a-b));
		};

		radialLerp = function(a, b, w) {
			var cs = (1-w)*Math.cos(a) + w*Math.cos(b);
			var sn = (1-w)*Math.sin(a) + w*Math.sin(b);
			return Math.atan2(sn,cs);
		};

		addAngles = function(a, b) {
			return Math.atan2(Math.sin(a+b), Math.cos(a+b));
		};


		radialToVectorXY = function(angle, distance, store) {
			store.x = Math.cos(angle)*distance;
			store.y = Math.sin(angle)*distance;
		};

		spreadVector = function(vec, spreadV) {
			vec.x += spreadV.x * (Math.random()-0.5);
			vec.y += spreadV.y * (Math.random()-0.5);
			vec.z += spreadV.z * (Math.random()-0.5);
		};

		distanceBetween = function(vec3a, vec3b) {
			if (!calcVec1) calcVec1 = new THREE.Vector3();
			calcVec1.subVectors(vec3a, vec3b);
			return calcVec1.length();
		}

		lerpClamped = function(targetVec3, towardsVec3, alpha, min, max) {
			targetVec3.lerp(towardsVec3, this.clamp(alpha, min || -1, max || 1))
		}

		expandVector = function(vec, expand) {
			vec.x += expand*Math.sign(vec.x);
			vec.y += expand*Math.sign(vec.y);
			vec.z += expand*Math.sign(vec.z);
		};

		vec3ToArray = function(vec3, array) {
			vec3.x = array[0] = vec3.x;
			vec3.y = array[1] = vec3.y;
			vec3.z = array[2] = vec3.z;
			return array;
		}

		vec3FromArray = function(vec3, array) {
			if (!vec3) vec3 = new THREE.Vector3();
			vec3.x = array[0];
			vec3.y = array[1];
			vec3.z = array[2];
			return vec3;
		}

		rotXYZFromArray = function(obj3d, rot) {
			obj3d.rotateX(rot[0]);
			obj3d.rotateY(rot[1]);
			obj3d.rotateZ(rot[2]);
		}

		vectorYZToAngleAxisX = function(vec) {
			return Math.atan2(vec.y, vec.z);
		};

		vectorXZToAngleAxisY = function(vec) {
			return Math.atan2(vec.x, vec.z);
		};

		vectorXYToAngleAxisZ = function(vec) {
			return -Math.atan2(vec.x, vec.y);
		};

		angleZFromVectorToVector = function(fromVec, toVec) {
			return Math.atan2(toVec.y-fromVec.y, toVec.x-fromVec.x) // + Math.PI*0.5;
		};




		applyNormalVectorToPitch = function(normalVec, upVec) {
			upVec.setX(this.subAngles(upVec.getX() - normalVec.getX()));
		};

		applyNormalVectorToRoll = function(normalVec, tiltVec) {
			tiltVec.setZ(this.subAngles(tiltVec.getZ(), normalVec.getZ()));
		};


		radialClamp = function(value, min, max) {

			var zero = (min + max)/2 + ((max > min) ? Math.PI : 0);
			var _value = this.moduloPositive(value - zero, MATH.TWO_PI);
			var _min = this.moduloPositive(min - zero, MATH.TWO_PI);
			var _max = this.moduloPositive(max - zero, MATH.TWO_PI);

			if (value < 0 && min > 0) { min -= this.TWO_PI; }
			else if (value > 0 && min < 0) { min += this.TWO_PI; }
			if (value > this.TWO_PI && max < this.TWO_PI) { max += this.TWO_PI; }

			return _value < _min ? min : _value > _max ? max : value;
		};

		clamp = function(value, min, max) {
			return value < min ? min : value > max ? max : value;
		};

		clampVectorXZ = function(vector3, minX, maxX, minZ, maxZ) {
			vector3.x = this.clamp(vector3.x, minX, maxX);
			vector3.z = this.clamp(vector3.z, minZ, maxZ);
		}

		clampVectorXY = function(vector3, minX, maxX, minY, maxY) {
			vector3.x = this.clamp(vector3.x, minX, maxX);
			vector3.y = this.clamp(vector3.y, minY, maxY);
		}

		expand = function(value, min, max) {
			if (value > min && value < max) {
				return min;
			}
			return value;
		};


		pitchFromQuaternion = function(q) {
			mag = Math.sqrt(q.w*q.w + q.x*q.x);
			return 2*Math.acos(q.x / mag)-Math.PI;
		};

		yawFromQuaternion = function(q) {
			mag = Math.sqrt(q.w*q.w + q.y*q.y);
			return 2*Math.acos(q.y / mag)-Math.PI;
		};



		rollFromQuaternion = function(q) {
			mag = Math.sqrt(q.w*q.w + q.z*q.z);
			return (2*Math.acos(q.z / mag)-Math.PI);
		};


		horizonAttitudeFromQuaternion = function(q) {
			if (!calcVec) calcVec = new THREE.Vector3();
			calcVec.set(0, 0, 1);
			calcVec.applyQuaternion(q);
			return -calcVec.y * Math.PI // Math.atan2(calcVec.x, calcVec.y);
		};

		compassAttitudeFromQuaternion = function(q) {
			if (!calcVec) calcVec = new THREE.Vector3();
			calcVec.set(0, 0, 1);
			calcVec.applyQuaternion(q);
			return this.vectorXZToAngleAxisY(calcVec)
		};



		rollAttitudeFromQuaternion = function(q) {
			let rotation = this.eulerFromQuaternion(q, "YXZ");
			return rotation.z
		};

		eulerFromQuaternion = function(q, order) {
			if (!euler) euler = new THREE.Euler()
			return euler.setFromQuaternion(q, order);
		}


		copyArray = function(from, to) {
			for (let i = 0; i < from.length; i++) {
				let value = this.copyValues(from[i], to[i])
				if (value !== null) {
					to[i] = value;
				}

			}
		}

		copyValues = function(from, to) {
			if (typeof (from.length) === 'number') {
				if (typeof (to.length) !== 'number') {
					to = []
				}
				this.copyArray(from, to)
				return null;
			} else {
				return from;
			}
		}


		deepClone = function(source) {
			const deepClone = obj => {
				if (obj === null) return null;
				let clone = Object.assign({}, obj);
				Object.keys(clone).forEach(
					key =>
						(clone[key] =
							typeof obj[key] === 'object' ? deepClone(obj[key]) : obj[key])
				);
				if (Array.isArray(obj)) {
					clone.length = obj.length;
					return Array.from(clone);
				}
				return clone;
			};

			return deepClone(source); // a !== b, a.obj !== b.obj
		}

		stupidChecksumArray = function(arr) {

			let sum = 0;

			let addLevel = function(array) {
				if (typeof (array) === 'undefined') {
					sum += 0.1
					return;
				}
				if (typeof (array) !== 'object') {
					if (array.length) {
						sum+=array.length
					} else {
						if (typeof (array) === 'number') {
							sum += array;
						}
					}
				} else {
					for (let i = 0; i < array.length; i++) {
						if (typeof (array[i].length) === 'number') {
							sum+=array[i].length
							if (typeof (array[i] === 'string')) {
								sum += i;
							} else {
								addLevel(array[i])
							}
						} else {
							if (typeof (array[i] === 'number')) {
								sum += array[i];
							}
						}
					}
				}
			}

			addLevel(arr);

			return sum;
		}

		copyRGBA = function(from, to) {
			to.r = from.r;
			to.g = from.g;
			to.b = from.b;
			to.a = from.a;
			return to;
		}

		compareQuaternions = function(a, b) {
			return Math.abs(a.x-b.x) + Math.abs(a.y-b.y) + Math.abs(a.z-b.z) + Math.abs(a.w-b.w)
		}

		testVec3ForNaN = function(vec3) {
			if (isNaN(vec3.x) || isNaN(vec3.y) || isNaN(vec3.z)) {
				console.log("Spatial Vec3 is NaN.. investigate!")
				vec3.x = 0;
				vec3.y = 0;
				vec3.z = 0
				return true;
			}
		}

}

export { MATH }