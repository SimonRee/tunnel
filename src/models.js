import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const loader = new GLTFLoader();
const clickableModels = [];
export const modelsGroup = new THREE.Group(); // Gruppo globale

//CREAZIONE MATERIALI PER ALCUNI OGGETTI

const vetroMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  transmission: 1.0,
  roughness: 0.1,
  metalness: 0,
  thickness: 0.5,
  ior: 1.5,
  transparent: true,
  opacity: 1,
  clearcoat: 1,
  clearcoatRoughness: 0,
});

const metalloMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xd0d0d0,
  metalness: 1.0,
  roughness: 0.2,
  reflectivity: 1.0,
  clearcoat: 0.3,
  clearcoatRoughness: 0.1,
});

  const modelsData = [
    {
      path: "/models/Comp.gltf",
      pos: [-3, -0.0, 0],
      scale: 0.25,
      rotY: 0,
    },
    {
      path: "/models/barca.glb",
      pos: [-2.77, -0.0, -1.15],
      scale: 0.4,
      rotY: -15,
    },
    {
      path: "/models/treno.glb",
      pos: [-2.12, -0.0, -2.12],
      scale: 0.5,
      rotY: 30,
    },
    {
      path: "/models/farfalla.glb",
      pos: [-1.15, 0.0, -2.77],
      scale: 0.3,
      rotY: -45,
      material: "vetro",
    },
    {
      path: "/models/mano.glb",
      pos: [0, 0.0, -3],
      scale: 0.3,
      rotY: 60,
      material: "metallo",
    },
    {
      path: "/models/tonno.glb",
      pos: [1.15, -0.0, -2.77],
      scale: 0.25,
      rotY: -75,
      rotZ: 0,
    },
    {
      path: "/models/AsianFake.glb",
      pos: [2.12, -0.0, -2.12],
      scale: 0.3,
      rotY: 90,
      rotZ: 0,
    },
    {
      path: "/models/uovo.glb",
      pos: [2.77, -0.0, -1.15],
      scale: 0.2,
      rotY: -105,
      rotZ: 0,
    },
    {
      path: "/models/reliquia.glb",
      pos: [3, -0.0, 0],
      scale: 0.3,
      rotY: 120,
      rotZ: 0,
    },
    {
      path: "/models/morfeo.glb",
      pos: [2.77, -0.0, 1.15],
      scale: 0.3,
      rotY: -135,
      rotZ: 0,
    },
    {
      path: "/models/qholla.glb",
      pos: [2.12, -0.0, 2.12],
      scale: 0.3,
      rotY: 150,
      rotZ: 0,
    },
    {
      path: "/models/sirena.glb",
      pos: [1.15, -0.0, 2.77],
      scale: 0.2,
      rotY: -165,
      rotZ: 0,
    },
  ];

//FUNZIONE PER CARICARE I MODELLI
export function loadAndPlaceModels(scene) {
  modelsData.forEach((data, index) => {
    loader.load(data.path, (gltf) => {
      const model = gltf.scene;
      model.position.set(...data.pos);
      model.scale.set(data.scale, data.scale, data.scale);
      model.rotation.y = THREE.MathUtils.degToRad(data.rotY || 0);
      if (data.rotZ) model.rotation.z = THREE.MathUtils.degToRad(data.rotZ);

      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = false;
          if (data.material === "vetro") child.material = vetroMaterial;
          if (data.material === "metallo") child.material = metalloMaterial;
        }
      });

      model.userData.modelIndex = index; // Serve per collegarlo al div
      clickableModels.push(model);
      modelsGroup.add(model);
    });
  });

  scene.add(modelsGroup);
}

//FUNZIONE ROTAZIONE MODELLI  --posso rendere non uguali le rotazioni, modificando le rotazioni iniziali dei modelli nel modelsGroup
export function RuotaModels() {
  modelsGroup.children.forEach((model) => {
    // Compute the bounding box center
    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Translate model to origin, rotate, then translate back
    model.position.sub(center);
    model.rotation.x += 0.002;
    model.rotation.y += 0.002;
    model.rotation.z += 0.002;
    model.position.add(center);
  });
}

// Funzione per ottenere i modelli cliccabili
export function getClickableModels() {
  return clickableModels;
}

//per fare l'animazione e spostamento dei modelli
let focusedModel = null;
let targetScale = null;
let fadeCone = null;
let coneTargetOpacity = 0;
const fadeSpeed = 0.05; // Velocità con cui l'opacità sale

export function createFadeCone(scene) {
  const coneGeometry = new THREE.ConeGeometry(2.5, 3, 64, 1, true); // height = 3, raggio = 2
  const coneMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0,
    side: THREE.BackSide,
    depthWrite: false,
  });

  fadeCone = new THREE.Mesh(coneGeometry, coneMaterial);
  fadeCone.position.set(0, 0, 0);
  fadeCone.rotation.x = Math.PI; // punta in basso
  scene.add(fadeCone);
}

export function focusModelOnCamera(model) {
  if (focusedModel === model) return; // Se il modello cliccato è già quello attivo, non fare nulla
  focusedModel = model;
  targetScale = model.scale.clone().multiplyScalar(0.6);

  // INVIA IL MESSAGGIO AL PARENT (Webflow)
  if (model.userData.modelIndex !== undefined) {
    window.parent.postMessage(
      {
        type: "modelClicked",
        modelIndex: model.userData.modelIndex
      },
      "*"
    );
  }

  // Dopo 1 secondo attiva la transizione del cono
  setTimeout(() => {
    coneTargetOpacity = 1;
  }, 1000);
}

export function updateFocusedModel(camera) {
  if (!focusedModel || !camera || !camera.getWorldDirection) return;

  // Movimento verso davanti alla camera
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);

  const targetPosition = new THREE.Vector3()
    .copy(camera.position)
    .add(direction.multiplyScalar(1));

  focusedModel.position.lerp(targetPosition, 0.1);
    
  // Lerp della scala
  if (targetScale) {
    focusedModel.scale.lerp(targetScale, 0.1);
  }

  // Fading del cono
  if (fadeCone) {
    const currentOpacity = fadeCone.material.opacity;
    if (Math.abs(currentOpacity - coneTargetOpacity) > 0.01) {
      fadeCone.material.opacity = THREE.MathUtils.lerp(currentOpacity, coneTargetOpacity, fadeSpeed);
    }
  }
}

