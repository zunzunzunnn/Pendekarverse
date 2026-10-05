import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Quality } from "./rules";
import type { BedId } from "./collections";
import { SleepStateDirector, stateSprite } from "./sleep-state";
import { loadSprite, drawSprite, type SpriteName } from "./sprites";
export class GimmyScene {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-100, 100, 100, -100, 0.1, 2000);
  mixer?: THREE.AnimationMixer;
  actions = new Map<string, THREE.AnimationAction>();
  current?: THREE.AnimationAction;
  ready = false;
  root?: THREE.Group;
  bed: BedId = "daun";
  sleepState = new SleepStateDirector();
  sprite: HTMLCanvasElement;
  spriteName: SpriteName = "sleep1";
  spriteImage?: HTMLImageElement;
  decodedName: SpriteName = "sleep1";
  spriteTime = 0;
  spriteGeneration = 0;
  qualityLevel: Quality;
  reduced = false;
  constructor(
    public canvas: HTMLCanvasElement,
    quality: Quality,
  ) {
    this.qualityLevel = quality;
    this.sprite = document.createElement("canvas");
    this.sprite.className = "sleep-sprite";
    canvas.parentElement!.append(this.sprite);
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
    this.qualityLevel = q;
    this.renderer.setPixelRatio(
      Math.min(devicePixelRatio, q === "low" ? 1 : q === "medium" ? 1.5 : 2),
    );
    this.resize();
    if (this.ready) void this.changeSprite(this.spriteName);
  }
  resize() {
    const w = this.canvas.clientWidth,
      h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.left = (-1.7 * w) / h;
    this.camera.right = (1.7 * w) / h;
    this.camera.top = 1.7;
    this.camera.bottom = -1.7;
    this.camera.updateProjectionMatrix();
  }
  async load(bed: BedId = "daun") {
    const gltf = await new GLTFLoader().loadAsync(
      `${import.meta.env.BASE_URL}gimmy/beds/${bed}.glb`,
    );
    const old = this.root;
    this.mixer?.stopAllAction();
    if (old) {
      this.scene.remove(old);
      this.mixer?.uncacheRoot(old);
      old.traverse((o) => {
        if (o instanceof THREE.SkinnedMesh) o.skeleton.dispose();
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          for (const m of Array.isArray(o.material)
            ? o.material
            : [o.material]) {
            for (const value of Object.values(m))
              if (value instanceof THREE.Texture) value.dispose();
            m.dispose();
          }
        }
      });
    }
    this.root = gltf.scene;
    this.bed = bed;
    this.actions.clear();
    this.current = undefined;
    this.scene.add(gltf.scene);
    this.mixer = new THREE.AnimationMixer(gltf.scene);
    for (const clip of gltf.animations)
      this.actions.set(
        clip.name.split("|").pop()!.trim(),
        this.mixer.clipAction(clip),
      );
    this.play("Sleep 01");
    this.mixer.update(0.5);
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o) => {
      if (o instanceof THREE.Mesh && o.name.startsWith("Plane"))
        o.visible = false;
    });
    const center = new THREE.Vector3(-0.12, 0.05, -0.27);
    this.camera.position.copy(center).add(new THREE.Vector3(0, 0.65, 4));
    this.camera.lookAt(center);
    this.ready = true;
    this.resize();
    this.resetSleep();
    await this.changeSprite("sleep1");
  }
  async changeSprite(name: SpriteName) {
    this.spriteName = name;
    this.spriteTime = 0;
    const generation = ++this.spriteGeneration;
    this.sprite.style.opacity = "0.6";
    // Retain the last decoded frame while the next state loads.
    try {
      const still = await loadSprite(name, true);
      if (generation !== this.spriteGeneration) return;
      this.spriteImage = still;
      this.decodedName = name;
      this.sprite.style.opacity = "1";
      drawSprite(this.sprite, name, still, 0);
      if (!this.reduced) {
        const image = await loadSprite(
          name,
          false,
          this.qualityLevel === "low",
        );
        if (generation !== this.spriteGeneration) return;
        this.spriteImage = image;
      }
    } catch {
      if (generation === this.spriteGeneration) this.sprite.style.opacity = "1";
    }
  }
  resetSleep() {
    this.sleepState.reset();
    void this.changeSprite("sleep1");
  }
  setSleep(value: number) {
    const next = stateSprite[this.sleepState.update(value)];
    if (next !== this.spriteName) void this.changeSprite(next);
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
    if (playing) this.spriteTime += dt;
    if (this.spriteImage)
      drawSprite(
        this.sprite,
        this.decodedName,
        this.spriteImage,
        this.reduced ? 0 : this.spriteTime,
        this.sleepState.state === "awake",
      );
    this.renderer.render(this.scene, this.camera);
  }
}
