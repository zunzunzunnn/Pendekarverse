import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
let cached: T.Group | undefined;
export async function loadCharacter(progress: (s: string) => void) {
  if (cached) return;
  progress("Memuat karakter dan tekstur…");
  const gltf = await new GLTFLoader().loadAsync(
    `${import.meta.env.BASE_URL}models/pendekar.glb`,
    (e) => {
      if (e.total)
        progress(
          `Memuat karakter · ${Math.round((e.loaded / e.total) * 100)}%`,
        );
    },
  );
  cached = gltf.scene;
}
export type Motion =
  "Idle" | "Walk" | "Run" | "Jump" | "Land" | "Attack_01" | "Hit" | "Death";
export class Character {
  root = new T.Group();
  model: T.Group;
  mixer: T.AnimationMixer;
  actions = {} as Record<Motion, T.AnimationAction>;
  motion: Motion = "Idle";
  private lastHP = -1;
  materials: T.MeshStandardMaterial[] = [];
  ring: T.Mesh;
  bar: T.Sprite;
  constructor(
    public variant = 0,
    enemy = false,
  ) {
    if (!cached) throw new Error("Model karakter belum dimuat");
    this.model = clone(cached) as T.Group;
    this.root.add(this.model);
    this.model.updateMatrixWorld(true);
    const bounds = new T.Box3().setFromObject(this.model),
      size = bounds.getSize(new T.Vector3()),
      center = bounds.getCenter(new T.Vector3());
    const scale = 1.85 / size.y;
    this.model.scale.setScalar(scale);
    this.model.position.set(
      -center.x * scale,
      -bounds.min.y * scale,
      -center.z * scale,
    );
    this.model.traverse((o) => {
      if (o instanceof T.Mesh) {
        o.castShadow = true;
        o.frustumCulled = false;
        const copy = (m: T.MeshStandardMaterial) => {
          const n = m.clone();
          n.roughness = Math.max(0.55, n.roughness);
          if (enemy) n.color.multiply(new T.Color(0xd87865));
          else if (variant) n.color.multiply(new T.Color(0x87bdba));
          this.materials.push(n);
          return n;
        };
        o.material = Array.isArray(o.material)
          ? o.material.map(copy)
          : copy(o.material);
      }
    });
    const ringmat = new T.MeshBasicMaterial({
      color: enemy ? 0xdd7959 : variant ? 0x8dcfd2 : 0xe1c17c,
      transparent: true,
      opacity: 0.7,
      side: T.DoubleSide,
    });
    this.ring = new T.Mesh(new T.RingGeometry(0.42, 0.46, 40), ringmat);
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.035;
    this.root.add(this.ring);
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 16;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#142520";
    ctx.fillRect(0, 0, 128, 16);
    ctx.fillStyle = enemy ? "#dd7959" : "#b1c69a";
    ctx.fillRect(3, 3, 122, 10);
    this.bar = new T.Sprite(
      new T.SpriteMaterial({
        map: new T.CanvasTexture(canvas),
        depthTest: false,
        transparent: true,
      }),
    );
    this.bar.position.y = 2.15;
    this.bar.scale.set(0.85, 0.1, 1);
    this.root.add(this.bar);
    this.mixer = new T.AnimationMixer(this.model);
    const bones: Record<string, T.Bone> = {};
    this.model.traverse((o) => {
      if (o instanceof T.Bone)
        bones[o.name.replace("mixamorig", "").replace(/[:_]/g, "")] = o;
    });
    const durations: Record<Motion, number> = {
      Idle: 2.4,
      Walk: 0.85,
      Run: 0.55,
      Jump: 0.8,
      Land: 0.18,
      Attack_01: 0.65,
      Hit: 0.22,
      Death: 1.1,
    };
    for (const name of Object.keys(durations) as Motion[]) {
      const duration = durations[name],
        tracks: T.KeyframeTrack[] = [];
      for (const [bn, bone] of Object.entries(bones)) {
        if (
          ![
            "LeftArm",
            "RightArm",
            "LeftForeArm",
            "RightForeArm",
            "LeftUpLeg",
            "RightUpLeg",
            "LeftLeg",
            "RightLeg",
            "Spine",
            "Spine1",
            "Head",
          ].includes(bn)
        )
          continue;
        const times: number[] = [],
          values: number[] = [];
        for (let i = 0; i <= 24; i++) {
          const t = i / 24,
            phase = t * Math.PI * 2,
            side = bn.startsWith("Left") ? 1 : -1;
          let x = 0,
            y = 0,
            z = 0;
          if (name === "Idle") {
            if (bn.includes("Arm")) x = Math.sin(phase) * 0.025;
            if (bn === "Spine") x = Math.sin(phase) * 0.02;
          }
          if (name === "Walk" || name === "Run") {
            const amp = name === "Run" ? 0.62 : 0.37;
            if (bn.endsWith("UpLeg")) x = Math.sin(phase) * amp * side;
            if (bn === "LeftLeg" || bn === "RightLeg")
              x = -Math.max(0, -Math.sin(phase) * side) * amp;
            if (bn === "LeftArm" || bn === "RightArm")
              x = -Math.sin(phase) * amp * 0.65 * side;
            if (bn === "Spine") y = Math.sin(phase) * 0.07;
          }
          if (name === "Attack_01") {
            const punch = Math.sin(Math.min(1, t / 0.43) * Math.PI);
            if (bn === "RightArm") {
              x = -punch * 1.35;
              z = punch * 0.35;
            }
            if (bn === "RightForeArm") x = -punch * 0.55;
            if (bn === "Spine") {
              y = -punch * 0.38;
              x = punch * 0.15;
            }
            if (bn === "LeftForeArm") x = -0.55;
          }
          if (name === "Jump") {
            if (bn.endsWith("UpLeg")) x = -0.45 * Math.sin(t * Math.PI);
            if (bn === "LeftLeg" || bn === "RightLeg")
              x = -0.6 * Math.sin(t * Math.PI);
            if (bn.endsWith("Arm")) z = side * 0.22 * Math.sin(t * Math.PI);
          }
          if (name === "Land" && bn.endsWith("UpLeg"))
            x = -0.15 * Math.sin(t * Math.PI);
          if (name === "Hit" && bn === "Spine")
            x = -0.2 * Math.sin(t * Math.PI);
          if (name === "Death") {
            if (bn === "Spine") x = -t * 0.35;
            if (bn.endsWith("UpLeg")) x = -t * 0.25;
          }
          const q = bone.quaternion
            .clone()
            .multiply(new T.Quaternion().setFromEuler(new T.Euler(x, y, z)));
          if (name === "Attack_01" && bn === "RightArm" && bone.children[0]) {
            const origin = bone.getWorldPosition(new T.Vector3()),
              end = bone.children[0].getWorldPosition(new T.Vector3()),
              direction = end.sub(origin).normalize();
            const delta = new T.Quaternion().setFromUnitVectors(
              direction,
              new T.Vector3(0.03, -0.08, 1).normalize(),
            );
            const world = delta.multiply(
              bone.getWorldQuaternion(new T.Quaternion()),
            );
            const local = bone
              .parent!.getWorldQuaternion(new T.Quaternion())
              .invert()
              .multiply(world);
            const punch = Math.sin(Math.min(1, t / 0.7) * Math.PI);
            q.copy(bone.quaternion).slerp(local, punch);
          }
          times.push(t * duration);
          values.push(q.x, q.y, q.z, q.w);
        }
        tracks.push(
          new T.QuaternionKeyframeTrack(
            `${bone.uuid}.quaternion`,
            times,
            values,
          ),
        );
      }
      const action = this.mixer.clipAction(
        new T.AnimationClip(name, duration, tracks),
      );
      if (!["Idle", "Walk", "Run"].includes(name)) {
        action.setLoop(T.LoopOnce, 1);
        action.clampWhenFinished = true;
      }
      this.actions[name] = action;
    }
    this.actions.Idle.play();
  }
  play(name: Motion) {
    if (
      this.motion === name &&
      ["Idle", "Walk", "Run", "Jump", "Death"].includes(name)
    )
      return;
    this.actions[this.motion].fadeOut(0.12);
    this.actions[name].reset().fadeIn(0.12).play();
    this.motion = name;
  }
  update(dt: number, hp: number, max: number, flash = 0) {
    this.mixer.update(dt);
    for (const m of this.materials) {
      m.emissive.setHex(flash > 0 ? 0x8a3e24 : 0x000000);
      m.emissiveIntensity = flash > 0 ? 0.7 : 0;
    }
    if (hp === this.lastHP) return;
    this.lastHP = hp;
    const canvas = this.bar.material.map!.image as HTMLCanvasElement,
      ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, 128, 16);
    ctx.fillStyle = "#182820";
    ctx.fillRect(0, 0, 128, 16);
    ctx.fillStyle = this.variant === 2 ? "#df8064" : "#c9d7b1";
    ctx.fillRect(3, 3, 122 * Math.max(0, hp / max), 10);
    this.bar.material.map!.needsUpdate = true;
  }
  dispose() {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.model);
    const skeletons = new Set<T.Skeleton>();
    this.model.traverse((object) => {
      if (object instanceof T.SkinnedMesh) skeletons.add(object.skeleton);
    });
    skeletons.forEach((skeleton) => skeleton.dispose());
    this.materials.forEach((m) => m.dispose());
    this.ring.geometry.dispose();
    (this.ring.material as T.Material).dispose();
    this.bar.material.map?.dispose();
    this.bar.material.dispose();
    this.root.removeFromParent();
  }
}
