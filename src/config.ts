export const RULES = {
  hp: 100,
  walk: 3.5,
  sprint: 6,
  jump: 5,
  gravity: 12.5,
  damage: 25,
  range: 1.8,
  attackDuration: 0.65,
  windup: 0.15,
  active: 0.15,
  buffer: 0.15,
  invulnerability: 0.45,
  enemyHP: 75,
  enemyDamage: 10,
  enemySpeed: 2.5,
  enemyRange: 1.4,
  enemyWindup: 0.45,
  enemyCooldown: 1.4,
  points: 100,
  grace: 2,
  spawnInterval: 4,
} as const;
export type Quality = "auto" | "low" | "medium" | "high";
export type State =
  | "menu"
  | "select"
  | "loading"
  | "intro"
  | "playing"
  | "paused"
  | "dead"
  | "error";
export interface Settings {
  quality: Quality;
  sensitivity: number;
  invertY: boolean;
  reducedMotion: boolean;
  shake: boolean;
  volume: number;
  music: number;
  character: number;
  best: number;
  last: number;
  kills: number;
}
export const isMobile = () => matchMedia("(pointer: coarse)").matches;
export const defaults: Settings = {
  quality: "auto",
  sensitivity: 1,
  invertY: false,
  reducedMotion: false,
  shake: true,
  volume: 0.5,
  music: 0.25,
  character: 0,
  best: 0,
  last: 0,
  kills: 0,
};
export function loadSettings(): Settings {
  try {
    const v = JSON.parse(localStorage.getItem("pendekarverse.v1") || "{}");
    const loaded: Settings = {
      ...defaults,
      ...Object.fromEntries(
        Object.entries(v).filter(
          ([k, val]) =>
            k in defaults &&
            typeof val === typeof defaults[k as keyof Settings],
        ),
      ),
      quality: ["auto", "low", "medium", "high"].includes(v.quality)
        ? v.quality
        : "auto",
    };
    loaded.character = loaded.character === 1 ? 1 : 0;
    const clamp = (
      value: number,
      min: number,
      max: number,
      fallback: number,
    ) =>
      Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
    loaded.sensitivity = clamp(loaded.sensitivity, 0.3, 2, 1);
    loaded.volume = clamp(loaded.volume, 0, 1, 0.5);
    loaded.music = clamp(loaded.music, 0, 1, 0.25);
    for (const field of ["best", "last", "kills"] as const)
      loaded[field] = Math.floor(clamp(loaded[field], 0, 1e9, 0));
    return loaded;
  } catch {
    return { ...defaults };
  }
}
export function saveSettings(s: Settings) {
  try {
    localStorage.setItem("pendekarverse.v1", JSON.stringify(s));
  } catch {
    /* Storage is optional. */
  }
}
export function resolveQuality(q: Quality): Exclude<Quality, "auto"> {
  if (q !== "auto") return q;
  return isMobile()
    ? "low"
    : navigator.hardwareConcurrency >= 8
      ? "high"
      : "medium";
}
export function enemyCap(elapsed: number) {
  return elapsed >= 180 ? 8 : 6;
}
export function hitEligible(
  dx: number,
  dz: number,
  dy: number,
  yaw: number,
  range: number,
  arc = Math.PI / 4,
) {
  const distance = Math.hypot(dx, dz);
  return (
    distance <= range &&
    Math.abs(dy) < 1.35 &&
    (distance < 0.01 ||
      (dx * Math.sin(yaw) + dz * Math.cos(yaw)) / distance >= Math.cos(arc))
  );
}
export function attackPhase(t: number) {
  return t < RULES.windup
    ? "windup"
    : t < RULES.windup + RULES.active
      ? "active"
      : t < RULES.attackDuration
        ? "recovery"
        : "done";
}
