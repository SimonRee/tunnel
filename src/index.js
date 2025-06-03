import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import spline from "./spline.js";
import splinePrincipale from "./splinePrincipale.js";
import { loadAndPlaceModels,getClickableModels,RuotaModels,focusModelOnCamera,updateFocusedModel, createFadeCone } from "./models.js";

const raycaster = new THREE.Raycaster();//per rendere gli oggetti cliccabili
const mouse = new THREE.Vector2();

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 0, 100); // se voglio attivare fog nel tunnel devo mettere nel materiale del cilindro e tutti gli oggetti con il paramentro fog: false come ho fatto per il piano della faccia

const camera = new THREE.PerspectiveCamera(
  30,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

//FOV della telecamera pre e post faccia deriansky
const initialFov = 30; // esempio valore iniziale FOV
const finalFov = 40; // valore finale FOV a cui vuoi arrivare

loadAndPlaceModels(scene, camera); //per mettere i modelli 3D da models.js
const light = new THREE.AmbientLight(0xffffff, 10); // soft white light
scene.add(light);
const PointLight = new THREE.PointLight(0xffffff, 20, 0);
PointLight.position.set(0, 0, 0);
scene.add(PointLight);
const DirL = new THREE.DirectionalLight(0xffffff, 10);
DirL.position.set(0, 5, 0);
scene.add(DirL);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

//IMMAGINE PNG DI DERIANSKY
// Caricamento della texture PNG
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load("/DERIO.png");

// Creazione del piano 16:9
const width = 8; // Larghezza del piano
const height = width * (9 / 16); // Calcolo dell'altezza per mantenere il rapporto 16:9
const planeGeometry = new THREE.PlaneGeometry(width, height);
const planeMaterial = new THREE.MeshBasicMaterial({
  map: texture,
  transparent: true,
  fog: false,
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);

// Rotazione del piano
plane.rotation.y = Math.PI / 2;

scene.add(plane);
// Posizioni iniziale e finale del piano
const startPosition = new THREE.Vector3(10.7, 7.38, 0.12);
const endPosition = new THREE.Vector3(10.52, 7.48, 0.53);

// Creazione del cilindro wireframe segmentato
const cylinderRadius = 4;
const cylinderHeight = 4;
const radialSegments = 64;
const heightSegments = 16;

// Creazione del cilindro principale con segmenti verticali
const cylinderGeo = new THREE.CylinderGeometry(
  cylinderRadius,
  cylinderRadius,
  cylinderHeight,
  radialSegments,
  heightSegments,
  true
);

// Estrazione dei bordi del cilindro
const cylinderEdges = new THREE.EdgesGeometry(cylinderGeo);
const cylinderLines = new THREE.LineSegments(
  cylinderEdges,
  new THREE.LineBasicMaterial({ color: 0xffffff })
);
scene.add(cylinderLines);

// Aggiunta delle linee orizzontali
for (let i = 0; i <= heightSegments; i++) {
  const y = (i / heightSegments - 0.5) * cylinderHeight;
  const ringGeo = new THREE.CircleGeometry(cylinderRadius, radialSegments);
  ringGeo.rotateX(Math.PI / 2);
  const ringEdges = new THREE.EdgesGeometry(ringGeo);
  const ringLines = new THREE.LineSegments(
    ringEdges,
    new THREE.LineBasicMaterial({ color: 0xffffff })
  );
  ringLines.position.y = y;
  scene.add(ringLines);
}

// Creazione del cilindro PIENO PER NON VEDERE IL TUNNEL
const cylinderPIENO = new THREE.CylinderGeometry(4.1,4.1,4.5,64,1,true);
const materialPIENO = new THREE.MeshStandardMaterial({ color: 0x000000,transparent: false, opacity: 1,side: THREE.BackSide});
const CILINDROPIENO = new THREE.Mesh(cylinderPIENO, materialPIENO);
scene.add(CILINDROPIENO);

// Creazione del tubo solido (visibile solo dall'interno)
const tubeGeo = new THREE.TubeGeometry(spline, 200, 0.12, 30, false);
const wallMat = new THREE.MeshBasicMaterial({
  color: 0x000000,
  side: THREE.BackSide, // Visibile solo dall'interno
});
const tubeMesh = new THREE.Mesh(tubeGeo, wallMat);
scene.add(tubeMesh);

// Creazione del wireframe interno (leggermente più piccolo per evitare sovrapposizione)
const edgesGeo = new THREE.EdgesGeometry(
  new THREE.TubeGeometry(spline, 200, 0.119, 30, false),
  0.01 //questo valore se lo modifico cambia il numero di segmenti presenti nel tubo
);
const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
const tubeLines = new THREE.LineSegments(edgesGeo, lineMat);
scene.add(tubeLines);

// Aggiungi una variabile per tenere traccia della posizione lungo il percorso principale
let positionAlongPath = 0;
let targetPosition = positionAlongPath;

// Gestisci lo scroll del mouse
window.addEventListener(
  "wheel",
  (event) => {
    if (positionAlongPath > 0.999) return; // Blocca lo scroll alla fine del percorso
    const delta = event.deltaY > 0 ? 0.01 : -0.01;
    targetPosition = Math.min(Math.max(targetPosition + delta, 0), 1);
    event.preventDefault();
  },
  { passive: false }
);

let FinitoTunnel = false; //variabile che controlla l'uscita dal percorso e l'attivazione degli orbit controls
const desiredLookAt = new THREE.Vector3(-1, 0, 0); //ho dovuto metterlo ANCHE qui oltre che alla riga 211 per eliminare lo scattino che faceva a fine tunnel che guardava inizio splinePrincipale
function updateCamera() {
  if (FinitoTunnel) return; // Ferma aggiornamento automatico
  positionAlongPath += (targetPosition - positionAlongPath) * 0.1;

  const pos = splinePrincipale.getPointAt(positionAlongPath);
  camera.position.copy(pos);

  // Evita il lookAt che guarda indietro a fine tunnel
  if (positionAlongPath < 0.9999) {
    const lookAt = splinePrincipale.getPointAt(
      Math.min(positionAlongPath + 0.03, 1)
    );
    camera.lookAt(lookAt);
  } else if (positionAlongPath >= 0.9999) {
    camera.lookAt(desiredLookAt);
  }
}
//funzione per far muovere faccia di deriansky
function updatePlanePosition(positionAlongPath) {
  // Mappa positionAlongPath da [0, 0.1] a [0, 1]
  let t = THREE.MathUtils.clamp(positionAlongPath / 0.3, 0, 1);

  // Interpola tra startPosition e endPosition
  plane.position.lerpVectors(startPosition, endPosition, t);

  // Prendi il div con classe InformazioniBase e fallo scomparire quando sorpasso la faccia
  const infoDiv = document.querySelector(".InformazioniBase");
  if (!infoDiv) return;

  if (positionAlongPath >= 0.05) {
    infoDiv.style.opacity = "0";
    infoDiv.style.pointerEvents = "none";
  } else {
    infoDiv.style.opacity = "1";
    infoDiv.style.pointerEvents = "auto";
  }
}

//funzione per aggiornare il fov della telecamera pre e post faccia deriansky
function updateCameraFov(positionAlongPath) {
  // Quando positionAlongPath va da 0.25 a 0.3 facciamo il cambio FOV (fade-in)
  if (positionAlongPath >= 0.25 && positionAlongPath <= 0.3) {
    let t = (positionAlongPath - 0.25) / (0.3 - 0.25); // da 0 a 1 fra 0.25 e 0.3
    camera.fov = THREE.MathUtils.lerp(initialFov, finalFov, t);
    camera.updateProjectionMatrix();
  } else if (positionAlongPath < 0.25) {
    camera.fov = initialFov;
    camera.updateProjectionMatrix();
  } else if (positionAlongPath > 0.3) {
    camera.fov = finalFov;
    camera.updateProjectionMatrix();
  }
}

// Obiettivo finale (parallelo all'asse X)
const targetQuaternion = new THREE.Quaternion();
targetQuaternion.setFromEuler(new THREE.Euler(0, 0, 0)); // 90° lungo l'asse Y

let initialLookAtDirection = null;
let lookAtCaptured = false;

function EndOfTunnel(positionAlongPath) {
  if (positionAlongPath >= 0.865 && positionAlongPath < 0.9999) {
    const t = THREE.MathUtils.clamp((positionAlongPath - 0.9) / 0.1, 0, 1);

    // Interpola l'orientamento
    const currentQuaternion = camera.quaternion.clone();
    currentQuaternion.slerp(targetQuaternion, t);
    camera.quaternion.copy(currentQuaternion);

    // Salva la direzione iniziale una sola volta
    if (!lookAtCaptured) {
      initialLookAtDirection = new THREE.Vector3();
      camera.getWorldDirection(initialLookAtDirection);
      lookAtCaptured = true;
    }

    // Interpola dal lookAt iniziale a quello finale
    const desiredLookAt = new THREE.Vector3(-1, 0, 0);
    const interpolatedLookAt = initialLookAtDirection
      .clone()
      .lerp(desiredLookAt, t);
    camera.lookAt(camera.position.clone().add(interpolatedLookAt));
  }

  if (!FinitoTunnel && positionAlongPath >= 0.9999) {
    FinitoTunnel = true;
    camera.updateProjectionMatrix();

    // Attiva OrbitControls per rotazione orizzontale libera
    controls.enabled = true;
    controls.enablePan = false;
    controls.enableZoom = false;

    controls.minPolarAngle = Math.PI / 2;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minAzimuthAngle = -Infinity;
    controls.maxAzimuthAngle = Infinity;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = -0.3; //ho messo il meno per invertire il senso di rotazione

    console.log("Uscito dal tunnel, controlli attivati");
  }
}

//RENDE OGGETTI CLICCABILI
window.addEventListener("click", (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(getClickableModels(), true);
  if (intersects.length > 0) {
    let selected = intersects[0].object;
    while (selected.parent && !getClickableModels().includes(selected)) {
      selected = selected.parent;
    }
    focusModelOnCamera(selected);
  }
});


//CAMBIA POINTER SU OGGETTO CLICCCABILE
window.addEventListener("mousemove", (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
});

let isHoveringClickable = false;

function updateCursorOnHover() {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(getClickableModels(), true);

  if (intersects.length > 0) {
    if (!isHoveringClickable) {
      document.body.style.cursor = "pointer";
      isHoveringClickable = true;
    }
  } else {
    if (isHoveringClickable) {
      document.body.style.cursor = "default";
      isHoveringClickable = false;
    }
  }
}

createFadeCone(scene); // Crea il cono inizialmente invisibile che oscura i modelli cliccabili dopo averne cliccato uno

//funzione di animazione per gestire le varie funzioni
function animate() {
  requestAnimationFrame(animate);
  updateCamera();
  // Aggiorna posizione del piano basata sulla posizione della telecamera lungo il percorso
  updatePlanePosition(positionAlongPath);
  //aggiorna il fov della telecamera pre e post faccia deriansky
  updateCameraFov(positionAlongPath);
  //aggiorna posizione e lookAt a fine tunnel
  EndOfTunnel(positionAlongPath);
  //aggiorna il cursore sui modelli cliccabili
  RuotaModels();
  updateCursorOnHover();
  updateFocusedModel(camera);
  renderer.render(scene, camera);
  controls.update();
}

animate();


