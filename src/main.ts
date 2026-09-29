import "@fontsource/cormorant-garamond/latin-500.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-700.css";
import "./style.css";
import { Game } from "./game";
import { loadSettings, saveSettings, isMobile, Quality } from "./config";
const app = document.querySelector<HTMLDivElement>("#app")!;
const settings = loadSettings();
let game: Game;
let settingsOpen = false;
let leaving = false;
const motif = '<span class="sigil" aria-hidden="true">✧</span>';
const names = ["Wira", "Laras"];
const qualityLabels = {
  auto: "Otomatis",
  low: "Ringan",
  medium: "Seimbang",
  high: "Tinggi",
};
function button(id: string, text: string, cls = "") {
  return `<button id="${id}" class="${cls}">${text}</button>`;
}
function footer() {
  return "<footer><span>LEMBAH &nbsp; W E N I N G</span><span>NUSANTARA FIKSI <b>•</b> PROTOTYPE 01</span></footer>";
}
function heading() {
  return `<div class="brand">${motif}<span>PENDEKARVERSE</span></div>`;
}
function controls() {
  return '<div class="control-guide"><span><kbd>W A S D</kbd> Bergerak</span><span><kbd>J</kbd> / klik · Pukul</span><span><kbd>SPACE</kbd> Loncat</span><span><kbd>SHIFT</kbd> Lari</span><span><kbd>DRAG</kbd> Kamera</span><span><kbd>R</kbd> Pusatkan</span></div>';
}
function qualitySelect() {
  return `<label class="quality-label"><span>KUALITAS VISUAL</span><select id="quality">${Object.entries(
    qualityLabels,
  )
    .map(
      ([v, label]) =>
        `<option value="${v}" ${settings.quality === v ? "selected" : ""}>${label}${v === "auto" ? " · sesuai perangkat" : ""}</option>`,
    )
    .join(
      "",
    )}</select></label><p class="quality-note">${isMobile() ? "Otomatis menggunakan kualitas ringan di ponsel." : "Otomatis menyesuaikan resolusi selama bermain."}</p>`;
}
function render() {
  const state = game.state;
  document.body.dataset.state = state;
  app.className = isMobile() ? "touch" : "";
  if (state === "menu") {
    app.innerHTML = `<div class="vignette"></div><header>${heading()}<span class="chapter">SEBUAH KISAH DARI NUSANTARA</span></header><main class="menu"><div class="eyebrow"><i></i> SURVIVAL · TANGAN KOSONG</div><h1>PENDEKAR<span>VERSE</span></h1><div class="ornament">───── ◇ ─────</div><p class="intro-copy">Hening desa. Gema langkah.<br>Satu pendekar melawan mereka.</p><div class="menu-actions">${button("enter", "Masuk <span>↗</span>", "primary")}${button("settings", "Pengaturan", "subtle")}</div><div class="records"><div><span>REKOR LOKAL</span><strong>${settings.best.toLocaleString("id-ID")}</strong></div><div><span>SESI TERAKHIR</span><strong>${settings.last.toLocaleString("id-ID")} <small>/ ${settings.kills} takluk</small></strong></div></div></main><div class="location"><span>01 / LOKASI</span><strong>Lembah Wening</strong><p>Di antara rimbun hutan dan halaman desa.</p></div>${footer()}`;
  }
  if (state === "select") {
    app.innerHTML = `<div class="selection-shade"></div><header>${heading()}${button("back", "← Kembali", "subtle")}</header><main class="selection"><div class="eyebrow">01 / PILIH PENDEKAR</div><h2>Jaga langkah.<br>Temukan keberanian.</h2><p class="muted">Dua rupa. Satu jalan silat.</p><div class="characters">${names.map((name, i) => `<button data-character="${i}" class="character-card ${settings.character === i ? "selected" : ""}" aria-pressed="${settings.character === i}"><span class="character-symbol">${i ? "◈" : "◇"}</span><span><strong>${name}</strong><small>${i ? "Rona embun" : "Rona bumi"}</small></span><em>${settings.character === i ? "✓" : "○"}</em></button>`).join("")}</div><div class="stats"><span>100 <small>DAYA HIDUP</small></span><span>25 <small>DAYA PUKUL</small></span><span>∞ <small>SEMANGAT</small></span></div>${qualitySelect()}${button("start", "Mulai perjalanan <span>→</span>", "primary")}<p class="model-note">Model prototipe dari koleksi karakter Anda.<br>Kedua pilihan memiliki kemampuan yang sama.</p></main><div class="preview-caption"><span>PENDEKAR TERPILIH</span><strong>${names[settings.character]}</strong><small>SILAT · TANGAN KOSONG</small></div>${footer()}`;
  }
  if (state === "loading") {
    app.innerHTML = `<div class="full-shade"></div><main class="center-panel"><div class="loading-sigil">${motif}</div><div class="eyebrow">MENYIAPKAN PERJALANAN</div><h2>Menuju Lembah Wening</h2><p id="loading-text" role="status">Memuat karakter dan tekstur…</p><div class="loader"></div>${button("back", "Kembali", "subtle")}</main>`;
  }
  if (state === "intro") {
    app.innerHTML = `<div class="cinematic-top"></div><div class="cinematic-bottom"><span>LEMBAH WENING</span><h2>Setiap langkah adalah awal.</h2></div>${button("skip", "Lewati <kbd>SPACE</kbd>", "skip subtle")}`;
  }
  if (state === "playing") {
    app.innerHTML = `<div id="damage-vignette"></div><section class="hud-top"><div class="vital"><div class="vital-name">${motif}<span>${names[settings.character]}<small>PENDEKAR</small></span><strong id="hp-text">100 <small>/ 100</small></strong></div><div class="health-track"><i id="hp-bar"></i></div></div><div class="score"><span>SKOR</span><strong id="score-text">0</strong><small id="kills-text">0 LAWAN TAKLUK</small></div><div class="hud-right"><span id="time-text">00:00</span>${button("pause", "Ⅱ", "icon-button")}</div></section><div class="area-tag"><i></i><span id="area-text">TEPIAN HUTAN</span></div><div id="grace" class="grace">Tarik napas. Bersiaplah.</div><div class="crosshair">·</div><div class="desktop-help">${controls()}</div><div class="touch-controls"><div id="stick" aria-label="Analog gerak"><i></i></div><div class="action-cluster"><button data-action="camera" aria-label="Pusatkan kamera">◎</button><button data-action="sprint">LARI</button><button data-action="jump">LONCAT</button><button data-action="attack" class="attack">PUKUL<span>✧</span></button></div></div><div class="performance" id="performance"></div>`;
    game.input.bindTouch();
  }
  if (state === "paused") {
    app.innerHTML = `<div class="full-shade"></div><main class="center-panel pause-panel"><div class="eyebrow">PERJALANAN DIJEDA</div><h2>${isMobile() && innerHeight > innerWidth ? "Putar perangkat" : "Ambil napas."}</h2><p>${isMobile() && innerHeight > innerWidth ? "Gunakan posisi landscape untuk melanjutkan." : "Lembah Wening menunggumu kembali."}</p>${button("resume", "Lanjutkan <span>→</span>", "primary")}${button("settings", "Pengaturan", "subtle")}${button("leave", "Kembali ke menu", "subtle")}${controls()}</main>`;
  }
  if (state === "dead") {
    app.innerHTML = `<div class="death-shade"></div><main class="center-panel defeat"><div class="eyebrow">PERJALANAN BERAKHIR</div><h2>Raga boleh rebah.</h2><p>Semangat kembali bangkit.</p><strong class="final-score">${game.score}</strong><span>${game.kills} LAWAN TAKLUK</span>${button("skip", "Kembali ke menu", "subtle")}</main>`;
  }
  if (state === "error") {
    app.innerHTML = `<div class="full-shade"></div><main class="center-panel"><div class="eyebrow">PERJALANAN TERTUNDA</div><h2>Belum bisa masuk.</h2><p id="error-text"></p>${button("retry", "Coba lagi", "primary")}${button("back", "Kembali", "subtle")}</main>`;
    document.querySelector("#error-text")!.textContent = game.error;
  }
  bind();
  if (settingsOpen) showSettings();
  if (leaving) showLeave();
  updateHUD();
}
function click(id: string, fn: () => void) {
  document.getElementById(id)?.addEventListener("click", fn);
}
function bind() {
  click("enter", () => void game.select());
  click("back", () => game.menu());
  click("retry", () =>
    game.error.includes("grafis") ? location.reload() : void game.select(),
  );
  click("start", () => game.start());
  click("skip", () => game.skip());
  click("pause", () => game.pause());
  click("resume", () => game.resume());
  click("settings", () => {
    settingsOpen = true;
    showSettings();
  });
  click("leave", () => {
    leaving = true;
    showLeave();
  });
  document.querySelectorAll<HTMLButtonElement>("[data-character]").forEach(
    (b) =>
      (b.onclick = () => {
        game.choose(Number(b.dataset.character));
        render();
      }),
  );
  document
    .querySelector<HTMLSelectElement>("#quality")
    ?.addEventListener("change", (e) => {
      settings.quality = (e.target as HTMLSelectElement).value as Quality;
      game.applySettings();
    });
}
function showSettings() {
  document.querySelector("#settings-dialog")?.remove();
  const dialog = document.createElement("dialog");
  dialog.id = "settings-dialog";
  dialog.innerHTML = `<div class="dialog-top"><div><div class="eyebrow">PREFERENSI PERANGKAT</div><h2>Pengaturan</h2></div>${button("close-settings", "×", "icon-button")}</div>${qualitySelect()}<label class="range-label">Sensitivitas kamera<input id="sensitivity" type="range" min="0.3" max="2" step="0.1" value="${settings.sensitivity}"></label><label class="range-label">Volume efek<input id="volume" type="range" min="0" max="1" step="0.05" value="${settings.volume}"></label><label class="range-label">Volume ambience<input id="music" type="range" min="0" max="1" step="0.05" value="${settings.music}"></label>${[
    ["invertY", "Balik arah vertikal kamera"],
    ["reducedMotion", "Kurangi gerakan kamera"],
    ["shake", "Getaran saat terkena pukulan"],
  ]
    .map(
      ([key, label]) =>
        `<label class="check-label">${label}<input type="checkbox" id="${key}" ${settings[key as "invertY"] ? "checked" : ""}></label>`,
    )
    .join(
      "",
    )}<div class="dialog-bottom">${button("reset-score", "Hapus rekor lokal", "subtle")}${button("save-settings", "Selesai", "primary")}</div>`;
  app.append(dialog);
  dialog.showModal();
  const close = () => {
    settingsOpen = false;
    dialog.close();
    dialog.remove();
  };
  click("close-settings", close);
  click("save-settings", close);
  dialog.addEventListener("cancel", () => {
    settingsOpen = false;
  });
  dialog
    .querySelectorAll<HTMLInputElement | HTMLSelectElement>("input,select")
    .forEach((el) =>
      el.addEventListener("change", () => {
        const key = el.id as keyof typeof settings;
        if (el instanceof HTMLInputElement && el.type === "checkbox")
          (settings as any)[key] = el.checked;
        else
          (settings as any)[key] =
            key === "quality" ? el.value : Number(el.value);
        game.applySettings();
      }),
    );
  click("reset-score", () => {
    if (confirm("Hapus rekor dan hasil sesi terakhir pada perangkat ini?")) {
      settings.best = settings.last = settings.kills = 0;
      saveSettings(settings);
    }
  });
}
function showLeave() {
  const dialog = document.createElement("dialog");
  dialog.innerHTML = `<h2>Akhiri perjalanan?</h2><p>Skor sesi yang dibatalkan tidak disimpan.</p><div class="dialog-bottom">${button("cancel-leave", "Tetap di sini", "subtle")}${button("confirm-leave", "Kembali ke menu", "primary")}</div>`;
  app.append(dialog);
  dialog.showModal();
  click("cancel-leave", () => {
    leaving = false;
    dialog.close();
    dialog.remove();
  });
  dialog.addEventListener("cancel", () => {
    leaving = false;
  });
  click("confirm-leave", () => {
    leaving = false;
    dialog.close();
    game.menu();
  });
}
function updateHUD() {
  const set = (id: string, text: string) => {
    const el = document.getElementById(id);
    if (el && el.textContent !== text) el.textContent = text;
  };
  set("hp-text", `${game.hp} / 100`);
  const bar = document.getElementById("hp-bar");
  if (bar) bar.style.width = `${game.hp}%`;
  set("score-text", String(game.score).padStart(3, "0"));
  set("kills-text", `${game.kills} LAWAN TAKLUK`);
  set(
    "time-text",
    `${Math.floor(game.elapsed / 60)
      .toString()
      .padStart(2, "0")}:${Math.floor(game.elapsed % 60)
      .toString()
      .padStart(2, "0")}`,
  );
  set(
    "area-text",
    (game.player?.root.position.z ?? 0) < 4 ? "DESA WENING" : "HUTAN WENING",
  );
  set(
    "performance",
    `${game.quality === "low" ? "RINGAN" : game.quality === "high" ? "TINGGI" : "SEIMBANG"} · ${game.fps} FPS`,
  );
  const grace = document.getElementById("grace");
  if (grace) grace.style.opacity = game.elapsed < 2 ? "1" : "0";
  const damage = document.getElementById("damage-vignette");
  if (damage) damage.style.opacity = String(game.flash * 3);
}
try {
  game = new Game(settings);
  game.onState = () => render();
  game.onHUD = updateHUD;
  game.onProgress = (s) => {
    const el = document.getElementById("loading-text");
    if (el) el.textContent = s;
  };
  render();
} catch (e) {
  app.innerHTML =
    '<main class="unsupported"><h1>Pendekarverse</h1><h2>Grafis 3D belum tersedia.</h2><p>Gunakan browser yang mendukung WebGL 2 dan aktifkan akselerasi grafis, lalu muat ulang halaman.</p><button onclick="location.reload()">Muat ulang</button></main>';
  console.error(e);
}
// Local diagnostics only; production does not expose game state or cheats.
if (import.meta.env.DEV) (window as any).__game = game!;
