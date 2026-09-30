import { describe, expect, it } from "vitest";
import {
  CameraDirector,
  SleepRun,
  levelFor,
  restoreProgress,
  sleepLabel,
  type Progress,
} from "../src/gimmy/rules";
const fallback: Progress = {
  xp: 0,
  best: 0,
  bugs: { moth: 0, cricket: 0, beetle: 0 },
  quality: "low",
  sound: true,
  reduced: false,
};
describe("Gimmy Sleep Chain", () => {
  it("banks each crossed milestone once, and gives no wake reward", () => {
    const rewards: number[] = [];
    const run = new SleepRun((p) => rewards.push(p));
    run.step(30);
    run.change(50);
    run.step(30);
    run.change(50);
    run.step(60);
    expect(rewards).toEqual([10, 20, 30, 50]);
    expect(run.points).toBe(110);
    run.change(-100);
    run.step(300);
    run.change(100);
    expect(run.awake).toBe(true);
    expect(run.sleep).toBe(0);
    expect(run.points).toBe(110);
    expect(rewards).toEqual([10, 20, 30, 50]);
  });
  it("never pays for time after sleep runs out", () => {
    const run = new SleepRun(() => {});
    run.sleep = 20;
    run.step(120);
    expect(run.seconds).toBe(20);
    expect(run.points).toBe(0);
    expect(run.awake).toBe(true);
  });
  it("has equivalent progression at 30 and 60 fps", () => {
    const simulate = (fps: number) => {
      const r = new SleepRun(() => {});
      for (let i = 0; i < 60 * fps; i++) r.step(1 / fps);
      return r;
    };
    const a = simulate(30),
      b = simulate(60);
    expect(a.seconds).toBeCloseTo(b.seconds, 7);
    expect(a.sleep).toBeCloseTo(b.sleep, 7);
    expect(a.points).toBe(30);
    expect(b.points).toBe(30);
  });
  it("clamps food and starts a fresh chain without touching banked XP", () => {
    let bank = 0;
    const a = new SleepRun((p) => (bank += p));
    a.step(30);
    a.change(200);
    expect(a.sleep).toBe(100);
    a.change(-100);
    const b = new SleepRun((p) => (bank += p));
    expect(b.points).toBe(0);
    b.step(30);
    expect(bank).toBe(20);
  });
  it("unlocks level two at exactly 100 points", () => {
    expect(levelFor(99)).toBe(1);
    expect(levelFor(100)).toBe(2);
    expect(levelFor(110)).toBe(2);
  });
  it("handles exact sleep state thresholds", () => {
    expect([100, 80, 79, 50, 49, 25, 24, 0].map(sleepLabel)).toEqual([
      "Deep sleep",
      "Deep sleep",
      "Cozy",
      "Cozy",
      "Light sleep",
      "Light sleep",
      "Restless",
      "Awake",
    ]);
  });
});
describe("camera and save safety", () => {
  it("zooms on inactivity, returns after input, and locks during drag", () => {
    const c = new CameraDirector();
    c.update(80, 10, false, 5, false);
    expect(c.zoom).toBeGreaterThan(1.04);
    const zoom = c.zoom;
    c.update(5, 20, true, 10, false);
    expect(c.zoom).toBe(zoom);
    c.update(80, 0, false, 5, false);
    expect(c.zoom).toBeCloseTo(1, 4);
  });
  it("uses hysteresis for low sleep and respects reduced motion", () => {
    const c = new CameraDirector();
    c.update(24, 0, false, 5, false);
    expect(c.danger).toBe(true);
    c.update(28, 0, false, 5, false);
    expect(c.danger).toBe(true);
    c.update(31, 0, false, 5, false);
    expect(c.danger).toBe(false);
    c.update(5, 20, false, 10, true);
    expect(c.zoom).toBeCloseTo(1, 5);
  });
  it("recovers corrupt saves and sanitizes malformed fields", () => {
    expect(restoreProgress("{oops", fallback)).toEqual(fallback);
    const p = restoreProgress(
      JSON.stringify({
        xp: -100,
        best: "wrong",
        quality: "ultra",
        bugs: { moth: 7 },
      }),
      fallback,
    );
    expect(p.xp).toBe(0);
    expect(p.best).toBe(0);
    expect(p.quality).toBe("low");
    expect(p.bugs).toEqual({ moth: 7, cricket: 0, beetle: 0 });
  });
});
