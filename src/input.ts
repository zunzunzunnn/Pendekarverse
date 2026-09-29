export class Input {
  keys = new Set<string>();
  x = 0;
  y = 0;
  sprint = false;
  attack = false;
  jump = false;
  cameraX = 0;
  cameraY = 0;
  recenter = false;
  private pointers = new Map<
    number,
    {
      x: number;
      y: number;
      startX: number;
      startY: number;
      kind: "camera" | "stick";
      button: number;
      drag: boolean;
    }
  >();
  constructor(
    canvas: HTMLCanvasElement,
    private active: () => boolean,
    private pause: () => void,
    private skip: () => void,
  ) {
    addEventListener("keydown", (e) => {
      if (document.querySelector("dialog[open]")) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement
      )
        return;
      if (
        ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
          e.code,
        )
      )
        e.preventDefault();
      if (e.repeat) return;
      if (e.code === "Escape" || e.code === "KeyP") {
        pause();
        return;
      }
      if (!active()) {
        if (e.code === "Space") skip();
        return;
      }
      this.keys.add(e.code);
      if (e.code === "KeyJ") this.attack = true;
      if (e.code === "Space") this.jump = true;
      if (e.code === "KeyR") this.recenter = true;
    });
    addEventListener("keyup", (e) => this.keys.delete(e.code));
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    canvas.addEventListener("pointerdown", (e) => {
      if (!active()) return;
      canvas.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
        startX: e.clientX,
        startY: e.clientY,
        kind: "camera",
        button: e.button,
        drag: false,
      });
    });
    canvas.addEventListener("pointermove", (e) => {
      const p = this.pointers.get(e.pointerId);
      if (!p || p.kind !== "camera") return;
      if (Math.hypot(e.clientX - p.startX, e.clientY - p.startY) > 6)
        p.drag = true;
      if (p.drag) {
        this.cameraX += e.clientX - p.x;
        this.cameraY += e.clientY - p.y;
      }
      p.x = e.clientX;
      p.y = e.clientY;
    });
    canvas.addEventListener("pointerup", (e) => {
      const p = this.pointers.get(e.pointerId);
      if (
        p &&
        !p.drag &&
        p.button === 0 &&
        e.pointerType !== "touch" &&
        active()
      )
        this.attack = true;
      this.pointers.delete(e.pointerId);
    });
    addEventListener("pointercancel", (e) => {
      this.pointers.delete(e.pointerId);
      this.clear();
    });
  }
  bindTouch() {
    const stick = document.querySelector<HTMLElement>("#stick");
    if (stick) {
      const knob = stick.querySelector<HTMLElement>("i")!;
      let id: number | null = null;
      const update = (e: PointerEvent) => {
        const r = stick.getBoundingClientRect();
        let x = (e.clientX - r.left - r.width / 2) / 44,
          y = (e.clientY - r.top - r.height / 2) / 44;
        const len = Math.hypot(x, y);
        if (len > 1) {
          x /= len;
          y /= len;
        }
        this.x = len < 0.15 ? 0 : x;
        this.y = len < 0.15 ? 0 : y;
        knob.style.transform = `translate(${this.x * 34}px,${this.y * 34}px)`;
      };
      stick.onpointerdown = (e) => {
        if (id !== null) return;
        id = e.pointerId;
        stick.setPointerCapture(id);
        update(e);
      };
      stick.onpointermove = (e) => {
        if (e.pointerId === id) update(e);
      };
      stick.onpointerup = stick.onpointercancel = (e) => {
        if (e.pointerId === id) {
          id = null;
          this.x = this.y = 0;
          knob.style.transform = "";
        }
      };
    }
    document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach(
      (b) =>
        (b.onpointerdown = (e) => {
          e.preventDefault();
          if (!this.active()) return;
          const action = b.dataset.action;
          if (action === "attack") this.attack = true;
          if (action === "jump") this.jump = true;
          if (action === "sprint") {
            this.sprint = !this.sprint;
            b.classList.toggle("on", this.sprint);
          }
          if (action === "camera") this.recenter = true;
        }),
    );
  }
  movement() {
    let x =
        this.x +
        (this.keys.has("KeyD") || this.keys.has("ArrowRight") ? 1 : 0) -
        (this.keys.has("KeyA") || this.keys.has("ArrowLeft") ? 1 : 0),
      y =
        this.y +
        (this.keys.has("KeyS") || this.keys.has("ArrowDown") ? 1 : 0) -
        (this.keys.has("KeyW") || this.keys.has("ArrowUp") ? 1 : 0);
    const n = Math.hypot(x, y);
    if (n > 1) {
      x /= n;
      y /= n;
    }
    return {
      x,
      y,
      sprint:
        this.sprint ||
        this.keys.has("ShiftLeft") ||
        this.keys.has("ShiftRight"),
    };
  }
  clear() {
    this.keys.clear();
    this.pointers.clear();
    this.x = this.y = this.cameraX = this.cameraY = 0;
    this.attack = this.jump = this.sprint = this.recenter = false;
    document.querySelector("#stick i")?.removeAttribute("style");
    document.querySelector('[data-action="sprint"]')?.classList.remove("on");
  }
}
