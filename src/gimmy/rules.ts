export type Quality = "low" | "medium" | "high";
export type MapId = "forest" | "rainforest";
export type Bug = "moth" | "cricket" | "beetle";
export interface Progress {
  xp: number;
  best: number;
  bugs: Record<Bug, number>;
  quality: Quality;
  sound: boolean;
  reduced: boolean;
}
export const freshProgress = (): Progress => ({
  xp: 0,
  best: 0,
  bugs: { moth: 0, cricket: 0, beetle: 0 },
  quality: matchMedia("(pointer: coarse)").matches ? "low" : "medium",
  sound: true,
  reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
});
export const levelFor = (xp: number) => 1 + Math.floor(xp / 100);
export const rewardAt = (milestone: number) =>
  [0, 10, 20, 30, 50][Math.min(milestone, 4)];
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
};
export const bugNames: Record<Bug, string> = {
  moth: "Ngengat",
  cricket: "Jangkrik",
  beetle: "Kumbang",
};
export class SleepRun {
  sleep = 80;
  seconds = 0;
  points = 0;
  paid = 0;
  awake = false;
  constructor(public bank: (points: number) => void) {}
  step(dt: number, drain = 1) {
    if (this.awake || !Number.isFinite(dt) || dt <= 0) return;
    const elapsed = Math.min(dt, this.sleep / drain);
    this.seconds += elapsed;
    const milestone = Math.floor((this.seconds + 1e-8) / 30);
    while (this.paid < milestone) {
      const points = rewardAt(++this.paid);
      this.points += points;
      this.bank(points);
    }
    this.change(-elapsed * drain);
  }
  change(amount: number) {
    if (this.awake) return;
    this.sleep = Math.max(0, Math.min(100, this.sleep + amount));
    if (this.sleep <= 0.000001) {
      this.sleep = 0;
      this.awake = true;
    }
  }
}
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
      best: safe(p.best),
      bugs: {
        moth: safe(p.bugs?.moth),
        cricket: safe(p.bugs?.cricket),
        beetle: safe(p.bugs?.beetle),
      },
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
