import { configFor, difficulty, type ObstacleKind } from "./levels";
export interface Threat {
  type: string;
  due: number;
}
export interface SpawnRequest {
  type: ObstacleKind | "moth" | "beetle";
  lifetime: number;
  lane: number;
}
export class ObstacleDirector {
  nextThreat: number;
  nextFood = 2;
  lastLane = -1;
  pendingPair = false;
  constructor(
    public level: number,
    private random: () => number = Math.random,
  ) {
    this.nextThreat = configFor(level).grace;
  }
  update(time: number, active: Threat[]): SpawnRequest[] {
    const c = configFor(this.level),
      d = difficulty(this.level, time),
      out: SpawnRequest[] = [];
    if (time >= this.nextThreat) {
      this.nextThreat = time + d.interval * (0.9 + this.random() * 0.2);
      const threats = active.filter((e) =>
        ["leaf", "frog", "cricket"].includes(e.type),
      );
      if (threats.length < d.cap) {
        let r = this.random(),
          type: ObstacleKind = r < 0.5 ? "leaf" : r < 0.75 ? "cricket" : "frog";
        if (this.level === 1) {
          type =
            d.progress < 0.4
              ? "leaf"
              : d.progress < 0.65
                ? r < 0.7
                  ? "leaf"
                  : "cricket"
                : r < 0.7
                  ? "leaf"
                  : r < 0.9
                    ? "cricket"
                    : "frog";
        }
        if (type === "frog" && threats.some((e) => e.type === "frog"))
          type = "leaf";
        if (this.pendingPair) {
          type = "leaf";
          this.pendingPair = false;
        }
        let due = time + d.impact;
        for (const e of [...threats].sort((a, b) => a.due - b.due)) {
          if (Math.abs(due - e.due) < 0.65) due = e.due + 0.65;
        }
        if (due <= c.duration - 0.05) {
          let lane = Math.floor(this.random() * 3);
          if (lane === this.lastLane) lane = (lane + 1) % 3;
          this.lastLane = lane;
          out.push({ type, lifetime: due - time, lane });
          if (
            this.level >= 4 &&
            type === "leaf" &&
            threats.length + 2 <= d.cap &&
            this.random() < 0.35
          ) {
            this.pendingPair = true;
            this.nextThreat = time + 0.75;
          }
        }
      }
    }
    if (time >= this.nextFood) {
      this.nextFood = time + c.food;
      if (
        active.filter((e) => e.type === "moth" || e.type === "beetle").length <
          2 &&
        time < c.duration - 2
      )
        out.push({
          type: this.random() < 0.75 ? "moth" : "beetle",
          lifetime: 6,
          lane: Math.floor(this.random() * 3),
        });
    }
    return out;
  }
}
