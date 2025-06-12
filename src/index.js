import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import spline from "./spline.js";
import splinePrincipale from "./splinePrincipale.js";
import { modelsGroup, getFocusedModel, getIsResetting, loadAndPlaceModels,getClickableModels,RuotaModels,focusModelOnCamera,updateFocusedModel, createFadeCone } from "./models.js";
import { Text } from 'troika-three-text';

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

const cameraWrapper = new THREE.Object3D();
cameraWrapper.add(camera);
scene.add(cameraWrapper);

//FOV della telecamera pre e post faccia deriansky
const initialFov = 25; // esempio valore iniziale FOV per vedere tutta la faccia è 30
const finalFov = 40; // valore finale FOV a cui vuoi arrivare

loadAndPlaceModels(scene, camera); //per mettere i modelli 3D da models.js

const light = new THREE.AmbientLight(0xffffff, 10); // soft white light
scene.add(light);
const DirL = new THREE.DirectionalLight(0xffffff, 10);
DirL.position.set(0, 10, 0);
scene.add(DirL);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//creazione dello skybox con la texture delle linee
const loader = new THREE.CubeTextureLoader();
const skyboxTexture = loader.load([
  '/white.jpg', // px
  '/white.jpg', // nx
  '/white.jpg', // py
  '/white.jpg', // ny
  '/white.jpg', // pz
  '/white.jpg',  // nz
]);
scene.background = skyboxTexture; // opzionale, se vuoi vedere lo sfondo
scene.environment = skyboxTexture; // importante per riflessi PBR
scene.background = null;
scene.environment = skyboxTexture;

//controlli per la camera
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
  alphaTest: 0.01, // importante per eliminare artefatti ai bordi
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
const radialSegments = 50;
const heightSegments = 13;

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
  const y = (i / heightSegments - 0.5) * cylinderHeight - 0.1; // -0.1 sposta le righe sull'asse Y
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

// Geometria del cerchio (raggio 4, 64 segmenti per una forma liscia)
const circleCount = 50;
const baseY = -1.95; // punto più basso del cilindro
const stepY = 0.008; // distanza verticale tra i cerchi
const radius = 4.2;

for (let i = 0; i < circleCount; i++) {
  const opacity = (i / circleCount) * 0.11; // più in alto = meno opaco
  const circleGeo = new THREE.CircleGeometry(radius, 16);
  const circleMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: opacity,
    depthWrite: false // evita artefatti visivi
  });

  const circle = new THREE.Mesh(circleGeo, circleMat);
  circle.rotation.x = -Math.PI / 2;
  circle.position.y = baseY + i * stepY;
  scene.add(circle);
}

/*
const ringCount = 6;
const baseY = -cylinderHeight / 2 + 0.01;
const radialGroup = new THREE.Group();

for (let i = 1; i <= ringCount; i++) {
  const radius = (cylinderRadius / ringCount) * i;
  const ringGeo = new THREE.RingGeometry(radius - 0.005, radius + 0.005, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 1,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = baseY;

  radialGroup.add(ring); // aggiunto al gruppo
}

const radialLines = 50;
for (let i = 0; i < radialLines; i++) {
  const angle = (i / radialLines) * Math.PI * 2;
  const x = Math.cos(angle) * cylinderRadius;
  const z = Math.sin(angle) * cylinderRadius;

  const points = [new THREE.Vector3(0, baseY, 0), new THREE.Vector3(x, baseY, z)];
  const geom = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
  const line = new THREE.Line(geom, mat);

  radialGroup.add(line); // aggiunto al gruppo
}

scene.add(radialGroup);
radialGroup.position.set(0, 0.09, 0); // Posiziona il gruppo al centro della scena
radialGroup.rotation.set(0, Math.PI*0.5, 0); // Ruota il gruppo per allinearlo con l'asse Y
radialGroup.scale.set(0.965, 0.965, 0.965); // Mantieni la scala originale
*/
// Creazione del cilindro PIENO PER NON VEDERE IL TUNNEL
const cylinderPIENO = new THREE.CylinderGeometry(4.1,4.1,4,64,1,true);
const materialPIENO = new THREE.MeshBasicMaterial({ color: 0x000000,transparent: false, opacity: 1,side: THREE.BackSide});
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
// --- PARAMETRI ---
const tubularSegments = 200;
const radialTubeSegments = 30;
const tubeRadius = 0.119;

