import { configFor } from "./levels";
export type Outcome = "playing" | "success" | "failed";
export class CountdownRun {
  sleep = 80;
  seconds = 0;
  points = 0;
  paid = 0;
  outcome: Outcome = "playing";
  readonly duration: number;
  constructor(
    public readonly level: number,
    private bank: (points: number, milestone: number) => void,
  ) {
    this.duration = configFor(level).duration;
  }
  get remaining() {
    return Math.max(0, this.duration - this.seconds);
  }
  get awake() {
    return this.outcome === "failed";
  }
  change(amount: number) {
    if (this.outcome !== "playing") return;
    this.sleep = Math.max(0, Math.min(100, this.sleep + amount));
    if (this.sleep <= 1e-8) {
      this.sleep = 0;
      this.outcome = "failed";
    }
  }
  // Damage at the end of the interval precedes rewards and completion at that time.
  step(dt: number, damage = 0) {
    if (this.outcome !== "playing" || !Number.isFinite(dt) || dt < 0) return;
    const end = Math.min(this.duration, this.seconds + dt);
    const fatalAt = this.seconds + this.sleep / 0.6;
    const stop = Math.min(end, fatalAt);
    while (this.paid < 4) {
      const at = (this.duration * (this.paid + 1)) / 4;
      if (at >= stop - 1e-8) break;
      this.pay();
    }
    this.sleep = Math.max(0, this.sleep - (stop - this.seconds) * 0.6);
    this.seconds = stop;
    if (fatalAt <= end + 1e-8) {
      this.sleep = 0;
      this.outcome = "failed";
      return;
    }
    this.change(-damage);
    if (this.outcome !== "playing") return;
    while (
      this.paid < 4 &&
      (this.duration * (this.paid + 1)) / 4 <= this.seconds + 1e-8
    )
      this.pay();
    if (this.seconds >= this.duration - 1e-8) {
      this.seconds = this.duration;
      this.outcome = "success";
    }
  }
  private pay() {
    this.paid++;
    this.points += 5;
    this.bank(5, this.paid);
  }
}
