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

//FUNZIONE PER CARICARE I MODELLI
export function loadAndPlaceModels(scene) {
  const modelsData = [
    {
      path: "/models/Comp.gltf",
      pos: [-1.8, -0.1, 0],
      scale: 0.15,
      rotY: 60,
    },
    {
      path: "/models/barca.glb",
      pos: [-1.8, -0.1, 1],
      scale: 0.3,
      rotY: 60,
    },
    {
      path: "/models/treno.glb",
      pos: [-1.8, -0.1, -1],
      scale: 0.4,
      rotY: 0,
    },
    {
      path: "/models/farfalla.glb",
      pos: [-1.8, 0.5, -0.5],
      scale: 0.2,
      rotY: 60,
      material: "vetro",
    },
    {
      path: "/models/mano.glb",
      pos: [-1.8, 0.5, 0.5],
      scale: 0.2,
      rotY: 90,
      material: "metallo",
    },
    {
      path: "/models/tonno.glb",
      pos: [-1.8, -0.3, 0.5],
      scale: 0.2,
      rotY: 90,
      rotZ: -10,
    },
  ];

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
