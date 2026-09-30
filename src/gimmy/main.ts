import "@fontsource/manrope/400.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/800.css";
import "@fontsource/cormorant-garamond/600.css";
import "./style.css";
import { GimmyScene } from "./scene";
import {
  SleepRun,
  CameraDirector,
  freshProgress,
  restoreProgress,
  levelFor,
  sleepLabel,
  foodValue,
  bugNames,
  type Bug,
  type MapId,
  type Quality,
} from "./rules";

const $ = <T extends HTMLElement = HTMLElement>(s: string) =>
  document.querySelector<T>(s)!;
const base = import.meta.env.BASE_URL;
const key = "gimmy.progress.v1";
let storageOK = true;
let progress = freshProgress();
try {
  progress = restoreProgress(localStorage.getItem(key), progress);
} catch {
  storageOK = false;
}
function save() {
  try {
    localStorage.setItem(key, JSON.stringify(progress));
  } catch {
    storageOK = false;
  }
}
let map: MapId = "forest",
  state: "home" | "playing" | "paused" | "waking" | "result" = "home";
let run = new SleepRun(bank),
  camera = new CameraDirector(),
  idle = 0,
  spawnAt = 5,
  hazardAt = 14,
  frogAt = 36,
  wakeTime = 0,
  frame = 0,
  last = performance.now(),
  serial = 0;
