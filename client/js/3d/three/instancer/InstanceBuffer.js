import {InstancedBufferGeometry} from "../../../../libs/three/core/InstancedBufferGeometry.js";
import {BufferAttribute} from "../../../../libs/three/core/BufferAttribute.js";
import {Mesh} from "../../../../libs/three/objects/Mesh.js";
import {InstancedInterleavedBuffer} from "../../../../libs/three/core/InstancedInterleavedBuffer.js";
import {InterleavedBufferAttribute} from "../../../../libs/three/core/InterleavedBufferAttribute.js";
import {InstancedBufferAttribute} from "../../../../libs/three/Three.js";
import {Box3, Sphere} from "../../../../libs/three/Three.js";

let activeGeometries = 0;
let countTotal = 0;

class InstanceBuffer {
    constructor(verts, uvs, indices, normals) {
        this.maxInstanceCount = null;
        this.registeredAttributes = [];
        this.attributes = {};
        this.buffers = {};
        this.buildGeometry(verts, uvs, indices, normals);
        this.isCameraSpace = false;
        this.mesh;
    };



    buildGeometry = function(verts, uvarray, indices, normals) {

        let geometry = new InstancedBufferGeometry();
        geometry.name = 'InstanceBuffer buildGeometry'
        let posBuffer   =     verts;
        let uvBuffer    =     uvarray;

        // per mesh data

        let ninequad = false;

        if (indices.length === 54) {
            ninequad = true;
        }

        if (indices) {
            posBuffer   =      new Float32Array( verts );
            uvBuffer    =      new Float32Array( uvarray );
        } else {
            indices = [];
            for ( let i = 0; i < verts.length / 3; i ++ ) {
                indices[ i ] = i;
            }
        }



        let indexBuffer =   new Uint16Array( indices );
        geometry.setIndex( new BufferAttribute( indexBuffer , 1 ) );

        geometry.index.needsUpdate = true;
        geometry.needsUpdate = true;

/*
        let joinedArray = [];

        for (let i = 0; i < indices.length; i++) {
            joinedArray.push(verts[i*3]);
            joinedArray.push(verts[i*3+1]);
            joinedArray.push(verts[i*3+2]);
            joinedArray.push(normals[i*3]);
            joinedArray.push(normals[i*3+1]);
            joinedArray.push(normals[i*3+2]);
        }
*/

    //    let joinedBuffer = new Float32Array(  verts)
    //    const iIB = new InstancedInterleavedBuffer(joinedBuffer, 3, 1); // this part is important
    //    geometry.setAttribute("position", new InterleavedBufferAttribute(iIB, 3, 0));


    //    if (normals) {
            let normal = new BufferAttribute(normals , 3 );
             geometry.setAttribute( 'normal', normal );
        //     geometry.setAttribute("normal", new THREE.InterleavedBufferAttribute(iIB, 3, 0));
    //    }
//
        let vertices = new BufferAttribute(posBuffer , 3 );
        geometry.setAttribute( 'position', vertices );
        let uvs = new BufferAttribute( uvBuffer , 2 );
        geometry.setAttribute( 'uv', uvs );
    //    geometry.getAttribute('position').needsUpdate = true;

        this.geometry = geometry;

        geometry.boundingSphere = new Sphere();
        geometry.boundingBox = new Box3();

        let mesh = new Mesh(geometry);
        mesh.matrixAutoUpdate = false;
        mesh.frustumCulled = false;
        mesh.userData.ninequad = ninequad;
        //    mesh.scale.set(1, 1, 1);

        mesh.geometry.drawRange.count = indices.length;
        mesh.geometry.maxInstancedCount = 0;
        mesh.needsUpdate = true;
        this.mesh = mesh;

    };

    setRenderOrder = function(order) {
        this.mesh.renderOrder = order;
        this.mesh.needsUpdate = true;

    };

    registerBufferAttribute(attrib, name, count) {
        this.maxInstanceCount = count;
        let setup = {
            attrib:attrib,
            name:name
        }

        this.registeredAttributes.push(setup)
    }

