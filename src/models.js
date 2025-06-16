import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { LoadingManager } from "three";

// Ricevi il manager esternamente
let loader; // ← dichiarato fuori

export let sharedManager;

export function setLoadingManager(manager) {
  sharedManager = manager;
  loader = new GLTFLoader(sharedManager); // ← lo inizializzi solo dopo
}
const clickableModels = [];
export const modelsGroup = new THREE.Group(); // Gruppo globale

export const PointLight = new THREE.PointLight(0xffffff, 50, 0);
PointLight.position.set(0, 1, 0);

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
  envMapIntensity: 5 //intenistà della riflessione della mappa cubica che c'è in index
});

const metalloMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xd0d0d0,
  metalness: 1.0,
  roughness: 0.2,
  reflectivity: 1.0,
  clearcoat: 0.3,
  clearcoatRoughness: 0.1,
  envMapIntensity: 5 //intenistà della riflessione della mappa cubica che c'è in index
});

//materiale metallo arrugginito
const textureLoaderRuggine = new THREE.TextureLoader(sharedManager);
const rustTexture = textureLoaderRuggine.load('/ruggine.png');
const metalloArrugginito = new THREE.MeshPhysicalMaterial({
  color: 0xd0d0d0,
  metalness: 0.0,
  roughness: 1.0,
  color: 0x3b332d, // Colore marrone per la ruggine
  reflectivity: 0.0,
  clearcoat: 0.1,
  clearcoatRoughness: 1.0,
  envMapIntensity: 1,
  map: rustTexture // Applica la texture di ruggine come diffuse map
});

//materiale termocamera
const textureLoader = new THREE.TextureLoader(sharedManager);
const thermalMatcap = textureLoader.load('/matcap-thermo.png'); 

const termocameraMaterial = new THREE.MeshMatcapMaterial({
  matcap: thermalMatcap,

});

//materiale MORFEO
const textureLoaderMorfeo = new THREE.TextureLoader(sharedManager);
const plasticaMorfeo = textureLoaderMorfeo.load('/plasticaMorfeo.png'); 

const plastica = new THREE.MeshMatcapMaterial({
  matcap: plasticaMorfeo,

});

//materiale TEAMCRO
const textureLoaderTEAMCRO = new THREE.TextureLoader(sharedManager);

const colorMapTEAMCRO = textureLoaderTEAMCRO.load('/TextureTeamcro/color.jpg');
colorMapTEAMCRO.encoding = THREE.sRGBEncoding;
const normalMapTEAMCRO = textureLoaderTEAMCRO.load('/TextureTeamcro/normal.exr');
const roughnessMapTEAMCRO = textureLoaderTEAMCRO.load('/TextureTeamcro/roughness.jpg');
const displacementMapTEAMCRO = textureLoaderTEAMCRO.load('/TextureTeamcro/displacement.png'); // opzionale

const rockMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color(0x4f4f4f), // tono più scuro
  map: colorMapTEAMCRO,
  normalMap: normalMapTEAMCRO,
  roughnessMap: roughnessMapTEAMCRO,
  displacementMap: displacementMapTEAMCRO,
  displacementScale: 0.01, // solo se hai una geometria ad alta suddivisione
  roughness: 0.8, // maggiore ruvidezza per un aspetto più roccioso
  metalness: 0.0, // roccia non metallica
});

  const modelsData = [
    {
      path: "/models/barca.glb", //index 0
      pos: [3.0, -0.35, 0.0],
      scale: 0.5,
      rotY: -15,
      material: "termocameraMaterial",
      name: "BARCA"
    },
    {
      path: "/models/Qholla.glb", // index 1
      pos: [-1.812, -0.3, 2.026],
      scale: 0.35,
      rotY: 30,
      name: "QHOLLA",
    },
    {
      path: "/models/tonnino.glb", // index 2
      pos: [-2.754, -0.398, -0.823],
      scale: 0.35,
      rotY: -75,
      rotZ: 0,
      name: "LATTINA"
    },
    {
      path: "/models/Flebo.glb", // index 3
      pos: [2.126, 0.388, -2.116],
      scale: 0.5,
      rotY: 295,
      rotZ: 0,
      name: "ARIA"
    },
    {
      path: "/models/Microfono.glb", // index 4
      pos: [-1.525, 0.236, 2.654],
      scale: 0.4,
      rotY: 235,
      rotZ: 0,
      material: "vetro",
      name: "REALNESS"
    },
    {
      path: "/models/Cinepresa.glb", // index 5
      pos: [-1.383, -0.372, -2.462],
      scale: 0.08,
      rotY: 120,
      rotZ: 0,
      material: "Arrugginito",
      name: "TROMBONE"
    },
    {
      path: "/models/Tronco.glb", // index 6
      pos: [2.973, 0.455, 0.4],
      scale: 0.25,
      rotY: 340,
      rotZ: 0,
      name: "LEGNO"
    },
    {
      path: "/models/Faro.glb", // index 7
      pos: [2.8, 0.4, -0.844],
      scale: 0.35,
      rotY: -220,
      rotZ: 0,
      name: "IPERURANIO"
    },
    {
      path: "/models/serpente.glb", // index 8
      pos: [0.898, 0.0, 2.862],
      scale: 0.45,
      rotY: 190,
      rotZ: 0,
      material: "termocameraMaterial",
      name: "MUTA"
    },
    {
      path: "/models/reliquia.glb", // index 9
      pos: [-2.997, 0.373, 0.124],
      scale: 0.45,
      rotY: 280,
      rotZ: 0,
      material: "termocameraMaterial",
      name: "SPIRITO"
    },
    {
      path: "/models/madonnina.glb", // index 10
      pos: [2.531, -0.273, -1.61],
      scale: 0.45,
      rotY: 90,
      rotZ: 0,
      name: "ASIAN FAKE"
    },
    {
      path: "/models/farfalla.glb", // index 11
      pos: [0.262, -0.32, -2.989],
      scale: 0.45,
      rotY: -45,
      material: "vetro",
      name: "MORPHO MENELAUS"
    },
    {
      path: "/models/Cane.glb", // index 12
      pos: [1.994, 0.4, 2.300],
      scale: 0.35,
      rotY: 265,
      rotZ: 0,
      material: "vetro",
      name: "MASTINO"
    },
    {
      path: "/models/TrenoHD.glb", // index 13
      pos: [-2.773, -0.25, 1.345],
      scale: 0.55,
      rotY: 150,
      rotZ: 0,
      name: "VAGONE",
    },
    {
      path: "/models/mano.glb",//andrà sostituita ---CON PARMA----------- INDEX 14
      pos: [1.725, -0.4, 2.45],
      scale: 0.4,
      rotY: 60,
      material: "metallo",
      name: "43123",
    },
    {
      path: "/models/Tucano.glb", // index 15
      pos: [-2.596, 0.25, -1.504],
      scale: 0.38,
      rotY: 205,
      rotZ: 0,
      material: "metallo",
      name: "TUCANO",
    },
    {
      path: "/models/Maschera.glb", // index 16
      pos: [-0.139, 0.364, 2.997],
      scale: 0.33,
      rotY: 310,
      rotZ: 0,
      name: "FLATFACE",
    },
    {
      path: "/models/morfeo.glb", // index 17
      pos: [2.818, -0.136, 1.329],
      scale: 0.4,
      rotY: -135,
      rotZ: 0,
      material: "plastica",
      name: "MORFEO",
    },
    {
      path: "/models/Cervello.glb", // index 18
      pos: [-1.922, 0.409, -2.303],
      scale: 0.33,
      rotY: 325,
      rotZ: 0,
      name: "INTIMO",
    },
    {
      path: "/models/uovo.glb", // index 19
      pos: [-0.6, -0.337, 2.797],
      scale: 0.3,
      rotY: -105,
      rotZ: 0,
      name: "LOOP",
    },
    {
      path: "/models/sirena.glb", // index 20
      pos: [1.272, -0.045, -2.717],
      scale: 0.25,
      rotY: -165,
      rotZ: 0,
      name: "INPUT",
    },
    {
      path: "/models/squadra.glb", // index 21 
      pos: [-2.463, 0.5, 1.713],
      scale: 1.8,
      rotY: 355,
      rotZ: 0,
      material: "rockMaterial",
      name: "SQUADRA",
    },
    {
      path: "/models/Nido.glb", // index 22
      pos: [-0.586, 0.282, -2.775],
      scale: 0.3,
      rotY: -250,
      rotZ: 0,
      name: "DOMANI",
      material: "metallo",
    },
    
    
    
    
    
  ];

