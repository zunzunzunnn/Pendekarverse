import * as T from "three";
import { Collision } from "./collision";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
export function random(seed = 421) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
function foliageTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!,
    rng = random(67);
  for (let b = 0; b < 12; b++) {
    const a = (b / 12) * Math.PI * 2,
      ex = 128 + Math.cos(a) * 95,
      ey = 128 + Math.sin(a) * 98;
    ctx.strokeStyle = "#655b34";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(128, 140);
    ctx.quadraticCurveTo(128, 100, ex, ey);
    ctx.stroke();
    for (let i = 0; i < 33; i++) {
      const t = rng(),
        x = 128 + (ex - 128) * t + (rng() - 0.5) * 55,
        y = 140 + (ey - 140) * t + (rng() - 0.5) * 45;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a + rng() * 2);
      ctx.fillStyle = ["#476240", "#617345", "#78834b", "#334f39", "#8d9558"][
        Math.floor(rng() * 5)
      ];
      ctx.beginPath();
      ctx.ellipse(0, 0, 5 + rng() * 5, 2 + rng() * 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  return t;
}
function texture(base: string, kind: "earth" | "wood" | "tile" | "stone") {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d")!,
    rng = random(8);
  x.fillStyle = base;
  x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 6500; i++) {
    const v = rng();
    x.fillStyle = `rgba(${v > 0.5 ? "255,240,208" : "20,20,10"},${rng() * 0.12})`;
    const a = rng() * 256,
      b = rng() * 256;
    x.fillRect(
      a,
      b,
      kind === "wood" ? 1 + rng() * 2 : 1 + rng() * 5,
      kind === "wood" ? 15 + rng() * 90 : 1 + rng() * 4,
    );
  }
  x.strokeStyle = "rgba(20,14,7,.25)";
  x.lineWidth = 2;
  if (kind === "tile") {
    for (let y = 0; y < 256; y += 32) {
      x.beginPath();
      x.moveTo(0, y);
      x.lineTo(256, y);
      x.stroke();
      for (let a = 0; a < 256; a += 32) {
        x.beginPath();
        x.moveTo(a + (y % 64 ? 16 : 0), y);
        x.lineTo(a + (y % 64 ? 16 : 0), y + 32);
        x.stroke();
      }
    }
  }
  if (kind === "wood")
    for (let a = 0; a < 256; a += 32) {
      x.beginPath();
      x.moveTo(a, 0);
      x.lineTo(a, 256);
      x.stroke();
    }
  const t = new T.CanvasTexture(c);
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.colorSpace = T.SRGBColorSpace;
  t.repeat.set(kind === "earth" ? 38 : 2, kind === "earth" ? 38 : 2);
  return t;
}
export interface World {
  group: T.Group;
  detail: T.Group;
  collision: Collision;
  sun: T.DirectionalLight;
  spawnPoints: T.Vector3[];
  water: T.Mesh;
}
export function buildWorld(scene: T.Scene): World {
  const group = new T.Group(),
    detail = new T.Group(),
    collision = new Collision();
  scene.add(group);
  group.add(detail);
  const rng = random();
  const mat = (color: number, map?: T.Texture) =>
    new T.MeshStandardMaterial({ color, roughness: 0.94, map });
  const ground = mat(0x9eaa77, texture("#7a8054", "earth")),
    wood = mat(0xffffff, texture("#64513a", "wood")),
    darkWood = mat(0x584733),
    roofMat = mat(0xffffff, texture("#8e5b42", "tile")),
    stone = mat(0xffffff, texture("#928b73", "stone")),
    plaster = mat(0xa99e79),
    leaf = mat(0x49664b),
    leafLight = mat(0x68794a),
    bamboo = mat(0x73794b);
  const boxGeo = new T.BoxGeometry(1, 1, 1),
    cylinderGeo = new T.CylinderGeometry(1, 1, 1, 8),
    sphereGeo = new T.IcosahedronGeometry(1, 2);
  function mesh(
    geo: T.BufferGeometry,
    m: T.Material,
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = 1,
    sz = 1,
    parent: T.Object3D = group,
  ) {
    const o = new T.Mesh(geo, m);
    o.position.set(x, y, z);
    o.scale.set(sx, sy, sz);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  const box = (
    m: T.Material,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    parent: T.Object3D = group,
  ) => mesh(boxGeo, m, x, y, z, w, h, d, parent);
  mesh(new T.PlaneGeometry(180, 180), ground, 0, -0.04, 0).rotation.x =
    -Math.PI / 2;
  // Roads form one connected forest-to-village loop, with a central stone courtyard.
  const dirt = mat(0xa99772, texture("#a49370", "earth"));
  for (const [x, z, w, d] of [
    [0, 0, 9, 104],
    [-24, 0, 7, 79],
    [24, 0, 7, 79],
    [0, -35, 55, 8],
    [0, 35, 55, 8],
  ])
    box(dirt, x, 0, z, w, 0.04, d);
  const plaza = mat(0xaaa58d, texture("#aaa38c", "stone"));
  box(plaza, 0, 0.015, -18, 22, 0.07, 23);
  for (let x = -10; x <= 10; x += 2)
    for (let z = -28; z <= -8; z += 2) {
      const tile = box(stone, x, 0.055, z, 1.96, 0.03, 1.96);
      tile.rotation.y = (rng() - 0.5) * 0.008;
    }
  function roof(
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    h: number,
  ) {
    const geo = new T.CylinderGeometry(0.48, 1, h, 4, 1);
    const r = mesh(
      geo,
      roofMat,
      x,
      y + h / 2,
      z,
      w / Math.SQRT2,
      1,
      d / Math.SQRT2,
    );
    r.rotation.y = Math.PI / 4;
    box(darkWood, x, y + 0.02, z, w * 1.03, 0.18, d * 1.03);
    box(darkWood, x, y + h, z, w * 0.45, 0.18, 0.22);
    for (const sign of [-1, 1]) {
      const fin = box(
        darkWood,
        x + sign * w * 0.25,
        y + h + 0.12,
        z,
        0.16,
        0.65,
        0.16,
      );
      fin.rotation.z = -sign * 0.6;
    }
  }
  function house(x: number, z: number, w = 7, d = 6, grand = false) {
    const h = grand ? 3.4 : 2.65;
    box(stone, x, 0.28, z, w + 0.7, 0.56, d + 0.7);
    box(wood, x, h / 2 + 0.55, z, w, h, d);
    collision.add(x, z, w + 0.7, d + 0.7, h + 4);
    for (const dx of [-w / 2, w / 2])
      for (const dz of [-d / 2, d / 2])
        box(darkWood, x + dx, h / 2 + 0.7, z + dz, 0.24, h + 0.4, 0.24);
    roof(x, h + 0.6, z, w + 2, d + 2, grand ? 1.7 : 1.25);
    if (grand) roof(x, h + 2, z, w * 0.6, d * 0.6, 2);
    box(darkWood, x, 1.42, z + d / 2 + 0.025, 1.25, 2.05, 0.1);
    box(wood, x, 1.42, z + d / 2 + 0.08, 0.09, 2, 0.1);
    for (const dx of [-w * 0.31, w * 0.31]) {
      box(darkWood, x + dx, 1.9, z + d / 2 + 0.04, 1.1, 1.05, 0.1);
      for (let i = -2; i <= 2; i++)
        box(wood, x + dx + i * 0.19, 1.9, z + d / 2 + 0.11, 0.075, 1.05, 0.075);
    }
    for (let i = 0; i < 3; i++)
      box(stone, x, 0.1 + i * 0.09, z + d / 2 + 0.6 - i * 0.2, 2.1, 0.18, 0.4);
  }
  house(-13, -17, 7, 6);
  house(14, -18, 8, 6);
  house(-14, -30, 7, 5);
  house(14, -31, 7, 5);
  house(-36, -15, 7, 6);
  house(35, -15, 7, 6);
  house(0, -38, 11, 7, true);
  // Open pendopo / gazebo with four carved pillars.
  function gazebo(x: number, z: number) {
    box(stone, x, 0.27, z, 6, 0.54, 6);
    for (const dx of [-2.5, 2.5])
      for (const dz of [-2.5, 2.5]) {
        box(wood, x + dx, 1.8, z + dz, 0.25, 3, 0.25);
        collision.add(x + dx, z + dz, 0.3, 0.3, 3.4);
        box(darkWood, x + dx, 3.12, z, 0.3, 0.18, 5.7);
      }
    roof(x, 3.25, z, 7, 7, 1.3);
    roof(x, 4.45, z, 3.2, 3.2, 1.4);
  }
  gazebo(35, 13);
  // Split stone gate, inspired by candi bentar, positioned over the main path.
  for (const s of [-1, 1]) {
    const x = s * 5.9;
    for (let i = 0; i < 5; i++)
      box(
        stone,
        x + s * i * 0.18,
        0.35 + i * 0.85,
        4,
        3 - i * 0.34,
        0.78,
        2.6 - i * 0.27,
      );
    box(stone, x, 0.15, 4, 3.6, 0.3, 3.1);
    collision.add(x, 4, 3.6, 3.1, 5);
    for (let i = 0; i < 3; i++) box(darkWood, x, 1 + i, 5.32, 1.1, 0.12, 0.1);
  }
  // Well and carts are solid navigational props.
  const well = mesh(
    new T.CylinderGeometry(1.1, 1.2, 1, 16, 1, true),
    stone,
    -7,
    0.55,
    -7,
  );
  well.material.side = T.DoubleSide;
  collision.add(-7, -7, 2.4, 2.4, 2.8);
  for (const x of [-8.3, -5.7]) box(wood, x, 1.7, -7, 0.16, 2.5, 0.16);
  roof(-7, 2.85, -7, 3.6, 2.4, 0.65);
  for (const x of [-19, 19])
    for (let z = -27; z <= -10; z += 1.3) {
      box(bamboo, x, 0.65, z, 0.1, 1.3, 0.12);
      if (z < -11) box(bamboo, x, 0.65, z + 0.65, 0.09, 0.09, 1.3);
    }
  box(wood, 10, 0.8, 14, 2.7, 0.25, 1.5);
  collision.add(10, 14, 3, 1.8, 1.8);
  for (const x of [9, 11])
    for (const z of [13.15, 14.85]) {
      const w = mesh(
        new T.TorusGeometry(0.48, 0.08, 6, 12),
        darkWood,
        x,
        0.5,
        z,
      );
      w.rotation.y = 0;
    }
  // Shallow decorative stream on east edge, bridged by a walkable timber crossing.
  const water = mesh(
    new T.PlaneGeometry(3.8, 85),
    new T.MeshStandardMaterial({
      color: 0x647f7c,
      metalness: 0.3,
      roughness: 0.23,
      transparent: true,
      opacity: 0.85,
    }),
    45,
    0.025,
    -3,
  );
  water.rotation.x = -Math.PI / 2;
  collision.add(45, -29, 4, 34, 0.3);
  collision.add(45, 20, 4, 43, 0.3);
  box(wood, 45, 0.13, -8, 5, 0.22, 5);
  for (const z of [-10.4, -5.6]) {
    box(wood, 45, 0.7, z, 5, 0.13, 0.12);
    for (const x of [42.7, 47.3]) box(wood, x, 0.6, z, 0.12, 1.2, 0.12);
  }
  // Instanced broadleaf canopy and trunks keep the tropical forest affordable.
  const treePositions: { x: number; z: number; s: number }[] = [];
  for (let i = 0; i < 290; i++) {
    const x = rng() * 112 - 56,
      z = rng() * 112 - 56;
    if (
      Math.abs(x) < 7 ||
      Math.abs(Math.abs(x) - 24) < 5 ||
      Math.abs(Math.abs(z) - 35) < 6 ||
      (Math.abs(x) < 40 && z < -3) ||
      (x > 41 && x < 49)
    )
      continue;
    if (!collision.free(x, z, 2.3)) continue;
    const s = 0.75 + rng() * 0.65;
    treePositions.push({ x, z, s });
    collision.add(x, z, 0.65 * s, 0.65 * s, 8 * s);
  }
  const foliageMat = new T.MeshStandardMaterial({
    map: foliageTexture(),
    alphaTest: 0.45,
    side: T.DoubleSide,
    roughness: 1,
    color: 0xc4ceae,
  });
  const dummy = new T.Object3D();
  const trunks = new T.InstancedMesh(cylinderGeo, wood, treePositions.length),
    crowns = new T.InstancedMesh(
      new T.PlaneGeometry(1, 1),
      foliageMat,
      treePositions.length * 18,
    );
  trunks.castShadow = true;
  crowns.castShadow = true;
  crowns.receiveShadow = true;
  treePositions.forEach(({ x, z, s }, i) => {
    dummy.position.set(x, 3.5 * s, z);
    dummy.scale.set(0.23 * s, 7 * s, 0.23 * s);
    dummy.rotation.set(0, 0, 0.045);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
    for (let j = 0; j < 18; j++) {
      const a = j * 2.4,
        spread = 1 + rng() * 1.8;
      dummy.position.set(
        x + Math.sin(a) * spread * s,
        6.2 * s + (j % 4) * 0.65 * s,
        z + Math.cos(a) * spread * s,
      );
      dummy.scale.set(3.9 * s, 3.6 * s, 1);
      dummy.rotation.set(
        j % 3 === 0 ? -Math.PI / 2 : rng() * 0.7,
        a,
        rng() * 0.5,
      );
      dummy.updateMatrix();
      crowns.setMatrixAt(i * 18 + j, dummy.matrix);
    }
  });
  group.add(trunks, crowns);
  const shrubs = new T.InstancedMesh(
    new T.PlaneGeometry(1, 1),
    foliageMat,
    380,
  );
  for (let i = 0; i < 380; i++) {
    let x = rng() * 110 - 55,
      z = rng() * 110 - 55;
    const allowed =
      Math.abs(x) > 8 &&
      !(Math.abs(x) < 40 && z < -4) &&
      Math.abs(Math.abs(x) - 24) > 4 &&
      Math.abs(Math.abs(z) - 35) > 5;
    dummy.position.set(x, allowed ? 0.2 : -8, z);
    dummy.scale.set(1.6 + rng(), 1 + rng(), 1);
    dummy.rotation.set(0, rng() * 6, 0);
    dummy.updateMatrix();
    shrubs.setMatrixAt(i, dummy.matrix);
  }
  detail.add(shrubs);
  // Dense bamboo clumps, fern-shaped fronds, and boundary boulders.
  for (let i = 0; i < 12; i++) {
    const x = (i % 2 ? 1 : -1) * (33 + rng() * 7),
      z = 8 + rng() * 34;
    for (let j = 0; j < 5; j++)
      mesh(
        cylinderGeo,
        bamboo,
        x + rng() * 2,
        2.5,
        z + rng() * 2,
        0.055,
        5 + rng(),
        0.055,
        detail,
      );
  }
  for (let i = 0; i < 76; i++) {
    const a = (i / 76) * Math.PI * 2,
      x = Math.sin(a) * 58,
      z = Math.cos(a) * 58;
    const rock = mesh(
      sphereGeo,
      stone,
      x,
      1.6,
      z,
      3 + rng() * 2,
      2 + rng() * 3,
      3 + rng() * 2,
    );
    rock.rotation.set(rng(), rng(), rng());
  }
  // Mountain silhouettes beyond playable ground.
  const mountainMat = mat(0x74827b);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const m = mesh(
      new T.SphereGeometry(1, 24, 16),
      mountainMat,
      Math.sin(a) * 118,
      -10,
      Math.cos(a) * 118,
      32 + rng() * 17,
      25 + rng() * 28,
      35 + rng() * 18,
    );
    m.castShadow = false;
  }
  const groundLeaves = new T.InstancedMesh(
    new T.PlaneGeometry(1, 1),
    foliageMat,
    650,
  );
  for (let i = 0; i < 650; i++) {
    const x = rng() * 110 - 55,
      z = rng() * 110 - 55;
    const valid =
      Math.abs(x) > 6 &&
      !(Math.abs(x) < 39 && z < -3) &&
      Math.abs(Math.abs(x) - 24) > 4 &&
      Math.abs(Math.abs(z) - 35) > 5;
    dummy.position.set(x, valid ? 0.35 : -9, z);
    dummy.rotation.set(-0.45, rng() * 6, 0);
    dummy.scale.set(1.1, 0.85, 1);
    dummy.updateMatrix();
    groundLeaves.setMatrixAt(i, dummy.matrix);
  }
  detail.add(groundLeaves);
  const sun = new T.DirectionalLight(0xffd3a0, 3.1);
  sun.position.set(-32, 42, 22);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -38,
    right: 38,
    top: 38,
    bottom: -38,
    near: 1,
    far: 130,
  });
  sun.shadow.bias = -0.00025;
  sun.shadow.normalBias = 0.035;
  scene.add(sun, new T.HemisphereLight(0xd1dfe6, 0x777358, 2.5));
  scene.background = new T.Color(0xc2c9bc);
  scene.fog = new T.FogExp2(0xc2c9bc, 0.012);
  // Batch static architecture by material, preserving the separate collision graph.
  const batches = new Map<T.Material, T.Mesh[]>();
  group.updateMatrixWorld(true);
  for (const obj of [...group.children]) {
    if (
      !(obj instanceof T.Mesh) ||
      obj instanceof T.InstancedMesh ||
      obj === water
    )
      continue;
    if (Array.isArray(obj.material)) continue;
    const list = batches.get(obj.material) || [];
    list.push(obj);
    batches.set(obj.material, list);
  }
  for (const [material, objects] of batches) {
    if (objects.length < 2) continue;
    const geometries = objects.map((o) =>
      o.geometry.clone().applyMatrix4(o.matrixWorld),
    );
    const merged = mergeGeometries(geometries);
    if (merged) {
      const combined = new T.Mesh(merged, material);
      combined.castShadow = true;
      combined.receiveShadow = true;
      group.add(combined);
      objects.forEach((o) => group.remove(o));
    }
    geometries.forEach((g) => g.dispose());
  }
  const spawnPoints: T.Vector3[] = [];
  for (let z = -48; z <= 48; z += 9)
    for (let x = -48; x <= 48; x += 9)
      if (collision.free(x, z, 1)) spawnPoints.push(new T.Vector3(x, 0, z));
  return { group, detail, collision, sun, spawnPoints, water };
}