let drag: {
  entity: Entity;
  pointer: number;
  x: number;
  y: number;
  moved: boolean;
} | null = null;
let entities: Entity[] = [];
interface Entity {
  id: number;
  type: Bug | "leaf" | "frog";
  x: number;
  y: number;
  life: number;
  max: number;
  el: HTMLButtonElement;
  used: boolean;
}
let scene: GimmyScene | undefined;
let ready = false;
const icons: Record<Entity["type"], string> = {
  moth: '<svg viewBox="0 0 80 70"><path fill="#e5cd99" stroke="#fff1c9" stroke-width="2" d="M39 32C9-4 0 8 8 37c4 12 19 11 29 2C12 61 29 69 39 46c9 23 28 16 5-7 20 13 34 3 30-17C71 2 57 13 43 32Z"/><path stroke="#72523c" stroke-width="4" stroke-linecap="round" d="M41 27v24m0-23-8-11m8 11 8-11"/></svg>',
  cricket:
    '<svg viewBox="0 0 80 70"><path d="m20 53 11-23 12 20 14-32 11 36M32 30 19 12m29 19L63 9" fill="none" stroke="#a7d386" stroke-width="4" stroke-linecap="round"/><ellipse cx="41" cy="37" rx="24" ry="12" fill="#719255" stroke="#e1e9a5" stroke-width="2"/><circle cx="22" cy="32" r="9" fill="#abd078"/><circle cx="20" cy="29" r="2" fill="#173522"/></svg>',
  beetle:
    '<svg viewBox="0 0 80 70"><path d="m20 23 14 12-17 9m44-21L48 35l17 9M27 55l8-10m18 10-8-10" stroke="#e7b476" stroke-width="4" fill="none"/><ellipse cx="40" cy="38" rx="19" ry="23" fill="#957058" stroke="#f5d89f" stroke-width="2"/><path d="M40 22v38" stroke="#403529" stroke-width="3"/><ellipse cx="40" cy="18" rx="12" ry="9" fill="#473d32"/><circle cx="35" cy="15" r="2" fill="#e4e8b6"/></svg>',
  leaf: '<svg viewBox="0 0 80 70"><path d="M66 8C14 7 5 31 20 53c26 9 47-11 46-45" fill="#dba454" stroke="#ffe2a2" stroke-width="2"/><path d="m12 63 45-45M26 45l-1-18m15 5 14 4" stroke="#9a642e" stroke-width="3" fill="none"/></svg>',
  frog: '<svg viewBox="0 0 80 70"><ellipse cx="40" cy="43" rx="27" ry="18" fill="#76a16d"/><circle cx="24" cy="25" r="13" fill="#9cc88a"/><circle cx="56" cy="25" r="13" fill="#9cc88a"/><circle cx="25" cy="24" r="6" fill="#ffdf99"/><circle cx="55" cy="24" r="6" fill="#ffdf99"/><circle cx="25" cy="24" r="3" fill="#1b3029"/><circle cx="55" cy="24" r="3" fill="#1b3029"/><path d="M28 42q12 10 24 0" stroke="#335241" fill="none" stroke-width="2"/></svg>',
};
$("#app").innerHTML = `
 <div class="backdrop"></div><div class="vignette"></div>
 <main id="shell">
  <div id="world-frame"><div id="stage"><div class="forest-art"></div><div class="mist"></div><div id="fireflies" aria-hidden="true">${Array.from({ length: 18 }, (_, i) => `<i style="--x:${(i * 37) % 100}%;--y:${(i * 23) % 90}%;--delay:${i * 0.4}s"></i>`).join("")}</div><div class="gimmy-shadow"></div><canvas id="gimmy" aria-label="Gimmy si tarsius kecil sedang tidur"></canvas><div class="zzz" aria-hidden="true">z<span>z</span><small>z</small></div><div id="objects"></div><div id="rain" aria-hidden="true"></div></div></div>
  <header><a class="wordmark" href="#" aria-label="Beranda Gimmy">GIMMY<span>THE LITTLE TARSIUS</span></a><div class="header-right"><span class="edition">A LITTLE WORLD OF REST</span><button class="icon-button" id="settings" aria-label="Pengaturan">⚙</button></div></header>
  <div id="profile" class="glass"><span class="moon-badge">☾</span><div><small>PENJAGA MIMPI</small><strong id="level"></strong><div class="xp-track"><i id="xpbar"></i></div></div><span id="xp"></span></div>
  <button id="map-select" class="glass"><small>DUNIA SAAT INI</small><strong id="map-name">Moonlit Forest</strong><span>Jelajahi peta ↗</span></button>
  <section id="home"><img class="logo" src="${base}gimmy/logo.webp" alt="Gimmy : The Little Tarsius"/><div class="home-copy"><span class="eyebrow">SMALL FRIEND. SWEET DREAMS.</span><h1>Satu mimpi kecil.<br>Satu penjaga sepertimu.</h1><p>Redakan riuh hutan. Bantu Gimmy tidur lebih lama.</p><button class="primary" id="play" disabled>Menyiapkan Gimmy…</button><small id="load-note" role="status">Membangunkan dunia kecilnya</small></div></section>
  <section id="hud" hidden><div class="sleep-panel glass"><div><span>☾ &nbsp; SLEEP METER</span><strong id="sleep-label">Deep sleep</strong></div><div class="sleep-track"><i id="sleep-fill"></i></div><small><span id="sleep-number">80</span> / 100 <span id="risk">Jaga agar mimpinya tetap hangat</span></small></div><div class="chain glass"><small>SLEEP CHAIN</small><strong id="timer">00:00</strong><span id="next-reward">30 dtk → +10 poin</span></div><button class="icon-button" id="pause" aria-label="Jeda permainan">Ⅱ</button><div id="hint" role="status"></div><button id="branch" class="branch" hidden>♧ Ketuk ranting <small>Alihkan katak</small></button><div id="run-points">✦ <span>0</span> poin tersimpan</div></section>
  <nav id="home-nav"><button id="book"><span>♧</span>Bug Book</button><button id="bed"><span>☾</span>Sarang Gimmy</button><button id="how"><span>?</span>Cara bermain</button></nav>
  <footer><span>GIMMY • PROTOTYPE 0.2</span><span id="best"></span><span class="desktop-note">Ambil jeda. Jaga sebuah mimpi.</span></footer>
 </main><div id="toast" role="status"></div><dialog id="dialog" aria-labelledby="dialog-title"></dialog>`;
const modal = $<HTMLDialogElement>("#dialog");
const format = (t: number) =>
  `${Math.floor(t / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(t % 60)
    .toString()
    .padStart(2, "0")}`;