// Geometria leggermente più piccola per evitare sovrapposizione con il tubo nero
const geo = new THREE.TubeGeometry(spline, tubularSegments, tubeRadius, radialTubeSegments, false);
const posAttr = geo.attributes.position;
const customPoints = [];

const ringVertices = radialTubeSegments + 1;

// === LINEE VERTICALI (lungo la spline) ===
for (let j = 0; j < tubularSegments; j++) {
  for (let i = 0; i < radialTubeSegments; i++) {
    const index1 = j * ringVertices + i;
    const index2 = (j + 1) * ringVertices + i;

    const x1 = posAttr.getX(index1);
    const y1 = posAttr.getY(index1);
    const z1 = posAttr.getZ(index1);

    const x2 = posAttr.getX(index2);
    const y2 = posAttr.getY(index2);
    const z2 = posAttr.getZ(index2);

    customPoints.push(x1, y1, z1);
    customPoints.push(x2, y2, z2);
  }
}

// === LINEE CIRCOLARI (intorno alla parete del tubo) ===
for (let j = 0; j <= tubularSegments; j++) {
  for (let i = 0; i < radialTubeSegments; i++) {
    const index1 = j * ringVertices + i;
    const index2 = j * ringVertices + (i + 1);

    const x1 = posAttr.getX(index1);
    const y1 = posAttr.getY(index1);
    const z1 = posAttr.getZ(index1);

    const x2 = posAttr.getX(index2);
    const y2 = posAttr.getY(index2);
    const z2 = posAttr.getZ(index2);

    customPoints.push(x1, y1, z1);
    customPoints.push(x2, y2, z2);
  }
}

// === GEOMETRIA E LINESEGMENTS ===
const customGeo = new THREE.BufferGeometry();
customGeo.setAttribute("position", new THREE.Float32BufferAttribute(customPoints, 3));

const customLines = new THREE.LineSegments(
  customGeo,
  new THREE.LineBasicMaterial({ color: 0xffffff })
);
scene.add(customLines);

// Aggiungi una variabile per tenere traccia della posizione lungo il percorso principale
let positionAlongPath = 0;
let targetPosition = positionAlongPath;


// Gestisci lo scroll del mouse
let autoScrollFromStart = false; //gestisce inizio tunnel
let autoScrollToEnd = false;// gestisce fine tunnel

window.addEventListener(
  "wheel",
  (event) => {
    if (positionAlongPath >= 0.9999 || autoScrollToEnd) return;

    // Trigger iniziale: da 0.1 a 0.35 automatico
    if (positionAlongPath < 0.35 && !autoScrollFromStart) {
      autoScrollFromStart = true;
      targetPosition = 0.35;
      return;
    }

    // tirgger finale: da 0.8 a 1.0 automatico
    if (positionAlongPath > 0.8) {
      autoScrollToEnd = true;
      // Imposta l'obiettivo finale
      targetPosition = 1;

    } else {
      // Dinamica normale nelle fasi iniziali
      let baseMultiplier;

      if (positionAlongPath < 0.3) {
        baseMultiplier = 0.00005; //GESTISCE IL PRIMISSIMO SCROLL
      } else if (positionAlongPath < 0.8) {
        baseMultiplier = 0.0002;
      } else {
        baseMultiplier = 0.0002;
      }

      let scrollSpeed = Math.sign(event.deltaY) * Math.min(Math.abs(event.deltaY) * baseMultiplier, 0.007);
      targetPosition = Math.min(Math.max(targetPosition + scrollSpeed, 0), 1);
    }

    event.preventDefault();
  },
  { passive: false }
);

let FinitoTunnel = false; //variabile che controlla l'uscita dal percorso e l'attivazione degli orbit controls
const desiredLookAt = new THREE.Vector3(-1, 0, 0); //ho dovuto metterlo ANCHE qui oltre che alla riga 211 per eliminare lo scattino che faceva a fine tunnel che guardava inizio splinePrincipale


