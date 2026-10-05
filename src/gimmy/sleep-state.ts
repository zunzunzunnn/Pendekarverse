export type SleepState = "deep" | "cozy" | "light" | "restless" | "awake";
const states: SleepState[] = ["restless", "light", "cozy", "deep"];
const bounds = [0, 25, 50, 80];
export class SleepStateDirector {
  state: SleepState = "deep";
  update(value: number) {
    if (value <= 0) return (this.state = "awake");
    const target = value >= 80 ? 3 : value >= 50 ? 2 : value >= 25 ? 1 : 0;
    const current = states.indexOf(this.state);
    if (
      current < 0 ||
      target < current ||
      (target > current && value >= bounds[target] + 3)
    )
      this.state = states[target];
    return this.state;
  }
  reset(value = 80) {
    this.state =
      value >= 80
        ? "deep"
        : value >= 50
          ? "cozy"
          : value >= 25
            ? "light"
            : value > 0
              ? "restless"
              : "awake";
  }
}
// Source clips are image sequences, not skeletal clips. 01/02 = calm,
// 03 = light, 04 = restless, 05 = the final disturbed expression.
export const stateSprite = {
  deep: "sleep1",
  cozy: "sleep2",
  light: "sleep3",
  restless: "sleep4",
  awake: "sleep5",
} as const;
