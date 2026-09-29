import { describe, it, expect } from "vitest";
import { RULES, attackPhase, enemyCap, hitEligible } from "../src/config";
import { Collision, Navigation } from "../src/collision";
import { Vector3 } from "three";
describe("combat contracts", () => {
  it("only permits the configured active window", () => {
    expect(attackPhase(0.149)).toBe("windup");
    expect(attackPhase(0.15)).toBe("active");
    expect(attackPhase(0.301)).toBe("recovery");
    expect(attackPhase(0.65)).toBe("done");
  });
  it("rejects targets behind, beyond reach, and above the attack volume", () => {
    expect(hitEligible(0, 1, 0, 0, 1.8)).toBe(true);
    expect(hitEligible(0, -1, 0, 0, 1.8)).toBe(false);
    expect(hitEligible(0, 2, 0, 0, 1.8)).toBe(false);
    expect(hitEligible(0, 1, 2, 0, 1.8)).toBe(false);
    expect(hitEligible(1.3, 0.1, 0, 0, 1.8)).toBe(false);
  });
  it("uses a bounded difficulty curve independent of quality", () => {
    expect(enemyCap(0)).toBe(6);
    expect(enemyCap(179.9)).toBe(6);
    expect(enemyCap(180)).toBe(8);
    expect(enemyCap(90000)).toBe(8);
    expect(RULES.enemyHP / RULES.damage).toBe(3);
  });
});
describe("world collision and navigation", () => {
  it("slides along walls without allowing the capsule into the wall", () => {
    const c = new Collision();
    c.add(0, 0, 4, 4);
    const p = new Vector3(-3, 0, 0);
    c.move(p, 1, 1);
    expect(p.x).toBe(-3);
    expect(p.z).toBe(1);
    expect(c.free(0, 0)).toBe(false);
    expect(c.free(58, 0)).toBe(false);
  });
  it("blocks attacks across solid walls", () => {
    const c = new Collision();
    c.add(0, 0, 1, 5);
    expect(c.clear(new Vector3(-2, 0, 0), new Vector3(2, 0, 0))).toBe(false);
    expect(c.clear(new Vector3(-2, 0, 4), new Vector3(2, 0, 4))).toBe(true);
  });
  it("finds a connected route around a building", () => {
    const c = new Collision();
    c.add(0, 0, 8, 8);
    const n = new Navigation(c),
      start = new Vector3(-9, 0, 0),
      end = new Vector3(9, 0, 0);
    const route = n.path(start, end);
    expect(route.length).toBeGreaterThan(2);
    let last = start;
    for (const point of route) {
      expect(c.clear(last, point, 0.45)).toBe(true);
      last = point;
    }
    expect(route.at(-1)!.distanceTo(end)).toBe(0);
  });
  it("brings the camera forward before a wall", () => {
    const c = new Collision();
    c.add(0, 3, 5, 1, 4);
    expect(
      c.cameraDistance(new Vector3(0, 1, 0), new Vector3(0, 2, 6)),
    ).toBeLessThan(3);
  });
});