//FUNZIONE PER CARICARE I MODELLI
export function loadAndPlaceModels(scene) {
  scene.add(PointLight); //aggiungo qui la point light dichiarata all'inizio così compare effettivamente in index e quindi nel sito
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
          if (data.material === "termocameraMaterial") child.material = termocameraMaterial;
          if (data.material === "Arrugginito") child.material = metalloArrugginito; // Aggiunto materiale metallo arrugginito
          if (data.material === "plastica") child.material = plastica; // Aggiunto materiale plastica
          if (data.material === "rockMaterial") child.material = rockMaterial; // Aggiunto materiale roccia
        }
      });

      model.userData.modelIndex = index; // Serve per collegarlo al div di webflow
      model.userData.name = data.name || `Model ${index}`; // Serve per collegarlo al div dei nomi 
      clickableModels.push(model);
      modelsGroup.add(model);
    });
  });

  scene.add(modelsGroup); //modelsGroup è il gruppo globale che contiene tutti i modelli a inizio codice
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

export function getFocusedModel() {
  return focusedModel;
}

//variabili che servono per le varie funzioni
let targetScale = null;
let fadeCone = null;
let coneTargetOpacity = 0;
const fadeSpeed = 0.05; // Velocità con cui l'opacità sale

let isResetting = false;
export function getIsResetting() {
  return isResetting;
}
let resetStartTime = null;


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
  targetScale = model.scale.clone().multiplyScalar(0.3);//rimpicciolisce il modello quando lo clicco

  // INVIA IL MESSAGGIO AL PARENT (Webflow)
  if (model.userData.modelIndex !== undefined) {
  console.log("CANVAS: invio modelClicked a Webflow con index:", model.userData.modelIndex);
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
  if (focusedModel) { //gestisce il cambio di intenistà della luce quand si clicca su un modello
  const distanceToLight = focusedModel.position.distanceTo(PointLight.position);
  const desiredIntensity = THREE.MathUtils.clamp(50 * (distanceToLight / 2.5), 15, 50); // calcolo dinamico
  PointLight.intensity = THREE.MathUtils.lerp(PointLight.intensity, desiredIntensity, 0.1);
}
  if (!focusedModel || !camera || !camera.getWorldDirection) return;

  // Se siamo in fase di reset
  if (isResetting && focusedModel.userData.targetPosition) {
    console.log("Sto resettando il modello");
    // Controlla se il cono è diventato completamente trasparente
    if (fadeCone && fadeCone.material.opacity <= 0.01) {
      // Sposta il modello alla posizione originale
      focusedModel.position.lerp(focusedModel.userData.targetPosition, 0.1);
      focusedModel.scale.lerp(targetScale, 0.1);

      const dist = focusedModel.position.distanceTo(focusedModel.userData.targetPosition);
      const scaleDiff = focusedModel.scale.distanceTo(targetScale);

      if (dist < 0.01 && scaleDiff < 0.01) {
        // Reset completato
        delete focusedModel.userData.targetPosition;
        isResetting = false;
        focusedModel = null;
      }
    }

  } else {
  // Movimento verso un punto davanti alla camera, ma con offset in alto a sinistra GESTIRE POSZIONE POST CLICK
  const offset = new THREE.Vector2(-0.7, 0.25); // -x: sinistra, +y: alto
  const offsetPosition = new THREE.Vector3(offset.x, offset.y, 0.5); // z = profondità in clip space

  offsetPosition.unproject(camera); // Trasformazione in world space

  const dir = offsetPosition.sub(camera.position).normalize();
  const distance = 1; // distanza dalla camera
  const targetPosition = camera.position.clone().add(dir.multiplyScalar(distance));

  focusedModel.position.lerp(targetPosition, 0.1);
  if (targetScale) {
    focusedModel.scale.lerp(targetScale, 0.1);
  }
}

  // Fading del cono
  if (fadeCone) {
    const currentOpacity = fadeCone.material.opacity;
    if (Math.abs(currentOpacity - coneTargetOpacity) > 0.01) {
      fadeCone.material.opacity = THREE.MathUtils.lerp(currentOpacity, coneTargetOpacity, fadeSpeed);
    }
  }
}


//COMUNICAZIONE DEL CLOSE-BUTTON CON WEBFLOW
window.addEventListener("message", function(event) {
  console.log("Messaggio ricevuto:", event.data);
  if (event.data && event.data.type === "resetModel") {
    const index = event.data.modelIndex;
    const model = modelsGroup.children.find(
      (m) => m.userData.modelIndex === index
    );
    if (!model) return;

    const original = modelsData[index];
    if (!original) return;

    // Avvia il reset
    focusedModel = model;
    targetScale = new THREE.Vector3(original.scale, original.scale, original.scale);
    model.userData.targetPosition = new THREE.Vector3(...original.pos);
    isResetting = true;
    resetStartTime = performance.now();

    // Nasconde subito il cono
    coneTargetOpacity = 0;
  }
});
