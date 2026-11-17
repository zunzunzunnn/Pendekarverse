import manifest from "./sprite-manifest-compact.json";
export type GimmyAnim = keyof typeof manifest;
const base = import.meta.env.BASE_URL;
const cache = new Map<GimmyAnim, Promise<HTMLImageElement>>();
export const gimmyAnimationPaths = Object.keys(manifest).map((name) =>
  gimmyAnimationPath(name),
);
function gimmyAnimationPath(name: string) {
  return `gimmy/sprites2/${name}-compact.webp`;
}

export function animMeta(name: GimmyAnim) {
  return manifest[name];
}
export function animDuration(name: GimmyAnim) {
  const m = manifest[name];
  return m.count / m.fps;
}
export function loadGimmyAnim(name: GimmyAnim) {
  let p = cache.get(name);
  if (!p) {
    if (cache.size >= 2) cache.delete(cache.keys().next().value!);
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Animasi ${name} gagal dimuat`));
      img.src = base + gimmyAnimationPath(name);
    });
    cache.set(name, p);
    p.catch(() => cache.delete(name));
  }
  return p;
}
export function drawGimmyAnim(
  canvas: HTMLCanvasElement,
  name: GimmyAnim,
  image: HTMLImageElement,
  time: number,
  once = false,
) {
  const m = manifest[name];
  const frame = once
    ? Math.min(m.count - 1, Math.floor(time * m.fps))
    : Math.floor(time * m.fps) % m.count;
  if (canvas.width !== m.width || canvas.height !== m.height) {
    canvas.width = m.width;
    canvas.height = m.height;
  }
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    image,
    (frame % m.cols) * m.width,
    Math.floor(frame / m.cols) * m.height,
    m.width,
    m.height,
    0,
    0,
    m.width,
    m.height,
  );
}
