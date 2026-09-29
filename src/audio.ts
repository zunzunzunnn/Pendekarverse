export class AudioSystem {
  context?: AudioContext;
  volume = 0.5;
  music = 0.25;
  private ambient?: { osc: OscillatorNode; gain: GainNode };
  unlock() {
    try {
      this.context ??= new AudioContext();
      void this.context.resume();
      if (!this.ambient) {
        const osc = this.context.createOscillator(),
          gain = this.context.createGain();
        osc.type = "sine";
        osc.frequency.value = 98;
        gain.gain.value = 0;
        osc.connect(gain).connect(this.context.destination);
        osc.start();
        this.ambient = { osc, gain };
      }
    } catch {
      /* Audio failure must not block play. */
    }
  }
  active(playing: boolean) {
    if (this.context && this.ambient)
      this.ambient.gain.gain.setTargetAtTime(
        playing ? this.music * 0.025 : 0,
        this.context.currentTime,
        0.3,
      );
  }
  sound(type: "punch" | "hit" | "hurt" | "step" | "death") {
    const c = this.context;
    if (!c || this.volume === 0) return;
    const osc = c.createOscillator(),
      gain = c.createGain(),
      now = c.currentTime;
    const params = {
      punch: [180, 65, 0.12],
      hit: [110, 35, 0.18],
      hurt: [210, 60, 0.22],
      step: [75, 35, 0.045],
      death: [130, 28, 0.65],
    }[type];
    osc.type = type === "punch" ? "triangle" : "sine";
    osc.frequency.setValueAtTime(params[0], now);
    osc.frequency.exponentialRampToValueAtTime(params[1], now + params[2]);
    gain.gain.setValueAtTime(
      this.volume * (type === "step" ? 0.06 : 0.23),
      now,
    );
    gain.gain.exponentialRampToValueAtTime(0.001, now + params[2]);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(now + params[2]);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }
}
