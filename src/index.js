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
const edgesGeo = new THREE.EdgesGeometry(
  new THREE.TubeGeometry(spline, 200, 0.119, 30, false),
  0.01 //questo valore se lo modifico cambia il numero di segmenti presenti nel tubo 0.1 
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
    if (positionAlongPath > 0.999) return;

    // Determina il moltiplicatore dinamico
    let multiplier;
    if (positionAlongPath < 0.3) {
      multiplier = 0.0007; // più veloce all'inizio
    } else if (positionAlongPath < 0.8) {
      multiplier = 0.0002; // velocità normale
    } else {
      multiplier = 0.0002; // più veloce verso la fine
    }

    // Applica la dinamica allo scrollSpeed
    let scrollSpeed = Math.sign(event.deltaY) * Math.min(Math.abs(event.deltaY) * multiplier, 0.007); // Limita la velocità di scorrimento

    targetPosition = Math.min(Math.max(targetPosition + scrollSpeed, 0), 1);
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

// Funzione per aggiornare la nebbia in base alla posizione lungo il percorso
function updateFog(positionAlongPath) {
  if (positionAlongPath < 0.28) {
    // Fog fittissima all'inizio
    scene.fog.near = 0.01;
    scene.fog.far = 0.1;

  } else if (positionAlongPath >= 0.28 && positionAlongPath < 0.4) {
    // Transizione da fog stretta a media
    let t = (positionAlongPath - 0.28) / 0.1; // da 0 a 1
    scene.fog.near = THREE.MathUtils.lerp(0.01, 2, t);
    scene.fog.far = THREE.MathUtils.lerp(0.1, 5, t);

  } else if (positionAlongPath >= 0.4 && positionAlongPath < 0.85) {
    // Fog stabile media
    scene.fog.near = 2;
    scene.fog.far = 5;

  } else if (positionAlongPath >= 0.85 && positionAlongPath < 0.85) {
    // Transizione da fog media a lontana
    let t = (positionAlongPath - 0.85) / 0.1; // da 0 a 1
    scene.fog.near = THREE.MathUtils.lerp(2, 5, t);
    scene.fog.far = THREE.MathUtils.lerp(5, 20, t);

  } else {
    // Fog finale molto lontana
    scene.fog.near = 5;
    scene.fog.far = 20;
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
    window.location.href = url;
  }, 1000); // deve combaciare con la transition nel CSS
}



//TESTI NAVBAR
const navLabels = []; // salva tutti i gruppi per l'animazione
const clickableNavs = []; // oggetti cliccabili
const labelRadius = 3.3;

// Definisci le etichette con angolo e link
const labelsData = [//questi dati non modificano nulla, perché le modifiche vanno fatte nella parte responsive
  { text: 'ABOUT', angle: Math.PI * 0.1, y: -0.97, link: '/flatfade' }, // basso
  { text: 'FLATFADE', angle: -Math.PI * 0.1, y: -0.97, link: '/about' }, // basso
  { text: 'SPECCHIO', angle: Math.PI * 0.04, y: 1.06, link: 'https://www.npmjs.com/package/troika-three-text' }, // alto
  { text: 'PSICHE', angle: -Math.PI * 0.04, y: 1.06, link: 'https://www.npmjs.com/package/troika-three-text' }, // alto
];

labelsData.forEach(data => {
  const group = new THREE.Group();

  // Troika Text
  const label = new Text();
  label.text = data.text;
  label.font = "/Fonts/ClashGrotesk/ClashGrotesk-Regular.ttf";
  label.fontSize = 0.07;
  label.color = data.text === "Specchio" ? 0xaaaaaa : 0xffffff;
  label.anchorX = 'center';
  label.anchorY = 'middle';
  label.userData.link = data.link;
  label.sync();

  // Sfondo nero
  const bgGeo = new THREE.PlaneGeometry(0.40, 0.12);
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
    let baseAngle = data.text === 'FLATFADE' ? Math.PI * 0.14 : 
                    data.text === 'ABOUT' ? -Math.PI * 0.14 :
                    data.text === 'PSICHE' ? Math.PI * 0.04 :
                    -Math.PI * 0.04;

    const newAngle = isMobile && data.y < 0 ? baseAngle * 0.6 : baseAngle;

    data.angle = newAngle;
    group.userData.originalAngle = newAngle;
  });
}

//rendiamo cliccabili le etichette della navbar
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
        window.location.href = link;
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


// Resize
window.addEventListener("resize", () => {
  updateNavLabelAngles(); //fa resize responsive delle etichette della navbar
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