// Funzione per aggiornare la posizione della camera lungo il percorso
function updateCamera() {
  if (FinitoTunnel) return; // Ferma aggiornamento automatico

  //gestiamo la velocità della camera in base alla posizione lungo il percorso

  let lerpSpeed = 0.1;//velocità della camera dentro il tunnel

  //velocità camera alla fine del tunnel durante l'auto scroll
  if (autoScrollToEnd && positionAlongPath > 0.8) {
  const t = (positionAlongPath - 0.8) / (1 - 0.8); // da 0 a 1
  const easedT = Math.pow(t, 3); // ease-in cubic
  lerpSpeed = THREE.MathUtils.lerp(0.01, 0.04, easedT); 
  // parte lento (0.01), poi accelera fino a 0.08
  } 
  //velocità camera prima del tunnel durante l'auto scroll
  else if (autoScrollFromStart && positionAlongPath < 0.35) {
  const t = positionAlongPath / 0.35; // da 0 a 1
  const easedT = 1 - Math.pow(1 - t, 3); // ease-out cubic
  lerpSpeed = THREE.MathUtils.lerp(0.001, 0.05, easedT); 
  // parte a 0.08 veloce, arriva a 0.015 lento
  }
  else if (positionAlongPath >= 0.35 && positionAlongPath < 0.45) {
  // Transizione graduale tra 0.02 e 0.1
  lerpSpeed = THREE.MathUtils.lerp(0.02, 0.1, (positionAlongPath - 0.35) / 0.1);
  }
  
  positionAlongPath += (targetPosition - positionAlongPath) * lerpSpeed;

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

//funzione per far MUOVERE FACCIA DERIANSKY
function updatePlanePosition(positionAlongPath) {
  // Mappa positionAlongPath da [0, 0.1] a [0, 1]
  let t = THREE.MathUtils.clamp(positionAlongPath / 0.35, 0, 1); //0.35 bisogna mettere la positionAlonghPath della transizione iniziale fra 0 e il numero desiderato in questo caso (0.35)
  t = 1 - Math.pow(1 - t, 3);
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

// Funzione per aggiornare la nebbia in base alla posizione lungo il percorso
function updateFog(positionAlongPath) {
  if (positionAlongPath < 0.28) {
    // Fog fittissima all'inizio
    scene.fog.near = 0.01;
    scene.fog.far = 0.1;

  } else if (positionAlongPath < 0.4) {
    // Transizione da fitta a media
    let t = (positionAlongPath - 0.28) / 0.12;
    scene.fog.near = THREE.MathUtils.lerp(0.01, 2, t);
    scene.fog.far = THREE.MathUtils.lerp(0.1, 4, t);

  } else if (positionAlongPath < 0.85) {
    // Fog stabile media
    scene.fog.near = 2;
    scene.fog.far = 4;

  } else {
    // Transizione dolce da fog densa a trasparente (da 0.85 a 1.0)
    let t = (positionAlongPath - 0.85) / 0.15; // da 0 a 1 tra 0.85 e 1.0
    t = THREE.MathUtils.clamp(t, 0, 1); // sicurezza

    // Usa easing per una transizione più cinematografica
    const easeT = t * t * (3 - 2 * t); // easing in-out (smoothstep)

    scene.fog.near = THREE.MathUtils.lerp(0.5, 5, easeT);
    scene.fog.far = THREE.MathUtils.lerp(1.5, 25, easeT);
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


//variabili per sistemare errore nel drag che attiva anche gli oggetti cliccabili passandoci sopra
let mouseDownPos = new THREE.Vector2();
let isDragging = false;

// Gestione del mouse per il drag per evitare che il click attivi anche gli oggetti cliccabili quando si fa drag
window.addEventListener("mousedown", (event) => {
  mouseDownPos.set(event.clientX, event.clientY);
  isDragging = false;
});

window.addEventListener("mousemove", (event) => {
  const dx = event.clientX - mouseDownPos.x;
  const dy = event.clientY - mouseDownPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > 5) {
    isDragging = true;
  }
});


//RENDE OGGETTI CLICCABILI
window.addEventListener("click", (event) => {

  if (isDragging) {
    mouse.clicked = false;
    return; // blocca il click se era un drag, aggiunto per evitare che il click attivi anche gli oggetti cliccabili quando si fa drag
  }

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Click su modelli 3D cliccabili
  const intersects = raycaster.intersectObjects(getClickableModels(), true);
  if (intersects.length > 0) {
    let selected = intersects[0].object;
    while (selected.parent && !getClickableModels().includes(selected)) {
      selected = selected.parent;
    }
    

    // Reset scala prima del focus. in modo tale che l'hover che ingrandisce non interferisca con il cambio di scala della funzione focusModelOnCamera
    if (selected.userData.originalScale) {
      selected.scale.setScalar(selected.userData.originalScale);
    }
    focusModelOnCamera(selected);
    mouse.clicked = true;
  }
  
   // Click su testi della navbar
  const intersectsNav = raycaster.intersectObjects(clickableNavs, true);
  if (intersectsNav.length > 0) {
    let selected = intersectsNav[0].object;
    while (selected.parent && !clickableNavs.includes(selected)) {
      selected = selected.parent;
    }

  const link = selected.userData.link; // questo pezzo fa la transizione al nero e mi porta al nuovo link
    if (link) {
    fadeToBlackAndRedirect(link);
  }
  }
});



//CAMBIA POINTER SU OGGETTO CLICCCABILE
window.addEventListener("mousemove", (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
});

let isHoveringClickable = false;
let hoveredModel = null;
const nameDiv = document.getElementById("model-name"); // creata una variabile del div per mostrare il nome del modello

//funzione che gestisce il cursore quando si passa sopra i modelli cliccabili
function updateCursorOnHover() {
  if (getIsResetting()) return; // Se stai resettando, non fare nulla

  // Evita l'hover e il cursore pointer se siamo ancora nel tunnel
  if (positionAlongPath <= 0.99) {
    document.body.style.cursor = "default";
    isHoveringClickable = false;
    hoveredModel = null;
    nameDiv.style.opacity = "0";
    nameDiv.textContent = "";
    return;
  }

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(getClickableModels(), true);

  if (intersects.length > 0) {
    let selected = intersects[0].object;
    while (selected.parent && !getClickableModels().includes(selected)) {
      selected = selected.parent;
    }

    document.body.style.cursor = "pointer";
    isHoveringClickable = true;

    // Mostra il nome del modello
    nameDiv.textContent = selected.userData.name || "Untitled";
    nameDiv.style.opacity = "1";

    if (hoveredModel !== selected && selected !== getFocusedModel()) {
      // Reset al target scale di tutti
      getClickableModels().forEach((model, i) => {
        const original = modelsGroup.children[i];
        const originalScale = original.userData.originalScale || original.scale.x;
        model.userData.originalScale = originalScale;
        model.userData.targetScale = originalScale;
      });

      // Imposta la nuova scala target solo sul selezionato
      const base = selected.userData.originalScale || selected.scale.x;
      selected.userData.originalScale = base;
      selected.userData.targetScale = base * 1.15; // Ingrandisce il modello quando hoverato

      hoveredModel = selected;
    }

  } else {
    if (isHoveringClickable) {
      document.body.style.cursor = "default";
      isHoveringClickable = false;
    }

    // Nasconde il nome se non c'è hover
    nameDiv.style.opacity = "0";
    nameDiv.textContent = "";

    // Reset della scala target se non stai hoverando nulla
    getClickableModels().forEach((model, i) => {
      const original = modelsGroup.children[i];
      const originalScale = original.userData.originalScale || original.scale.x;
      model.userData.originalScale = originalScale;
      model.userData.targetScale = originalScale;
    });

    hoveredModel = null;
  }
}



function updateHoveredScales() {
  getClickableModels().forEach((model) => {
  if (model === getFocusedModel()) return; //  Salta lerp su modello cliccato
    if (model.userData.targetScale !== undefined) {
      const current = model.scale.x;
      const target = model.userData.targetScale;
      const newScale = THREE.MathUtils.lerp(current, target, 0.1);
      model.scale.set(newScale, newScale, newScale);
    }
  });
}

createFadeCone(scene); // Crea il cono inizialmente invisibile che oscura i modelli cliccabili dopo averne cliccato uno



//fading quando si clicca un link della navbar
function fadeToBlackAndRedirect(url) {
  const fadeDiv = document.getElementById("black-fade");
  fadeDiv.style.pointerEvents = "auto";
  fadeDiv.style.opacity = "1";

  // Dopo il tempo della transizione, fai il redirect
  setTimeout(() => {
    window.top.location.href = url;
  }, 1000); // deve combaciare con la transition nel CSS
}



//TESTI NAVBAR
const navLabels = []; // salva tutti i gruppi per l'animazione
const clickableNavs = []; // oggetti cliccabili
const labelRadius = 3.3;

// Definisci le etichette con angolo e link
const labelsData = [//questi dati non modificano nulla, perché le modifiche vanno fatte nella parte responsive
  { text: 'ABOUT', angle: Math.PI * 0.1, y: -0.97, link: '/about' }, // basso
  { text: 'FLATFADE', angle: -Math.PI * 0.1, y: -0.97, link: 'https://wddc-groupieml.webflow.io/psiche' }, // basso
  { text: 'PSICHE', angle: -Math.PI * 0.04, y: 1.06, link: 'https://wddc-groupieml.webflow.io/psiche?skipTunnel=true' }, // alto
  { text: 'SPECCHIO', angle: Math.PI * 0.04, y: 1.06, link: 'https://wddc-groupieml.webflow.io/specchio' }, // alto
];

labelsData.forEach(data => {
  const group = new THREE.Group();

  // Troika Text
  const label = new Text();
  label.text = data.text;
  label.font = "/Fonts/ClashGrotesk/ClashGrotesk-Regular.ttf";
  label.fontSize = 0.07;
  label.color = data.text === "SPECCHIO" ? 0xaaaaaa : 0xffffff;
  label.anchorX = 'center';
  label.anchorY = 'middle';
  label.outlineWidth = 0.0001; //  0.005 ≈ 1px 
  label.outlineColor = 0xffffff; // colore del bordo
  label.userData.link = data.link;
  label.sync();

  // Sfondo nero
  const bgGeo = new THREE.PlaneGeometry(0.36, 0.12);
  const bgMat = new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 1, transparent: true });
  const bg = new THREE.Mesh(bgGeo, bgMat);
  bg.position.z = -0.01;

  group.add(bg);
  group.add(label);

  // Posizione curva sul cilindro
  const angle = data.angle;
  group.userData.originalAngle = angle; // salva l'angolo originale
  group.position.x = Math.cos(angle) * labelRadius;
  group.position.z = Math.sin(angle) * labelRadius;
  group.position.y = data.y;

  group.userData.link = data.link;

  scene.add(group);
  group.visible = false; // inizialmente invisibili
  navLabels.push(group);
  clickableNavs.push(group);
});

//per rendere responsive le etichette della NavBar
function updateNavLabelAngles() {
  const isMobile = window.innerWidth < 768;

  navLabels.forEach((group, index) => {
    const data = labelsData[index];
    
    // Calcolo nuovo angolo solo se la y è negativa (etichette in basso)
    let baseAngle = data.text === 'ABOUT' ? Math.PI * 0.14 : 
                    data.text === 'FLATFADE' ? -Math.PI * 0.14 :
                    data.text === 'SPECCHIO' ? Math.PI * 0.04 :
                    data.text === 'PSICHE' ?-Math.PI * 0.04: 0;

    const newAngle = isMobile && data.y < 0 ? baseAngle * 0.6 : baseAngle;

    data.angle = newAngle;
    group.userData.originalAngle = newAngle;
  });
}

//rende cliccabili le etichette della navbar
function updateNavInteractions() {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableNavs, true);

  if (intersects.length > 0) {
    const hovered = intersects[0].object.parent; // Prendiamo il gruppo

    document.body.style.cursor = "pointer";

    clickableNavs.forEach(group => {
      const scaleTarget = group === hovered ? 1.1 : 1;
      group.scale.lerp(new THREE.Vector3(scaleTarget, scaleTarget, scaleTarget), 0.1);
    });

    // Click handling (solo se è stato cliccato e non solo hoverato)
    if (mouse.clicked) {
      const link = hovered.userData.link;
      if (link) {
        window.top.location.href = link;
      }
    }

  } else {
    document.body.style.cursor = "default";
    clickableNavs.forEach(group => {
      group.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    });
  }
  mouse.clicked = false; // Reset dopo il click
}



