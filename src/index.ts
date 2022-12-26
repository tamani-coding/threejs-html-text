import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8def0);

// CAMERA
const camera = new THREE.PerspectiveCamera(45, 
        window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 10;
camera.position.z = 10;
camera.position.x = 33;

// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true

// ORBIT CAMERA CONTROLS
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.mouseButtons = {
	MIDDLE: THREE.MOUSE.ROTATE,
	RIGHT: THREE.MOUSE.PAN
}
orbitControls.enableDamping = true
orbitControls.enablePan = true
orbitControls.minDistance = 5
orbitControls.maxDistance = 60
orbitControls.maxPolarAngle = Math.PI / 2 - 0.05 // prevent camera below ground
orbitControls.minPolarAngle = Math.PI / 4        // prevent top down view
orbitControls.update();

// LIGHTS
const dLight = new THREE.DirectionalLight('white', 0.8);
dLight.position.x = 20;
dLight.position.y = 30;
dLight.castShadow = true;
dLight.shadow.mapSize.width = 4096;
dLight.shadow.mapSize.height = 4096;
const d = 35;
dLight.shadow.camera.left = - d;
dLight.shadow.camera.right = d;
dLight.shadow.camera.top = d;
dLight.shadow.camera.bottom = - d;
scene.add(dLight);

const aLight = new THREE.AmbientLight('white', 0.5);
scene.add(aLight);

// ATTACH RENDERER
document.body.appendChild(renderer.domElement);

// FLOOR
const plane = new THREE.Mesh(new THREE.PlaneGeometry(500, 500, 32), new THREE.MeshPhongMaterial({ color: 0xfab74b}));
plane.rotation.x = - Math.PI / 2
plane.receiveShadow = true
scene.add(plane);

// AGENT
const agentHeight = 1.0;
const agentRadius = 0.25;
const agent = new THREE.Mesh(new THREE.CylinderGeometry(agentRadius, agentRadius, 
    agentHeight), 
    new THREE.MeshPhongMaterial({ color: 'green'}));
agent.castShadow = true;
agent.receiveShadow = true;
agent.position.y = agentHeight / 2;
const agentGroup = new THREE.Group();
agentGroup.add(agent);
scene.add(agentGroup);

// RESIZE HANDLER
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

const canvas = document.querySelector('canvas');
const text1 = document.getElementById('text1');
let vector = new THREE.Vector3();

// GAMELOOP
const clock = new THREE.Clock();
let gameLoop = () => {

    // MOVE OBJECT
    const time = Date.now() * 0.0005;
    agentGroup.position.x = Math.sin(time * 0.7) * 20;
    agentGroup.position.z = Math.cos(time * 0.7) * 20;

    // MOVE TEXT
    vector.setFromMatrixPosition( agentGroup.matrixWorld )
    vector.project(camera);
    
    var widthHalf = canvas.width / 2, heightHalf = canvas.height / 2;
    vector.x = ( vector.x * widthHalf ) + widthHalf;
    vector.y = - ( vector.y * heightHalf ) + heightHalf;
    
    text1.style.top = `${vector.y}px`;
    text1.style.left = `${vector.x}px`;
    
    orbitControls.update()
    renderer.render(scene, camera);
    requestAnimationFrame(gameLoop);
};
gameLoop();