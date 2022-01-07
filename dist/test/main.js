import * as THREE from "../lib/build/three.module.js";

import { DDSLoader } from '../lib/helper/jsm/loaders/DDSLoader.js';
import { MTLLoader } from '../lib/helper/jsm/loaders/MTLLoader.js';
import { OBJLoader } from '../lib/helper/jsm/loaders/OBJLoader.js';

import { OrbitControls } from '../lib/helper/jsm/controls/OrbitControls.js';

let camera, scene, renderer, controls, offset;

const CONVERSION_RATE = 100;

let spotLight;

let mouseX = 0, mouseY = 0;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;


init();
animate();


function init() {

    const container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);

    scene = new THREE.Scene();

    //const dirLight1 = new THREE.DirectionalLight(0xffffff);
    //dirLight1.position.set(1, 1, 1);
    //scene.add(dirLight1);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);


    const manager = new THREE.LoadingManager();
    manager.addHandler(/\.dds$/i, new DDSLoader());

    // comment in the following line and import TGALoader if your asset uses TGA textures
    // manager.addHandler( /\.tga$/i, new TGALoader() );

    new MTLLoader(manager)
        .setPath('example/room/')
        .load('wohnung_3.mtl', function (materials) {
            materials.preload();

            new OBJLoader(manager)
                .setMaterials(materials)
                .setPath('example/room/')
                .load('wohnung_3.obj', function (object) {
                    const boundingbox = new THREE.BoxHelper(object, 0xff0000);
                    object.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    console.log(object);

                    boundingbox.update();
                    const center = boundingbox.geometry.boundingSphere.center;
                    object.position.set(-center.x, -center.y, -center.z);
                    offset = center;

                    addSpotlightInRoomSpace(2.1, 2.4, 3.8, 0, 1.5, 6);
                    addSpotlightInRoomSpace(2.1, 2.4, 3.6, 3.1, 1.5, 4.6);
                    addSpotlightInRoomSpace(2.1, 2.4, 3.4, 3.1, 1.1, 3.3);
                    addSpotlightInRoomSpace(2.1, 2.4, 3.2, 0, 2.0, 1.8);

                    const sceneradius = boundingbox.geometry.boundingSphere.radius * 2;
                    controls.minDistance = sceneradius * 1.05;
                    controls.maxDistance = sceneradius * 2;

                    scene.add(object);
                });

        });



    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(renderer.domElement);


    controls = new OrbitControls(camera, renderer.domElement);

    controls.autoRotate = false;
    controls.autoRotateSpeed /= 2;

    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.05;


    controls.maxPolarAngle = Math.PI / 2;
}

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) / 2;
    mouseY = (event.clientY - windowHalfY) / 2;
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    render();
}

function render() {
    renderer.render(scene, camera);
}

function getCenterPoint(mesh) {
    var middle = new THREE.Vector3();
    var geometry = mesh.geometry;

    geometry.computeBoundingBox();

    middle.x = (geometry.boundingBox.max.x + geometry.boundingBox.min.x) / 2;
    middle.y = (geometry.boundingBox.max.y + geometry.boundingBox.min.y) / 2;
    middle.z = (geometry.boundingBox.max.z + geometry.boundingBox.min.z) / 2;

    mesh.localToWorld(middle);
    return middle;
}

function addSpotlight(x, y, z, xdir, ydir, zdir) {
    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(x, y, z);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 1;
    spotLight.decay = 1.6;
    spotLight.distance = 500;

    spotLight.castShadow = true;

    scene.add(spotLight);
    spotLight.target.position.set(xdir, ydir, zdir);
    scene.add(spotLight.target);

    console.log(spotLight);

    return spotLight;
}

function addSpotlightInRoomSpace(x, y, z, xdir, ydir, zdir) {
    const actualX = x * CONVERSION_RATE - offset.x;
    const actualY = y * CONVERSION_RATE - offset.y;
    const actualZ = z * CONVERSION_RATE - offset.z;

    const actualXdir = xdir * CONVERSION_RATE - offset.x;
    const actualYdir = ydir * CONVERSION_RATE - offset.y;
    const actualZdir = zdir * CONVERSION_RATE - offset.z;

    return addSpotlight(actualX, actualY, actualZ, actualXdir, actualYdir, actualZdir);
}