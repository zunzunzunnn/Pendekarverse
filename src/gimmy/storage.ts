import { freshProgress, restoreProgress, type Progress } from "./rules";
export const SAVE_KEY = "gimmy.progress.v3";
export function loadProgress(storage: Pick<Storage, "getItem">): Progress {
  const fallback = freshProgress();
  for (const key of [SAVE_KEY, "gimmy.progress.v2", "gimmy.progress.v1"]) {
    const raw = storage.getItem(key);
    if (!raw) continue;
    try {
      const value = JSON.parse(raw);
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        typeof value.xp === "number" &&
        Number.isFinite(value.xp)
      )
        return restoreProgress(raw, fallback);
    } catch {}
  }
  return fallback;
}
export function credit(progress: Progress, runId: string, milestone: number) {
  if (milestone < 1 || milestone > 4) return false;
  if (progress.receipt?.id === runId && progress.receipt.paid >= milestone)
    return false;
  progress.receipt = { id: runId, paid: milestone };
  progress.xp += 5;
  return true;
}