function refreshProfile() {
  $("#level").textContent = `Level ${levelFor(progress.xp)}`;
  $("#xp").textContent = `${progress.xp % 100}/100 XP`;
  $("#xpbar").style.width = `${progress.xp % 100}%`;
  $("#best").textContent = `REKOR TIDUR ${format(progress.best)}`;
}
function bank(points: number) {
  const prev = levelFor(progress.xp);
  progress.xp += points;
  save();
  refreshProfile();
  toast(
    levelFor(progress.xp) > prev
      ? prev === 1
        ? "Level naik! Rainforest terbuka 🌿"
        : `Naik ke Level ${levelFor(progress.xp)}!`
      : `Sleep Chain · +${points} poin tersimpan`,
  );
  tone(660);
}
let toastTimer = 0;
function toast(message: string) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(
    () => $("#toast").classList.remove("show"),
    3500,
  );
}
let audio: AudioContext | undefined;
function tone(freq = 440) {
  if (!progress.sound) return;
  try {
    audio ??= new AudioContext();
    void audio.resume();
    const o = audio.createOscillator(),
      g = audio.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, audio.currentTime);
    g.gain.setValueAtTime(0.035, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.4);
    o.connect(g).connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + 0.4);
  } catch {}
}
function dialog(title: string, body: string) {
  modal.innerHTML = `<button class="close icon-button" aria-label="Tutup">×</button><span class="eyebrow">GIMMY • A MOMENT OF QUIET</span><h2 id="dialog-title">${title}</h2>${body}`;
  modal.querySelector(".close")!.addEventListener("click", () => modal.close());
  if (!modal.open) modal.showModal();
}
function setMap(next: MapId) {
  map = next;
  document.body.dataset.map = map;
  $("#map-name").textContent =
    map === "forest" ? "Moonlit Forest" : "Misty Rainforest";
}
function chooseMap() {
  dialog(
    "Dunia untuk bermimpi",
    `<p>Mimpi yang panjang membuka tempat baru. Rainforest terbuka di Level 2, dengan 100 poin.</p><div class="map-grid"><button class="map-card forest" data-map="forest"><span>01 · TERBUKA</span><strong>Moonlit Forest</strong><small>Malam tenang, kunang-kunang & nyanyian hutan.</small></button><button class="map-card rainforest" data-map="rainforest" ${progress.xp < 100 ? "disabled" : ""}><span>02 · ${progress.xp < 100 ? `${progress.xp}/100 POIN` : "TERBUKA"}</span><strong>Misty Rainforest</strong><small>Hujan lembut. Daun lebih sering, tidur lebih rapuh.</small></button></div>`,
  );
  modal.querySelectorAll<HTMLButtonElement>("[data-map]").forEach(
    (b) =>
      (b.onclick = () => {
        setMap(b.dataset.map as MapId);
        modal.close();
      }),
  );
}
function settings(preSleep = false) {
  dialog(
    preSleep ? "Sebelum terlelap" : "Sedikit kenyamanan",
    `<p>${preSleep ? "Pilih kualitas visual, lalu jaga mimpi Gimmy selama mungkin." : "Atur dunia kecil ini supaya nyaman di perangkatmu."}</p><label class="field">Kualitas visual<select id="quality"><option value="low">Ringan · ponsel / hemat daya</option><option value="medium">Seimbang · desktop</option><option value="high">Tinggi · detail maksimal</option></select></label><label class="check"><input id="sound" type="checkbox" ${progress.sound ? "checked" : ""}/> Suara interaksi</label><label class="check"><input id="reduced" type="checkbox" ${progress.reduced ? "checked" : ""}/> Kurangi gerakan & zoom</label><div class="notice">Ketuk serangga untuk memberi makan. Geser daun menjauh. Ketuk ranting saat katak datang.</div><button id="confirm" class="primary">${preSleep ? "Mulai bermimpi" : "Simpan pengaturan"}</button>`,
  );
  $<HTMLSelectElement>("#quality").value = progress.quality;
  $("#confirm").onclick = () => {
    progress.quality = $<HTMLSelectElement>("#quality").value as Quality;
    progress.sound = $<HTMLInputElement>("#sound").checked;
    progress.reduced = $<HTMLInputElement>("#reduced").checked;
    save();
    applyQuality();
    modal.close();
    if (preSleep) start();
  };
}
function applyQuality() {
  document.body.dataset.quality = progress.quality;
  document.body.classList.toggle("reduced", progress.reduced);
  scene?.quality(progress.quality);
}
function book() {
  dialog(
    "Kawan kecil di hutan",
    `<p>Kenali siapa yang membantu Gimmy, dan siapa yang perlu dialihkan.</p><div class="bug-grid">${(["moth", "cricket", "beetle"] as Bug[]).map((type) => `<article><div class="bug-art">${icons[type]}</div><h3>${bugNames[type]}</h3><b>+${foodValue[type]} Sleep</b><p>${type === "cricket" ? "Tangkap sebelum berbunyi. Terlambat: −5 Sleep." : type === "beetle" ? "Lambat, mengenyangkan, dan paling disukai Gimmy." : "Lembut dan tenang. Ketuk atau geser ke sarang."}</p><small>${progress.bugs[type]} ditemukan</small></article>`).join("")}</div><div class="notice">Daun: geser menjauh sebelum jatuh (−10). Katak: ketuk ranting sebelum berbunyi (−15).</div>`,
  );
}
function help() {
  dialog(
    "Jadilah penjaga mimpinya",
    `<ol class="instructions"><li><b>Beri makan.</b> Ketuk serangga, atau geser ke sarang Gimmy.</li><li><b>Jaga ketenangan.</b> Geser daun menjauh; ketuk ranting untuk mengalihkan katak.</li><li><b>Rawat Sleep Chain.</b> Setiap 30 detik memberi poin. Poin langsung tersimpan untuk level.</li></ol><p>Kalau Sleep habis, Gimmy bangun. Tidak ada bonus bangun; poin yang telah didapat tetap milikmu.</p><p class="muted">Keyboard: Tab untuk memilih, Enter untuk menangkap/mengusir; Space atau Esc untuk jeda.</p>`,
  );
}
function clearEntities() {
  entities.forEach((e) => e.el.remove());
  entities = [];
  drag = null;
  $("#branch").hidden = true;
}
function start() {
  clearEntities();
  run = new SleepRun(bank);
  camera = new CameraDirector();
  idle = 0;
  spawnAt = 5;
  hazardAt = 14;
  frogAt = 36;
  wakeTime = 0;
  state = "playing";
  document.body.classList.remove("awake");
  $("#home").hidden = true;
  $("#home-nav").hidden = true;
  $("#hud").hidden = false;
  $("#map-select").hidden = true;
  $("#profile").hidden = true;
  document.body.classList.add("in-game");
  scene?.play("Sleeping Idle");
  $("#hint").textContent = "Jaga mimpinya. Serangga pertama segera datang…";
  tone(330);
  updateHUD();
}
function home() {
  modal.close();
  state = "home";
  document.body.classList.remove("awake");
  clearEntities();
  $("#home").hidden = false;
  $("#home-nav").hidden = false;
  $("#hud").hidden = true;
  $("#map-select").hidden = false;
  $("#profile").hidden = false;
  document.body.classList.remove("in-game");
  $("#stage").style.transform = "scale(1)";
  scene?.play("Sleeping Idle");
  refreshProfile();
}
function pause() {
  if (state !== "playing") return;
  state = "paused";
  cancelDrag();
  dialog(
    "Hutan ikut beristirahat",
    `<p>Waktu dan Sleep Meter dijeda. Mimpinya aman sampai kamu kembali.</p><button class="primary" id="resume">Lanjutkan mimpi</button><button class="secondary" id="leave">Selesai & kembali</button>`,
  );
  $("#resume").onclick = () => modal.close();
  $("#leave").onclick = () => {
    progress.best = Math.max(progress.best, Math.floor(run.seconds));
    save();
    home();
  };
}
modal.addEventListener("close", () => {
  if (state === "result") {
    home();
    return;
  }
  if (state === "paused") {
    state = "playing";
    idle = 0;
    last = performance.now();
  }
});
function wake() {
  if (state !== "playing") return;
  state = "waking";
  document.body.classList.add("awake");
  wakeTime = 0;
  clearEntities();
  progress.best = Math.max(progress.best, Math.floor(run.seconds));
  save();
  scene?.play("Wake up 01", true);
  $("#hint").textContent = "Gimmy sudah bangun. Terima kasih menjaga mimpinya.";
  tone(220);
}
function results() {
  state = "result";
  dialog(
    "Selamat pagi, Gimmy.",
    `<p>Setiap mimpi kecil tetap berarti.</p><div class="result-grid"><div><small>SLEEP CHAIN</small><strong>${format(run.seconds)}</strong></div><div><small>POIN TERSIMPAN</small><strong>+${run.points}</strong></div></div><p>Bangun tidak memberi bonus. Semua poin milestone sudah tersimpan untuk Level ${levelFor(progress.xp)}.</p><button id="again" class="primary">Satu mimpi lagi</button><button id="back-home" class="secondary">Kembali ke hutan</button>`,
  );
  $("#again").onclick = () => {
    modal.close();
    start();
  };
  $("#back-home").onclick = home;
}
modal.addEventListener("cancel", (e) => {
  if (state === "result") {
    e.preventDefault();
    home();
  }
});
function updateHUD() {
  $("#sleep-label").textContent = sleepLabel(run.sleep);
  $("#sleep-fill").style.width = `${run.sleep}%`;
  $("#sleep-number").textContent = Math.ceil(run.sleep).toString();
  $("#sleep-fill").classList.toggle("danger", run.sleep < 25);
  $("#risk").textContent =
    run.sleep < 25
      ? "Gimmy gelisah. Cari makanan!"
      : "Jaga agar mimpinya tetap hangat";
  $("#timer").textContent = format(run.seconds);
  const next = run.paid + 1;
  $("#next-reward").textContent =
    `${Math.ceil(next * 30 - run.seconds)} dtk → +${[0, 10, 20, 30, 50][Math.min(next, 4)]} poin`;
  $("#run-points span").textContent = run.points.toString();
}
function spawn(type: Entity["type"]) {
  const el = document.createElement("button");
  el.className = `entity ${type}`;
  const e: Entity = {
    id: ++serial,
    type,
    x: type === "frog" ? 76 : 20 + Math.random() * 60,
    y: type === "leaf" ? 25 : type === "frog" ? 68 : 30 + Math.random() * 17,
    life: 0,
    max:
      type === "leaf" ? 7 : type === "frog" ? 6 : type === "cricket" ? 9 : 12,
    el,
    used: false,
  };
  el.innerHTML = `${icons[type]}<span class="entity-time"></span>`;
  el.setAttribute(
    "aria-label",
    type === "leaf"
      ? "Usir daun"
      : type === "frog"
        ? "Katak — ketuk ranting"
        : `Beri makan ${bugNames[type]}`,
  );
  if (type === "leaf") el.setAttribute("aria-label", "Usir daun");
  $("#objects").append(el);
  entities.push(e);
  if (type === "frog") {
    $("#branch").hidden = false;
    $("#hint").textContent =
      "Katak mau bernyanyi! Ketuk ranting untuk mengalihkannya.";
  } else if (type === "leaf")
    $("#hint").textContent = "Daun jatuh! Geser menjauh dari sarang.";
  else if (run.seconds < 12)
    $("#hint").textContent =
      "Ngengat datang. Ketuk, atau geser ke sarang Gimmy.";
  el.onpointerdown = (ev) => {
    if (state !== "playing" || drag) return;
    ev.preventDefault();
    idle = 0;
    drag = {
      entity: e,
      pointer: ev.pointerId,
      x: ev.clientX,
      y: ev.clientY,
      moved: false,
    };
    el.setPointerCapture(ev.pointerId);
    el.classList.add("held");
  };
  el.onpointermove = (ev) => {
    if (!drag || drag.entity !== e || drag.pointer !== ev.pointerId) return;
    const rect = $("#stage").getBoundingClientRect();
    if (Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y) > 8)
      drag.moved = true;
    if (drag.moved) {
      e.x = ((ev.clientX - rect.left) / rect.width) * 100;
      e.y = ((ev.clientY - rect.top) / rect.height) * 100;
      position(e);
    }
  };
  el.onpointerup = (ev) => {
    if (!drag || drag.entity !== e || drag.pointer !== ev.pointerId) return;
    const d = drag;
    drag = null;
    el.classList.remove("held");
    idle = 0;
    if (type === "leaf") {
      if (
        Math.hypot(ev.clientX - d.x, ev.clientY - d.y) > 45 &&
        (e.x < 12 ||
          e.x > 85 ||
          e.y < 20 ||
          e.y > 82 ||
          Math.hypot(e.x - 44, e.y - 58) > 35)
      )
        resolve(e, true);
      else toast("Geser daun menjauh dari sarang.");
    } else if (type === "frog") {
      toast("Ketuk tombol ranting di bawah sarang.");
    } else if (!d.moved || (e.x > 15 && e.x < 76 && e.y > 46 && e.y < 75)) {
      resolve(e, true);
    } else {
      e.x = 20 + Math.random() * 60;
      e.y = 35;
    }
  };
  el.onpointercancel = cancelDrag;
  el.onlostpointercapture = () => {
    if (drag?.entity === e) cancelDrag();
  };
  el.onclick = (ev) => {
    if (ev.detail === 0 && state === "playing") {
      if (type === "frog")
        toast("Pilih tombol ranting untuk mengalihkan katak.");
      else resolve(e, true);
    }
  };
  position(e);
  return e;
}
function position(e: Entity) {
  e.el.style.left = `${e.x}%`;
  e.el.style.top = `${e.y}%`;
  e.el.style.setProperty("--life", `${Math.max(0, 1 - e.life / e.max) * 100}%`);
}
function cancelDrag() {
  if (drag) {
    drag.entity.el.classList.remove("held");
    drag = null;
  }
}
function resolve(e: Entity, success: boolean) {
  if (e.used || state !== "playing") return;
  e.used = true;
  e.el.remove();
  entities = entities.filter((x) => x !== e);
  if (drag?.entity === e) cancelDrag();
  if (e.type === "frog") $("#branch").hidden = true;
  if (success) {
    if (e.type === "leaf" || e.type === "frog") {
      toast(
        e.type === "leaf"
          ? "Daun tersapu. Mimpinya aman."
          : "Katak pergi mengikuti bunyi ranting.",
      );
      tone(330);
    } else {
      run.change(foodValue[e.type]);
      progress.bugs[e.type]++;
      save();
      toast(`${bugNames[e.type]} · +${foodValue[e.type]} Sleep`);
      tone(520);
    }
  } else if (e.type === "leaf" || e.type === "frog" || e.type === "cricket") {
    const damage = e.type === "leaf" ? 10 : e.type === "frog" ? 15 : 5;
    run.change(-damage);
    toast(`Hutan berisik · −${damage} Sleep`);
  }
  if (run.awake) wake();
  updateHUD();
}
$("#branch").onclick = () => {
  const frog = entities.find((e) => e.type === "frog");
  if (frog) resolve(frog, true);
};
$("#play").onclick = () => settings(true);
$("#settings").onclick = () => {
  if (state === "playing") {
    pause();
    return;
  }
  settings();
};
$("#map-select").onclick = chooseMap;
$("#book").onclick = book;
$("#how").onclick = help;
$("#pause").onclick = pause;
$(".wordmark").onclick = (ev) => {
  ev.preventDefault();
  if (state === "playing") pause();
  else if (state === "home") home();
};
$("#bed").onclick = () =>
  dialog(
    "Sarang daun pertama",
    `<div class="bed-preview">☾</div><p>Sarang hangat dari ranting dan daun hutan. Rumah pertama Gimmy, dan awal dari semua mimpinya.</p><div class="notice">Sarang awal aktif · tanpa bonus statistik.<br>Variasi sarang akan hadir pada pengembangan berikutnya.</div>`,
  );
