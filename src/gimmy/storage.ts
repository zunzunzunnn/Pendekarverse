import { freshProgress, restoreProgress, type Progress } from "./rules";
export const SAVE_KEY = "gimmy.progress.v2";
export function loadProgress(storage: Pick<Storage, "getItem">): Progress {
  const fallback = freshProgress();
  return restoreProgress(
    storage.getItem(SAVE_KEY) ?? storage.getItem("gimmy.progress.v1"),
    fallback,
  );
}
export function credit(progress: Progress, runId: string, milestone: number) {
  if (milestone < 1 || milestone > 4) return false;
  if (progress.receipt?.id === runId && progress.receipt.paid >= milestone)
    return false;
  progress.receipt = { id: runId, paid: milestone };
  progress.xp += 5;
  return true;
}
