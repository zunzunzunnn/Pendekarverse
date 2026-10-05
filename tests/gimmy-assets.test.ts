import { describe, it, expect, vi } from "vitest";
vi.stubGlobal("matchMedia", () => ({ matches: false }));
import { SleepStateDirector, stateSprite } from "../src/gimmy/sleep-state";
import { BEDS, MAPS, mapUnlocked } from "../src/gimmy/collections";
import { loadProgress, credit } from "../src/gimmy/storage";
import type { Progress } from "../src/gimmy/rules";
const fallback: Progress = {
  xp: 0,
  best: 0,
  bugs: { moth: 0, cricket: 0, beetle: 0, cockroach: 0 },
  quality: "low",
  sound: true,
  reduced: false,
};
describe("sleep conditions and asset progression", () => {
  it("has separate conditions from challenge levels and uses hysteresis", () => {
    const d = new SleepStateDirector();
    expect(d.update(79)).toBe("cozy");
    expect(d.update(81)).toBe("cozy");
    expect(d.update(83)).toBe("deep");
    expect(d.update(49)).toBe("light");
    expect(d.update(51)).toBe("light");
    expect(d.update(53)).toBe("cozy");
    expect(d.update(24)).toBe("restless");
    expect(d.update(26)).toBe("restless");
    expect(d.update(28)).toBe("light");
    expect(d.update(0)).toBe("awake");
    d.reset();
    expect(d.state).toBe("deep");
    expect(new Set(Object.values(stateSprite)).size).toBe(5);
  });
  it("unlocks five beds and five visual maps without spending points", () => {
    expect(BEDS.map((b) => b.threshold)).toEqual([0, 40, 100, 180, 280]);
    expect(MAPS.map((b) => b.threshold)).toEqual([0, 40, 100, 180, 280]);
    expect(mapUnlocked("rainforest", 0, true)).toBe(true);
    expect(mapUnlocked("dream", 279)).toBe(false);
    expect(mapUnlocked("dream", 280)).toBe(true);
  });
  it("migrates old points, settings, discoveries and receipts", () => {
    const p = loadProgress({
      getItem: (key) =>
        key === "gimmy.progress.v2"
          ? JSON.stringify({
              ...fallback,
              xp: 180,
              bugs: { moth: 8, beetle: 2, cricket: 3 },
              receipt: { id: "old", paid: 3 },
              completed: [1],
              legacyRainforestUnlocked: true,
            })
          : null,
    });
    expect(p.xp).toBe(180);
    expect(p.bugs).toEqual({ moth: 8, beetle: 2, cricket: 3, cockroach: 0 });
    expect(p.selectedBed).toBe("daun");
    expect(p.selectedMap).toBe("forest");
    expect(credit(p, "old", 3)).toBe(false);
  });
  it("falls back to v2 if v3 is corrupt and rejects locked selections", () => {
    const p = loadProgress({
      getItem: (key) =>
        key === "gimmy.progress.v3"
          ? "broken"
          : key === "gimmy.progress.v2"
            ? JSON.stringify({
                ...fallback,
                xp: 39,
                selectedBed: "hamok",
                selectedMap: "dream",
              })
            : null,
    });
    expect(p.xp).toBe(39);
    expect(p.selectedBed).toBe("daun");
    expect(p.selectedMap).toBe("forest");
  });
  it("restores unlocked choices and validates unknown identifiers", () => {
    const read = (data: object) =>
      loadProgress({
        getItem: (key) =>
          key === "gimmy.progress.v3"
            ? JSON.stringify({ ...fallback, xp: 280, ...data })
            : null,
      });
    expect(
      read({ selectedBed: "hamok", selectedMap: "dream" }).selectedBed,
    ).toBe("hamok");
    expect(
      read({ selectedBed: "missing", selectedMap: "missing" }).selectedMap,
    ).toBe("forest");
  });
});
