export const BEDS = [
  { id: "daun", name: "Daun", threshold: 0 },
  { id: "ranting", name: "Ranting", threshold: 40 },
  { id: "goa", name: "Goa", threshold: 100 },
  { id: "kasur", name: "Kasur", threshold: 180 },
  { id: "hamok", name: "Hamok", threshold: 280 },
] as const;
export type BedId = (typeof BEDS)[number]["id"];
export const MAPS = [
  { id: "forest", name: "Forest", threshold: 0 },
  { id: "rainforest", name: "RainForest", threshold: 40 },
  { id: "village", name: "Village", threshold: 100 },
  { id: "canopy", name: "Tree Canopy", threshold: 180 },
  { id: "dream", name: "Dream World", threshold: 280 },
] as const;
export type WorldId = (typeof MAPS)[number]["id"];
export function mapUnlocked(id: WorldId, points: number, legacy = false) {
  return (
    points >= MAPS.find((m) => m.id === id)!.threshold ||
    (id === "rainforest" && legacy)
  );
}
export const BUG_ART = [
  "moth",
  "cricket",
  "beetle",
  "cockroach",
  "spider",
  "termite",
  "ant",
  "caterpillar",
  "grasshopper",
] as const;
export const EXTRA_BUG_NAMES: Record<string, string> = {
  spider: "Laba-laba",
  termite: "Rayap",
  ant: "Semut",
  caterpillar: "Ulat",
  grasshopper: "Belalang",
};
