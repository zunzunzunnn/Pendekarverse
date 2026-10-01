import { describe, it, expect } from "vitest";
import { CountdownRun } from "../src/gimmy/countdown";
import { LEVELS, levelFor, damageFor, difficulty } from "../src/gimmy/levels";
import { ObstacleDirector } from "../src/gimmy/director";
import {
  CameraDirector,
  restoreProgress,
  type Progress,
} from "../src/gimmy/rules";
import { credit } from "../src/gimmy/storage";
const fallback: Progress = {
  xp: 0,
  best: 0,
  bugs: { moth: 0, cricket: 0, beetle: 0 },
  quality: "low",
  sound: true,
  reduced: false,
};
describe("countdown and progression", () => {
  it("uses point thresholds and caps level five", () => {
    expect(
      [0, 39, 40, 99, 100, 179, 180, 279, 280, 10000].map(levelFor),
    ).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
    expect(LEVELS.map((c) => c.duration)).toEqual([120, 90, 60, 30, 30]);
  });
  it.each(LEVELS)("completes level $level at precisely its duration", (c) => {
    const rewards: number[] = [];
    const r = new CountdownRun(c.level, (p) => rewards.push(p));
    r.step(c.duration - 0.01);
    expect(r.outcome).toBe("playing");
    r.step(0.01);
    expect(r.outcome).toBe("success");
    expect(r.remaining).toBe(0);
    expect(rewards).toEqual([5, 5, 5, 5]);
    r.step(50);
    r.change(-100);
    expect(r.points).toBe(20);
    expect(r.outcome).toBe("success");
  });
  it("fatal damage at checkpoint takes priority over that reward", () => {
    const r = new CountdownRun(5, () => {});
    r.step(7.5, 100);
    expect(r.outcome).toBe("failed");
    expect(r.points).toBe(0);
  });
  it("fatal damage on deadline fails, retaining only earlier checkpoints", () => {
    const r = new CountdownRun(5, () => {});
    r.step(30, 100);
    expect(r.outcome).toBe("failed");
    expect(r.points).toBe(15);
    r.step(60);
    expect(r.points).toBe(15);
  });
  it("level unlocked in a run never changes its duration", () => {
    let xp = 35;
    const r = new CountdownRun(1, (p) => (xp += p));
    r.step(30);
    expect(levelFor(xp)).toBe(2);
    expect(r.level).toBe(1);
    expect(r.duration).toBe(120);
    r.change(-100);
    expect(xp).toBe(40);
  });
  it("results are independent of 30/60 fps", () => {
    const results = [30, 60].map((fps) => {
      const r = new CountdownRun(3, () => {});
      for (let i = 0; i < 60 * fps; i++) r.step(1 / fps);
      return r;
    });
    expect(results[0].outcome).toBe("success");
    expect(results[1].outcome).toBe("success");
    expect(results[0].sleep).toBeCloseTo(results[1].sleep, 6);
    expect(results.map((r) => r.points)).toEqual([20, 20]);
  });
  it("migrates old points without wiping settings or collection", () => {
    const p = restoreProgress(
      JSON.stringify({
        ...fallback,
        xp: 110,
        best: 122,
        bugs: { moth: 7, cricket: 2, beetle: 1 },
      }),
      fallback,
    );
    expect(levelFor(p.xp)).toBe(3);
    expect(p.best).toBe(122);
    expect(p.bugs.moth).toBe(7);
    expect(p.completed).toEqual([]);
    expect(p.legacyRainforestUnlocked).toBe(true);
  });
  it("rejects duplicate milestone receipts after save/restore", () => {
    let p = { ...fallback };
    expect(credit(p, "run-a", 1)).toBe(true);
    p = restoreProgress(JSON.stringify(p), fallback);
    expect(credit(p, "run-a", 1)).toBe(false);
    expect(credit(p, "run-a", 2)).toBe(true);
    expect(p.xp).toBe(10);
  });
  it("handles corrupt storage", () => {
    expect(restoreProgress("{oops", fallback)).toEqual(fallback);
    expect(restoreProgress('{"xp":-10}', fallback).xp).toBe(0);
  });
});
describe("camera and director", () => {
  it("locks zoom while dragging and respects reduced motion", () => {
    const c = new CameraDirector();
    c.update(80, 10, false, 5, false);
    const zoom = c.zoom;
    expect(zoom).toBeGreaterThan(1.04);
    c.update(5, 20, true, 5, false);
    expect(c.zoom).toBe(zoom);
    c.update(5, 20, false, 10, true);
    expect(c.zoom).toBeCloseTo(1, 6);
  });
  it("makes level five harder than four for the same duration", () => {
    for (const t of [0, 15, 29]) {
      const a = difficulty(4, t),
        b = difficulty(5, t);
      expect(b.interval).toBeLessThan(a.interval);
      expect(b.impact).toBeLessThan(a.impact);
    }
  });
  it.each(LEVELS)(
    "validates idle and perfect input across 100 seeded level $level schedules",
    (c) => {
      for (let seed = 1; seed <= 100; seed++)
        for (const perfect of [false, true]) {
          let rng = seed;
          const random = () => {
            rng = (Math.imul(1664525, rng) + 1013904223) >>> 0;
            return rng / 4294967296;
          };
          const d = new ObstacleDirector(c.level, random),
            r = new CountdownRun(c.level, () => {});
          let active: { type: string; due: number }[] = [];
          for (
            let n = 0;
            n < c.duration * 30 + 100 && r.outcome === "playing";
            n++
          ) {
            const req = d.update(r.seconds, active);
            for (const e of req) {
              const due = r.seconds + e.lifetime;
              if (e.type in damageFor) {
                expect(due).toBeLessThanOrEqual(c.duration);
                expect(
                  active
                    .filter((e) => e.type in damageFor)
                    .every((e) => Math.abs(e.due - due) >= 0.649),
                ).toBe(true);
              }
              active.push({ type: e.type, due });
            }
            if (active.filter((e) => e.type in damageFor).length > c.cap)
              throw Error("Active cap exceeded");
            if (perfect) {
              active = [];
              r.change(100);
            }
            const dt = Math.min(
              1 / 30,
              r.remaining,
              Math.max(
                0,
                Math.min(Infinity, ...active.map((e) => e.due - r.seconds)),
              ),
            );
            const due = active.filter((e) => e.due <= r.seconds + dt + 1e-8);
            const damage = due.reduce(
              (sum, e) =>
                sum + (damageFor[e.type as keyof typeof damageFor] ?? 0),
              0,
            );
            active = active.filter((e) => !due.includes(e));
            r.step(dt, damage);
          }
          expect(r.outcome, `seed ${seed}, perfect ${perfect}`).toBe(
            perfect ? "success" : "failed",
          );
        }
    },
  );
});
