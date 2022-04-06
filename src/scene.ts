import { ThreeWrapper } from './three-wrapper';
import * as THREE from 'three';
// import TWEEN from '@tweenjs/tween.js';

import {
  defaultColor,
  defaultMaterial,
  hoveredColor,
  hoverMaterial,
  selectionColor,
  selectionMaterial,
} from './materials';

let hovered: THREE.Object3D | null = null;
let selected: THREE.Object3D | null = null;

let hoveredInstanceId: number | null = null;
let selectedInstanceId: number | null = null;

const rowCount = 100;
const step = 0.1;
const defaultZoom = 90;

export function run(root: HTMLDivElement) {
  // THREE
  const three = new ThreeWrapper(root as HTMLDivElement, {
    onHover: (intersection) => {
      if (hovered) {
        if (hovered === selected) {
          (hovered as THREE.Mesh).material = selectionMaterial;
        } else {
          (hovered as THREE.Mesh).material = defaultMaterial;
        }
      }
      const obj = intersection?.object;
      const instanceId = intersection?.instanceId;
      if (obj) {
        if (!instanceId) {
          (obj as THREE.Mesh).material = hoverMaterial;
          hovered = obj;
        } else {
          const instanced = obj as THREE.InstancedMesh;
          if (instanceId !== hoveredInstanceId) {
            if (hoveredInstanceId) {
              instanced.setColorAt(hoveredInstanceId, defaultColor);
              if (instanced.instanceColor) {
                instanced.instanceColor.needsUpdate = true;
              }
            }
            hoveredInstanceId = instanceId;
            instanced.setColorAt(instanceId, hoveredColor);
            if (instanced.instanceColor) {
              instanced.instanceColor.needsUpdate = true;
            }
          }
        }
      }
    },
    onClick: (intersection) => {
      const obj = intersection?.object;
      const instanceId = intersection?.instanceId;
      if (obj) {
        if (selected) {
          (selected as THREE.Mesh).material = defaultMaterial;
        }
        if (!instanceId) {
          selected = obj;
          (selected as THREE.Mesh).material = selectionMaterial;
        } else {
          const instanced = obj as THREE.InstancedMesh;
          selectedInstanceId = instanceId;
          instanced.setColorAt(selectedInstanceId, selectionColor);
          if (instanced.instanceColor) {
            instanced.instanceColor.needsUpdate = true;
          }
        }
      } else {
        if (selected) {
          (selected as THREE.Mesh).material = defaultMaterial;
          selected = null;
        }
      }
    },
    statsMode: 0,
    fpsLimit: 60,
  });

  // CAMERA
  three.camera.zoom = defaultZoom;
  three.camera.position.set(10, 10, 10);
  three.camera.updateProjectionMatrix();

  // OBJECTS
  createEnvironment(three);
  createObjects(three);

  let isInstanced = false;

  document.addEventListener(
    'keydown',
    (e) => {
      switch (e.key) {
        case 'Escape':
          if (selected) {
            (selected as THREE.Mesh).material = defaultMaterial;
            selected = null;
          }
          break;
        case 'd':
          three.camera.zoom = defaultZoom;
          three.camera.position.set(10, 10, 10);
          three.camera.updateProjectionMatrix();
          break;
        case 't':
          three.camera.zoom = defaultZoom;
          three.camera.position.set(0, 19, 0);
          three.camera.updateProjectionMatrix();
          break;
        case 'i':
          console.log('Reset Scene');
          three.update();
          createEnvironment(three);
          if (!isInstanced) {
            console.log('Create Instanced');
            createInstancedObjects(three);
          } else {
            console.log('Create Naive');
            createObjects(three);
          }
          isInstanced = !isInstanced;
          break;
        default:
          break;
      }
    },
    false,
  );
}

const createEnvironment = (three: ThreeWrapper) => {
  three.scene.add(new THREE.AmbientLight(0xffffff, 1.0));
  const hemiLight = new THREE.HemisphereLight(0x000000, 0xffffff, 0.9);
  hemiLight.position.set(0, -250, 0);
  three.scene.add(hemiLight);
};

const createObjects = (three: ThreeWrapper) => {
  const boxSize = step * 0.8;

  const originX = (-rowCount / 2) * step;
  const originZ = (-rowCount / 2) * step;

  const geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);

  for (let i = 0; i < rowCount; i++) {
    for (let j = 0; j < rowCount; j++) {
      const x = originX + i * step;
      const z = originZ + j * step;

      const obj = new THREE.Mesh(geometry, defaultMaterial);
      obj.position.set(x, 0, z);
      obj.name = `object_${i}_${j}`;

      three.scene.add(obj);

      three.interactiveElements.push(obj);
    }
  }
};

const createInstancedObjects = (three: ThreeWrapper) => {
  const boxSize = step * 0.8;

  const originX = (-rowCount / 2) * step;
  const originZ = (-rowCount / 2) * step;

  const geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);

  const instancesCount = rowCount * rowCount;

  const obj = new THREE.InstancedMesh(geometry, defaultMaterial, instancesCount);
  obj.name = 'Instanced Mesh';

  let count = 0;
  for (let i = 0; i < rowCount; i++) {
    for (let j = 0; j < rowCount; j++) {
      const x = originX + i * step;
      const z = originZ + j * step;

      const matrix = new THREE.Matrix4();
      const position = new THREE.Vector3(x, 0, z);
      const rotation = new THREE.Euler();
      const quaternion = new THREE.Quaternion();
      const scale = new THREE.Vector3(1, 1, 1);
      quaternion.setFromEuler(rotation);
      matrix.compose(position, quaternion, scale);
      obj.setColorAt(count, defaultColor);
      obj.setMatrixAt(count, matrix);

      count++;
      // obj.position.set(x, 0, z);
      // obj.name = `object_${i}_${j}`;
    }
  }

  three.scene.add(obj);
  three.interactiveElements.push(obj);
};
