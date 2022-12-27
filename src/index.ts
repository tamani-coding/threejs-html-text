import * as THREE from 'three';
import { Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8def0);

// CAMERA
const camera = new THREE.PerspectiveCamera(45, 
        window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 2;
camera.position.z = -5;
camera.position.x = 5;

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
dLight.position.z = -20;
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

const aLight = new THREE.AmbientLight('white', 0.7);
scene.add(aLight);

// ATTACH RENDERER
document.body.appendChild(renderer.domElement);

function wrapAndRepeatTexture (map: THREE.Texture) {
    map.wrapS = map.wrapT = THREE.RepeatWrapping
    map.repeat.x = map.repeat.y = 20
}
const textureLoader = new THREE.TextureLoader();
const grassBaseColor = textureLoader.load("/textures/Stylized_Grass_003_basecolor.jpg");
const grassNormal = textureLoader.load("/textures/Stylized_Grass_003_normal.jpg");
const grassHeight = textureLoader.load("/textures/Stylized_Grass_003_height.png");
const grassRoughness = textureLoader.load("/textures/Stylized_Grass_003_roughness.jpg");
const grassAO = textureLoader.load("/textures/Stylized_Grass_003_ambientOcclusion.jpg");
wrapAndRepeatTexture(grassBaseColor);
wrapAndRepeatTexture(grassNormal);
wrapAndRepeatTexture(grassHeight);
wrapAndRepeatTexture(grassRoughness);
wrapAndRepeatTexture(grassAO);

// FLOOR
const plane = new THREE.Mesh(new THREE.PlaneGeometry(100, 100, 32), 
new THREE.MeshStandardMaterial({ map: grassBaseColor, normalMap: grassNormal, 
    displacementMap: grassHeight, displacementScale:0.01, roughnessMap: grassRoughness, aoMap: grassAO }));
plane.rotation.x = -Math.PI / 2
plane.receiveShadow = true
scene.add(plane);

let model: THREE.Group;
let mixer: THREE.AnimationMixer;
new GLTFLoader().load('/glb/Soldier.glb', function (gltf: GLTF) {
    model = gltf.scene;
    model.traverse(function (object: any) {
        if (object.isMesh) 
            object.castShadow = true;
    });
    scene.add(model);

    const gltfAnimations: THREE.AnimationClip[] = gltf.animations;
    mixer = new THREE.AnimationMixer(model);
    const animationsMap: Map<string, THREE.AnimationAction> = new Map()
    gltfAnimations.filter(a => a.name != 'TPose').forEach((a: THREE.AnimationClip) => {
        animationsMap.set(a.name, mixer.clipAction(a))
    })
    animationsMap.get('Idle').play();
});

// RESIZE HANDLER
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

const panelPos = new THREE.Vector3();
panelPos.y = 1;
panelPos.x = -2;
panelPos.z = 5;

const canvas = document.querySelector('canvas');
const followText = document.getElementById('follow-text');
let boxPosition = new THREE.Vector3();
let boxPositionOffset = new THREE.Vector3();
const Y_AXIS = new Vector3(0, 1, 0);

// GAMELOOP
const clock = new THREE.Clock();
let gameLoop = () => {
    // MOVE TEXT
    if (model) {
        // const time = Date.now() * 0.0005;
        // model.position.x = Math.sin(time * 0.75) * 2;
        // model.position.z = Math.cos(time * 0.75) * 2;

        // MOVE TO THE RIGHT OF THE CAMERA
        boxPositionOffset.copy(model.position);
        boxPositionOffset.sub(camera.position);
        boxPositionOffset.normalize();
        boxPositionOffset.applyAxisAngle(Y_AXIS, - Math.PI / 2);
        boxPositionOffset.multiplyScalar(0.5);
        boxPositionOffset.y = 1.5;

        boxPosition.setFromMatrixPosition( model.matrixWorld )
        boxPosition.add(boxPositionOffset);
        boxPosition.project(camera);
        
        var rect = canvas.getBoundingClientRect();
        var widthHalf = canvas.width / 2, heightHalf = canvas.height / 2;
        boxPosition.x = rect.left + ( boxPosition.x * widthHalf ) + widthHalf;
        boxPosition.y = rect.top - ( boxPosition.y * heightHalf ) + heightHalf;
        
        followText.style.top = `${boxPosition.y}px`;
        followText.style.left = `${boxPosition.x}px`;
    }
    if (mixer) mixer.update(clock.getDelta());
    orbitControls.update()
    renderer.render(scene, camera);
    requestAnimationFrame(gameLoop);
};
gameLoop();