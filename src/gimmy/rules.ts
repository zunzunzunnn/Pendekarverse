export { levelFor } from "./levels";
import {
  BEDS,
  MAPS,
  mapUnlocked,
  type BedId,
  type WorldId,
} from "./collections";
export type Quality = "low" | "medium" | "high";
export type MapId = "forest" | "rainforest";
export type Bug = "moth" | "cricket" | "beetle" | "cockroach";
export interface Progress {
  xp: number;
  completed?: number[];
  receipt?: { id: string; paid: number };
  legacyRainforestUnlocked?: boolean;
  best: number;
  bugs: Record<Bug, number>;
  quality: Quality;
  sound: boolean;
  reduced: boolean;
  selectedBed?: BedId;
  selectedMap?: WorldId;
}
export const freshProgress = (): Progress => ({
  xp: 0,
  best: 0,
  bugs: { moth: 0, cricket: 0, beetle: 0, cockroach: 0 },
  selectedBed: "daun",
  selectedMap: "forest",
  quality: matchMedia("(pointer: coarse)").matches ? "low" : "medium",
  sound: true,
  reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
});

export const sleepLabel = (v: number) =>
  v >= 80
    ? "Deep sleep"
    : v >= 50
      ? "Cozy"
      : v >= 25
        ? "Light sleep"
        : v > 0
          ? "Restless"
          : "Awake";
export const foodValue: Record<Bug, number> = {
  moth: 10,
  cricket: 15,
  beetle: 20,
  cockroach: 10,
};
export const bugNames: Record<Bug, string> = {
  moth: "Ngengat",
  cricket: "Jangkrik",
  beetle: "Kumbang",
  cockroach: "Kecoak",
};
export class CameraDirector {
  danger = false;
  zoom = 1;
  update(
    sleep: number,
    idle: number,
    dragging: boolean,
    dt: number,
    reduced: boolean,
  ) {
    if (dragging) return this.zoom;
    if (sleep < 25) this.danger = true;
    else if (sleep > 30) this.danger = false;
    const target = reduced
      ? 1
      : sleep <= 0
        ? 1.2
        : sleep < 10
          ? 1.18
          : this.danger
            ? 1.1
            : idle >= 8
              ? 1.045
              : 1;
    this.zoom += (target - this.zoom) * (1 - Math.exp(-dt * 2));
    return this.zoom;
  }
}
export function restoreProgress(
  raw: string | null,
  fallback: Progress,
): Progress {
  try {
    const p = JSON.parse(raw || "null");
    if (!p || typeof p !== "object") return fallback;
    const safe = (x: unknown) =>
      typeof x === "number" && Number.isFinite(x)
        ? Math.max(0, Math.floor(x))
        : 0;
    return {
      xp: safe(p.xp),
      completed: Array.isArray(p.completed)
        ? [
            ...new Set<number>(
              p.completed.filter(
                (n: unknown) =>
                  typeof n === "number" &&
                  Number.isInteger(n) &&
                  n >= 1 &&
                  n <= 5,
              ),
            ),
          ]
        : [],
      receipt:
        typeof p.receipt?.id === "string"
          ? { id: p.receipt.id, paid: Math.min(4, safe(p.receipt.paid)) }
          : undefined,
      legacyRainforestUnlocked:
        p.legacyRainforestUnlocked === true || safe(p.xp) >= 100,
      best: safe(p.best),
      bugs: {
        moth: safe(p.bugs?.moth),
        cricket: safe(p.bugs?.cricket),
        beetle: safe(p.bugs?.beetle),
        cockroach: safe(p.bugs?.cockroach),
      },
      selectedBed:
        BEDS.find((b) => b.id === p.selectedBed && safe(p.xp) >= b.threshold)
          ?.id ?? "daun",
      selectedMap:
        MAPS.find(
          (m) =>
            m.id === p.selectedMap &&
            mapUnlocked(m.id, safe(p.xp), p.legacyRainforestUnlocked === true),
        )?.id ?? "forest",
      quality: ["low", "medium", "high"].includes(p.quality)
        ? p.quality
        : fallback.quality,
      sound: typeof p.sound === "boolean" ? p.sound : fallback.sound,
      reduced: typeof p.reduced === "boolean" ? p.reduced : fallback.reduced,
    };
  } catch {
    return fallback;
  }
}
