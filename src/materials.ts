import { DoubleSide, MeshLambertMaterial } from 'three';
import * as THREE from 'three';

export const defaultColor = new THREE.Color(0x156289);
export const hoveredColor = new THREE.Color(0xf7ab4d);
export const selectionColor = new THREE.Color(0xff0000);

export const defaultMaterial = new MeshLambertMaterial({
  color: 0x156289,
  emissive: 0x072534,
  side: DoubleSide,
  // flatShading: true,
});

export const hoverMaterial = new MeshLambertMaterial({
  color: 0xf7ab4d,
  emissive: 0x072534,
  side: DoubleSide,
  // flatShading: true,
});

export const selectionMaterial = new MeshLambertMaterial({
  color: 0xff0000,
  emissive: 0x072534,
  side: DoubleSide,
  // flatShading: true,
});
