import * as THREE from 'three';
import Stats from 'stats.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type RequestID = number;

export type ThreeWrapperOptions = {
  onClick?: (intersection: THREE.Intersection | null, event: MouseEvent) => void;
  onHover?: (intersection: THREE.Intersection | null) => void;
  onTick?: (time: number, delta: number) => void;
  onResize?: () => void;
  raycasterFilter?: (obj: THREE.Intersection) => boolean;
  statsMode?: 0 | 1 | 2; // 0: fps, 1: ms, 2: mb
  fpsLimit?: number;
};

export class ThreeWrapper {
  private stats: Stats | null = null;

  private width: number;
  private height: number;

  private _scene: THREE.Scene;
  get scene(): THREE.Scene {
    return this._scene;
  }

  private _renderer: THREE.WebGLRenderer;
  get renderer(): THREE.WebGLRenderer {
    return this._renderer;
  }

  private _camera: THREE.OrthographicCamera;
  get camera(): THREE.OrthographicCamera {
    return this._camera;
  }

  private _controls: OrbitControls;
  get controls(): OrbitControls {
    return this._controls;
  }

  private raycaster: THREE.Raycaster;
  private mouseVector: THREE.Vector3;
  // private hoveredObject: THREE.Object3D | null = null;

  private _interactiveElements: THREE.Object3D[] = [];
  get interactiveElements(): THREE.Object3D[] {
    return this._interactiveElements;
  }

  set interactiveElements(elements: THREE.Object3D[]) {
    this._interactiveElements = elements;
  }

  private requestID: RequestID | null = null;
  private clock = new THREE.Clock();
  private delta = 0;
  private interval: number | null = null;

  constructor(private readonly hostElement: HTMLDivElement, private readonly options: ThreeWrapperOptions = {}) {
    if (this.options.statsMode != null) {
      this.stats = new Stats();
      this.stats.showPanel(this.options.statsMode);
      this.stats.dom.style.position = 'absolute';
      this.stats.dom.style.zIndex = '14';
      this.stats.dom.style.left = '';
      this.stats.dom.style.right = '0px';
      hostElement.appendChild(this.stats.dom);
    }

    this.width = this.hostElement.clientWidth;
    this.height = this.hostElement.clientHeight;

    this._scene = this.createScene();
    this._renderer = this.createRenderer();
    this._camera = this.createCamera();
    this._controls = this.createOrbitControls();

    this.raycaster = new THREE.Raycaster();
    this.mouseVector = new THREE.Vector3();

    this.addEventListeners();

    this.hostElement.appendChild(this._renderer.domElement);
    if (this.options.fpsLimit) this.interval = 1 / this.options.fpsLimit;

    this.startAnimationLoop();
  }

  update() {
    this.clear(this._scene);
    this._interactiveElements = [];
  }

  private createRenderer = (): THREE.WebGLRenderer => {
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setSize(this.width, this.height);
    return renderer;
  };

  private createScene = (): THREE.Scene => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color().set(0xf3f4f5);
    return scene;
  };

  private createCamera = (): THREE.OrthographicCamera => {
    const camera = new THREE.OrthographicCamera(
      this.width / -2,
      this.width / 2,
      this.height / 2,
      this.height / -2,
      -2000,
      2000,
    );
    return camera;
  };

  private createOrbitControls = (): OrbitControls => {
    const orbitControls = new OrbitControls(this._camera, this.hostElement);

    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.6;
    orbitControls.screenSpacePanning = false;

    orbitControls.rotateSpeed = 1.0;
    orbitControls.zoomSpeed = 1.2;
    orbitControls.panSpeed = 0.8;
    orbitControls.update();
    return orbitControls;
  };

  private addEventListeners = () => {
    window.addEventListener('resize', this.handleWindowResize);
    this._renderer.domElement.addEventListener('mousemove', this.handleMouseMove, false);
    if (window.PointerEvent) {
      this._renderer.domElement.addEventListener('pointerdown', this.handleClick, false);
    } else {
      this._renderer.domElement.addEventListener('mousedown', this.handleClick, false);
    }
    this._controls.addEventListener('change', this.handleOrbitChange);
  };

  private removeEventListeners = () => {
    window.removeEventListener('resize', this.handleWindowResize);
    this._renderer.domElement.removeEventListener('mousemove', this.handleMouseMove);
    if (window.PointerEvent) {
      this._renderer.domElement.removeEventListener('pointerdown', this.handleClick);
    } else {
      this._renderer.domElement.addEventListener('mousedown', this.handleClick);
    }
    this._controls.addEventListener('change', this.handleOrbitChange);
  };

  public handleWindowResize = () => {
    this.width = this.hostElement.clientWidth;
    this.height = this.hostElement.clientHeight;

    this._camera.left = this.width / -2;
    this._camera.right = this.width / 2;
    this._camera.top = this.height / 2;
    this._camera.bottom = this.height / -2;

    if (this.options.onResize) {
      this.options.onResize();
    }

    this._renderer.setSize(this.width, this.height);
    this._camera.updateProjectionMatrix();
  };

  private handleClick = (e: MouseEvent) => {
    if (this.options.onClick) {
      const object = this.getIntersectObject(e); //?.object ?? null;
      this.options.onClick(object, e);
    }
  };

  private handleMouseMove = (e: any) => {
    const intersection = this.getIntersectObject(e);
    // this.hoveredObject = intersection?.object ?? null;
    if (this.options.onHover) this.options.onHover(intersection);
  };

  private getRayIntersects = (e: any) => {
    const x = (e.layerX / e.target.clientWidth) * 2 - 1;
    const y = -(e.layerY / e.target.clientHeight) * 2 + 1;
    this.mouseVector.set(x, y, 0.5);
    this.raycaster.setFromCamera(this.mouseVector, this._camera);
    return this.raycaster.intersectObjects(this._interactiveElements, true);
  };

  private getIntersectObject = (e: any) => {
    const intersects = this.getRayIntersects(e);

    let result = null;

    if (intersects.length > 0) {
      let res;
      if (this.options.raycasterFilter) {
        res = intersects.filter(this.options.raycasterFilter)[0];
      } else {
        res = intersects[0];
      }
      if (res) {
        result = res;
      } else {
        result = null;
      }
    } else {
      result = null;
    }

    return result;
  };

  private handleOrbitChange = (e: any) => {
    console.log(e);
  };

  startAnimationLoop = (time?: number) => {
    const requestID = window.requestAnimationFrame(this.startAnimationLoop);
    this.requestID = requestID;

    if (!time) {
      return;
    }

    if (this.interval === null) {
      this.tick(time);
    } else {
      this.delta += this.clock.getDelta();
      if (this.delta > this.interval) {
        this.tick(time);
        this.delta = this.delta % this.interval;
      }
    }
  };

  private tick = (time: number) => {
    this.stats?.begin();
    if (this.options.onTick) this.options.onTick(time, this.delta);
    this._controls.update();
    this._renderer.render(this._scene, this._camera);
    this.stats?.end();
  };

  stopAnimationLoop = () => {
    cancelAnimationFrame(this.requestID!);
    this.requestID = null;
  };

  stop = () => {
    this.stopAnimationLoop();
    this.removeEventListeners();
    this.clear(this._scene);
  };

  public clear = (obj: any) => {
    while (obj.children.length > 0) {
      this.clear(obj.children[0]);
      obj.remove(obj.children[0]);
    }
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
    if (obj.texture) obj.texture.dispose();
  };
}