    activateAttributes(countScale) {
        this.maxInstanceCount = Math.ceil(this.maxInstanceCount * countScale)
        for (let i = 0; i < this.registeredAttributes.length; i++) {
            let setup = this.registeredAttributes[i];
            let buffer = this.buildBuffer(setup.attrib.dimensions, this.maxInstanceCount);
            this.attachAttribute(buffer, setup.name, setup.attrib.dimensions, setup.attrib.dynamic)
        }
    }

    buildBuffer = function(dimensions, count) {
        return new Float32Array(count * dimensions);
    };

    attachAttribute = function(buffer, name, dimensions, dynamic) {

        if (this.attributes[name]) {
        //    this.geometry.removeAttribute(name);
            this.buffers[name] = buffer;
        }

        let attribute = new InstancedBufferAttribute(buffer, dimensions, false)
        if (dynamic) {
            console.log('setDynamic expected, not supported so fix..')
            attribute.setDynamic( dynamic );
        }

        this.geometry.setAttribute(name, attribute);
        this.attributes[name] = attribute;
        attribute.needsUpdate = true;
        this.geometry.needsUpdate = true;
    };


    setAttribXYZ = function(name, index, x, y, z) {
        this.attributes[name].setXYZ( index, x, y, z);
        this.attributes[name].needsUpdate = true;
    };

    setAttribXYZW = function(name, index, x, y, z, w) {
        this.attributes[name].setXYZW( index, x, y, z, w);
        this.attributes[name].needsUpdate = true;
    };

    setBufferVec3 = function(name, index, vec3) {
        this.attributes[name].setXYZ( index, vec3.x, vec3.y, vec3.z );
        this.attributes[name].needsUpdate = true;
    };

    setBufferVec4 = function(name, index, vec4) {
        this.attributes[name].setXYZW( index, vec4.x, vec4.y, vec4.z, vec4.w );
        this.attributes[name].needsUpdate = true;
    };

    setBufferValue = function(name, index, value) {
        this.attributes[name].setX( index, value );
        this.attributes[name].needsUpdate = true;
    };

    setMaterial = function(material) {
        this.mesh.material = material;;
    };

    setDrawRange = function(count) {
        this.setInstancedCount(count)
    };

    setInstancedCount(count) {

        if (count > this.maxInstanceCount) {
            console.log("not enough buffers.. ",this.maxInstanceCount, count-this.maxInstanceCount, this.registeredAttributes)
        //    this.activateAttributes(2);
        } else if (count < this.maxInstanceCount*0.1) {
            if (count !== 0) {
            //    this.activateAttributes(0.8);
            }
        }

        if (this.isCameraSpace === false) {
            if (this.mesh.geometry.maxInstancedCount === 0) {
                if (count !== 0) {
                    console.log("Count++", activeGeometries)
                    this.addToScene();
                }
            } else if (count === 0) {
                console.log("Count Zero", activeGeometries)
             //   ThreeAPI.hideModel(this.mesh);
                this.removeFromScene();
            }
        }

        this.mesh.geometry.maxInstancedCount = count;
        this.mesh.geometry.needsUpdate = true;
    };

    dispose = function() {
        ThreeAPI.hideModel(this.mesh);
        this.geometry.dispose();
    };

    updateBufferStates = function() {

        let drawRange =0;

        for (let key in this.buffers) {
            let buffer = this.buffers[key];
            let lastIndex = buffer.length -1;

            if (key === 'offset') {
                drawRange = buffer[lastIndex-2];
            // Not correctly used here, look for better culling    this.setInstancedCount(drawRange)
            }

            if (buffer[lastIndex]) {
                buffer[lastIndex] = 0;
                this.attributes[key].needsUpdate = true;
            }
        }

        return drawRange;
    };

    removeFromScene() {
        activeGeometries--
        ThreeAPI.hideModel(this.mesh);
    };

    addToScene() {
        activeGeometries++
        if (this.isCameraSpace) {

            let offset = new THREE.Object3D();
            offset.position.z = -1;
            offset.add(this.mesh);

        //    console.log("Screen Space Mesh:", this.mesh.geometry.drawRange, this.mesh);

            ThreeAPI.attachObjectToCamera(offset);

        } else {
            ThreeAPI.showModel(this.mesh);
        }
    };



}

export { InstanceBuffer }