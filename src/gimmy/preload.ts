import { MAPS, BUG_ART } from "./collections";
import { gimmyAnimationPaths } from "./gimmy-animations";
import art from "./art-assets.json";

const base = import.meta.env.BASE_URL;
const loaded = new Set<string>();
const failed = new Set<string>();

export function startupAssets() {
  return [
    ...art,
    ...gimmyAnimationPaths,
    ...[
      "logo.webp",
    "beds/hamok-scene.webp",
      ...[
        "bugs",
        "chain",
        "forest-card",
        "info",
        "level",
        "play",
        "settings",
      ].map((name) => `ui/${name}.webp`),
      "fonts/Slackey-Regular.ttf",
      "fonts/Sniglet-Regular.ttf",
      ...MAPS.map((m) => `maps/${m.id}.webp`),
      ...BUG_ART.map((b) => `bugs/${b}.webp`),
      "sprites/moth-animation.webp",
      "sprites/cockroach-animation.webp",
    ].map((path) => "gimmy/" + path),
  ];
}

export async function preloadAssets(
  paths: string[],
  progress = (_done: number, _total: number) => {},
) {
  let next = 0;
  let done = 0;
  let failures = 0;
  progress(0, paths.length);
  await Promise.all(
    Array.from({ length: Math.min(5, paths.length) }, async () => {
      while (next < paths.length) {
        const path = paths[next++];
        try {
          if (!loaded.has(path)) {
            const response = await fetch(base + path, {
              cache: failed.has(path) ? "reload" : "force-cache",
              signal: AbortSignal.timeout(45000),
            });
            if (!response.ok)
              throw new Error(`HTTP ${response.status}: ${path}`);
            // Drain the complete response so it is available in the browser cache.
            await response.arrayBuffer();
            loaded.add(path);
            failed.delete(path);
          }
          progress(++done, paths.length);
        } catch {
          failed.add(path);
          failures++;
        }
      }
    }),
  );
  if (failures) throw new Error(`${failures} aset gagal dimuat`);
}
