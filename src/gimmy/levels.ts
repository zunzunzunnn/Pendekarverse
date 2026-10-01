export interface LevelConfig {
  level: number;
  threshold: number;
  duration: number;
  spawn: [number, number];
  impact: [number, number];
  cap: number;
  food: number;
  grace: number;
}
export const LEVELS: readonly LevelConfig[] = [
  {
    level: 1,
    threshold: 0,
    duration: 120,
    spawn: [10, 6],
    impact: [6, 4.5],
    cap: 2,
    food: 8,
    grace: 8,
  },
  {
    level: 2,
    threshold: 40,
    duration: 90,
    spawn: [8, 4.5],
    impact: [5.5, 4],
    cap: 2,
    food: 7,
    grace: 3,
  },
  {
    level: 3,
    threshold: 100,
    duration: 60,
    spawn: [6, 3],
    impact: [4.5, 3],
    cap: 3,
    food: 6,
    grace: 3,
  },
  {
    level: 4,
    threshold: 180,
    duration: 30,
    spawn: [3.5, 1.8],
    impact: [3.5, 2.2],
    cap: 3,
    food: 4.5,
    grace: 1,
  },
  {
    level: 5,
    threshold: 280,
    duration: 30,
    spawn: [2.5, 1.2],
    impact: [3, 2],
    cap: 4,
    food: 3,
    grace: 1,
  },
];
export const levelFor = (points: number) =>
  LEVELS.filter((l) => points >= l.threshold).at(-1)?.level ?? 1;
export const configFor = (level: number) =>
  LEVELS[Math.max(0, Math.min(4, Math.floor(level) - 1))];
export function difficulty(level: number, seconds: number) {
  const c = configFor(level);
  const p = Math.max(0, Math.min(1, seconds / c.duration));
  const x = Math.max(0, Math.min(1, (p - 0.15) / 0.8)),
    t = x * x * (3 - 2 * x);
  return {
    interval: c.spawn[0] + (c.spawn[1] - c.spawn[0]) * t,
    impact: c.impact[0] + (c.impact[1] - c.impact[0]) * t,
    cap: Math.min(c.cap, (level >= 4 ? 2 : 1) + Math.floor(p * 3)),
    progress: p,
  };
}
export type ObstacleKind = "leaf" | "cricket" | "frog";
export const damageFor = { leaf: 12, cricket: 8, frog: 18 };