//funzione di animazione per gestire le varie funzioni
function animate() {
  requestAnimationFrame(animate);
  updateCamera();
  // Aggiorna posizione del piano basata sulla posizione della telecamera lungo il percorso
  updatePlanePosition(positionAlongPath);
  //aggiorna il fov della telecamera pre e post faccia deriansky
  updateCameraFov(positionAlongPath);
  //aggiorna la nebbia in base alla posizione lungo il percorso
  updateFog(positionAlongPath);
  //aggiorna posizione e lookAt a fine tunnel
  EndOfTunnel(positionAlongPath);
  //aggiorna il cursore sui modelli cliccabili
  RuotaModels();

  //questo in base a dove si trova il cursore fa fare dei tilt alla camera, per togliero ricorda di eliminare anche camera wrapper
  if (!FinitoTunnel || (FinitoTunnel && controls.enabled)) {
  const maxTilt = THREE.MathUtils.degToRad(0.05);
  const targetTiltX = -mouse.y * maxTilt;
  const targetTiltY = -mouse.x * maxTilt;
  const targetTiltZ = -mouse.y * maxTilt;

  cameraWrapper.rotation.x = THREE.MathUtils.lerp(cameraWrapper.rotation.x, targetTiltX, 0.03);
  cameraWrapper.rotation.y = THREE.MathUtils.lerp(cameraWrapper.rotation.y, targetTiltY, 0.03);
  cameraWrapper.rotation.z = THREE.MathUtils.lerp(cameraWrapper.rotation.z, targetTiltZ, 0.03);
  }
  

  // Calcola l'angolo Y della camera (orientamento orizzontale) fa seguire i label alla camera
  const cameraQuaternion = camera.quaternion.clone();
  const euler = new THREE.Euler().setFromQuaternion(cameraQuaternion, 'YXZ');
  const cameraRotationY = euler.y;
  // Applica una rotazione inversa alle label per farle "seguire" la camera
  navLabels.forEach(group => {
    const angle = group.userData.originalAngle;
    const radius = labelRadius;
    const totalAngle = angle - cameraRotationY + Math.PI*1.5 //il meno -cameraRotationY serve per farle ruotare nell'altro senso come con gli orbit controls const totalAngle = angle - cameraRotationY + Math.PI*0.5;

    group.position.x = Math.cos(totalAngle) * radius;
    group.position.z = Math.sin(totalAngle) * radius;

    group.lookAt(0, group.position.y, 0); // Fa sì che guardino sempre il centro
  });

  const showNavbar = positionAlongPath > 0.99; //la navbar appare solo dopo il tunnel
    navLabels.forEach(group => {
    group.visible = showNavbar;
  });
  
  //aggiorna le etichette della navbar in base alla dimensione dello schermo
  updateNavLabelAngles();
  //gestione hover e click sulle etichette della navbar
  updateNavInteractions();
  //gestione dell'hover e click sui modelli 3D
  updateCursorOnHover();
  updateFocusedModel(camera);
  updateHoveredScales();
  renderer.render(scene, camera);
  controls.update();
}

animate();


// RICEVE MESSAGGIO DA WEBFLOW PER SALTARE IL TUNNEL
window.addEventListener("message", function(event) {
  if (event.data && event.data.type === "skipTunnel") {
    positionAlongPath = 1;
    targetPosition = 1;
    FinitoTunnel = true;

    const finalPos = splinePrincipale.getPointAt(1);
    camera.position.copy(finalPos);
    camera.lookAt(new THREE.Vector3(-1, 0, 0));

    controls.enabled = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = Math.PI / 2;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minAzimuthAngle = -Infinity;
    controls.maxAzimuthAngle = Infinity;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = -0.3;

    console.log("Messaggio ricevuto da Webflow: skipTunnel → salto tunnel");
  }
});

// Resize
window.addEventListener("resize", () => {
  updateNavLabelAngles(); //fa resize responsive delle etichette della navbar
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

