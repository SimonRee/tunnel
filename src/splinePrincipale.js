import * as THREE from "three";

// Linear segment points
const linearSegment = [18.0, 6.1, 0.0, 10.5, 7.08, 0.0];

// Curve path points
const curvePath = [
  10.5, 7.08, 0.0, 10.12, 7.12, 0.0, 9.49, 7.15, 0.0, 9.06, 7.04, 0.0, 8.74,
  6.73, 0.0, 8.45, 6.18, 0.0, 8.13, 5.35, 0.0, 7.7, 4.21, 0.0, 7.13, 3.0, 0.0,
  6.41, 2.15, 0.0, 5.55, 2.08, 0.0, 4.58, 2.72, 0.0, 3.61, 3.58, 0.0, 2.72,
  4.11, 0.0, 1.97, 4.07, 0.0, 1.38, 3.6, 0.0, 0.94, 2.87, 0.0, 0.64, 2.07, 0.0,
  0.5, 1.39, 0.0, 0.5, 1.0, 0.0, 0.0, 0.0, 0.0,
];

// Combine linear segment and curve path
const fullPath = [...linearSegment, ...curvePath];

// Construct tunnel track
const points = [];
const len = fullPath.length;
for (let p = 0; p < len; p += 3) {
  points.push(new THREE.Vector3(fullPath[p], fullPath[p + 1], fullPath[p + 2]));
}

const splinePrincipale = new THREE.CatmullRomCurve3(points);

export default splinePrincipale;