document.addEventListener("pointerdown", () => {
  idle = 0;
});
document.addEventListener("keydown", (ev) => {
  idle = 0;
  if (
    (ev.code === "Escape" ||
      (ev.code === "Space" && !(ev.target instanceof HTMLButtonElement))) &&
    !modal.open &&
    state === "playing"
  ) {
    ev.preventDefault();
    pause();
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});
window.addEventListener("blur", () => pause());
window.addEventListener("resize", () => scene?.resize());
function tick(now: number) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  requestAnimationFrame(tick);
  if (document.hidden) return;
  if (state === "playing") {
    idle += dt;
    run.step(dt, map === "rainforest" ? 1.2 : 1);
    if (!run.awake)
      scene?.play(run.sleep < 25 ? "Sleep Idle 2" : "Sleeping Idle");
    if (run.awake) wake();
    else {
      if (run.seconds >= spawnAt) {
        spawn(
          run.seconds < 20
            ? "moth"
            : (["moth", "cricket", "beetle"] as Bug[])[
                Math.floor(Math.random() * 3)
              ],
        );
        spawnAt = run.seconds + 5 + Math.random() * 3;
      }
      if (run.seconds >= hazardAt) {
        spawn("leaf");
        hazardAt =
          run.seconds + (map === "rainforest" ? 8 : 14) + Math.random() * 5;
      }
      if (run.seconds >= frogAt) {
        spawn("frog");
        frogAt = run.seconds + 25 + Math.random() * 10;
      }
      for (const e of [...entities]) {
        e.life += dt;
        if (drag?.entity !== e) {
          if (e.type === "leaf") e.y += dt * 4;
          else if (e.type !== "frog")
            e.x += Math.sin(e.life * 1.8 + e.id) * dt * 2;
        }
        position(e);
        if (e.life >= e.max) resolve(e, false);
      }
      updateHUD();
    }
  }
  if (state === "waking") {
    wakeTime += dt;
    if (wakeTime > 2.7) results();
  }
  if (state === "playing" || state === "waking")
    $("#stage").style.transform =
      `scale(${camera.update(run.sleep, idle, !!drag, dt, progress.reduced)})`;
  frame += dt;
  const interval = progress.quality === "low" ? 1 / 30 : 1 / 60;
  if (frame >= interval) {
    scene?.render(frame, state !== "paused" && state !== "result");
    frame = 0;
  }
}
refreshProfile();
applyQuality();
setMap("forest");
async function load() {
  try {
    scene ??= new GimmyScene($<HTMLCanvasElement>("#gimmy"), progress.quality);
    await scene.load();
    ready = true;
    $<HTMLButtonElement>("#play").disabled = false;
    $("#play").textContent = "Mulai bermimpi  →";
    $("#load-note").textContent = "Pilih kualitas visual sebelum bermain";
  } catch (error) {
    console.error(error);
    $("#load-note").textContent =
      "Model belum dapat dimuat. Periksa WebGL atau coba lagi.";
    $("#play").textContent = "Coba muat ulang";
    $<HTMLButtonElement>("#play").disabled = false;
    $("#play").onclick = () => location.reload();
  }
}
void load();
requestAnimationFrame(tick);
if (!storageOK)
  toast(
    "Penyimpanan tidak tersedia. Progres hanya bertahan selama halaman ini terbuka.",
  );
if (import.meta.env.DEV)
  Object.assign(window, {
    __gimmy: {
      get snapshot() {
        return {
          state,
          ready,
          sleep: run.sleep,
          seconds: run.seconds,
          points: run.points,
          xp: progress.xp,
          level: levelFor(progress.xp),
          map,
          zoom: camera.zoom,
          drag: !!drag,
          entities: entities.map((e) => ({ id: e.id, type: e.type })),
        };
      },
      step(seconds: number) {
        for (let i = 0; i < seconds * 10 && state === "playing"; i++) {
          run.step(0.1);
          if (run.awake) wake();
        }
        updateHUD();
      },
      feed() {
        run.change(100);
      },
      setSleep(n: number) {
        run.sleep = n;
      },
      setIdle(n: number) {
        idle = n;
      },
      spawn,
      wake() {
        run.change(-100);
        wake();
      },
      start,
      home,
    },
  });
