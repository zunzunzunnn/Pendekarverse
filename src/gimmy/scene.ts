import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Quality } from "./rules";
export class GimmyScene {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-100, 100, 100, -100, 0.1, 2000);
  mixer?: THREE.AnimationMixer;
  actions = new Map<string, THREE.AnimationAction>();
  current?: THREE.AnimationAction;
  ready = false;
  constructor(
    public canvas: HTMLCanvasElement,
    quality: Quality,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: quality !== "low",
      powerPreference: "low-power",
    });
    this.renderer.setClearColor(0, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene.add(new THREE.HemisphereLight(0xb9dfff, 0x6c4036, 2));
    const light = new THREE.DirectionalLight(0xffdfb0, 2.5);
    light.position.set(-80, 160, 200);
    this.scene.add(light);
    const rim = new THREE.DirectionalLight(0x76bfff, 2);
    rim.position.set(100, 60, -100);
    this.scene.add(rim);
    this.quality(quality);
  }
  quality(q: Quality) {
    this.renderer.setPixelRatio(
      Math.min(devicePixelRatio, q === "low" ? 1 : q === "medium" ? 1.5 : 2),
    );
    this.resize();
  }
  resize() {
    const w = this.canvas.clientWidth,
      h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.left = (-65 * w) / h;
    this.camera.right = (65 * w) / h;
    this.camera.top = 65;
    this.camera.bottom = -65;
    this.camera.updateProjectionMatrix();
  }
  async load() {
    const gltf = await new GLTFLoader().loadAsync(
      `${import.meta.env.BASE_URL}gimmy/gimmy.glb`,
    );
    this.scene.add(gltf.scene);
    this.mixer = new THREE.AnimationMixer(gltf.scene);
    for (const clip of gltf.animations)
      this.actions.set(
        clip.name.split("|").pop()!.trim(),
        this.mixer.clipAction(clip),
      );
    this.play("Sleeping Idle");
    this.mixer.update(0.5);
    gltf.scene.updateMatrixWorld(true);
    const center = new THREE.Box3()
      .setFromObject(gltf.scene)
      .getCenter(new THREE.Vector3());
    this.camera.position.copy(center).add(new THREE.Vector3(0, 95, 250));
    this.camera.lookAt(center);
    this.ready = true;
    this.resize();
  }
  play(name: string, once = false) {
    const action = this.actions.get(name);
    if (!action || action === this.current) return;
    const old = this.current;
    action.reset();
    action.setLoop(
      once ? THREE.LoopOnce : THREE.LoopRepeat,
      once ? 1 : Infinity,
    );
    action.clampWhenFinished = once;
    action.play();
    if (old) action.crossFadeFrom(old, 0.5, false);
    this.current = action;
  }
  render(dt: number, playing: boolean) {
    if (playing) this.mixer?.update(dt);
    this.renderer.render(this.scene, this.camera);
  }
}
