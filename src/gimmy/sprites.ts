import manifest from "./sprite-manifest.json";
export type SpriteName = keyof typeof manifest;
const base = import.meta.env.BASE_URL;
const cache = new Map<string, Promise<HTMLImageElement>>();
export function loadSprite(name: SpriteName, still = false, low = false) {
  const key = name + (still ? "-still" : low ? "-low" : "");
  let request = cache.get(key);
  if (!request && name.startsWith("sleep") && !still) {
    const full = [...cache.keys()].filter(
      (k) => k.startsWith("sleep") && !k.endsWith("-still"),
    );
    while (full.length >= 2) cache.delete(full.shift()!);
  }
  if (!request) {
    request = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.dataset.variant = still ? "still" : low ? "low" : "full";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Animasi ${name} gagal dimuat`));
      img.src = `${base}gimmy/sprites/${key}.webp`;
    });
    cache.set(key, request);
    request.catch(() => cache.delete(key));
  }
  return request;
}
export function drawSprite(
  canvas: HTMLCanvasElement,
  name: SpriteName,
  image: HTMLImageElement,
  time: number,
  once = false,
) {
  const m =
      image.dataset.variant === "low" ? manifest[name].low : manifest[name],
    frame = once
      ? Math.min(m.count - 1, Math.floor(time * m.fps))
      : Math.floor(time * m.fps) % m.count;
  const ctx = canvas.getContext("2d")!;
  if (canvas.width !== m.width) {
    canvas.width = m.width;
    canvas.height = m.height;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (image.width === m.width) {
    ctx.drawImage(image, 0, 0, m.width, m.height);
    return;
  }
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
export const spriteMeta = manifest;
