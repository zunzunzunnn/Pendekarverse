import "./style.css";
import { GimmyScene } from "./scene";
import {
  CameraDirector,
  freshProgress,
  foodValue,
  bugNames,
  sleepLabel,
  type Bug,
  type Quality,
} from "./rules";
import { LEVELS, configFor, levelFor, damageFor } from "./levels";
import { CountdownRun } from "./countdown";
import { ObstacleDirector } from "./director";
import { SAVE_KEY, loadProgress, credit } from "./storage";
import { icons } from "./icons";
import {
  BEDS,
  MAPS,
  BUG_ART,
  EXTRA_BUG_NAMES,
  mapUnlocked,
  type BedId,
  type WorldId,
} from "./collections";
import { loadSprite, drawSprite, type SpriteName } from "./sprites";
const $ = <T extends HTMLElement = HTMLElement>(s: string) =>
  document.querySelector<T>(s)!;
const base = import.meta.env.BASE_URL,
  asset = (name: string) => `${base}gimmy/ui/${name}.webp`,
  rootAsset = (name: string) => `${base}${name}`;

const HOME_BACKGROUNDS: Record<WorldId, string> = {
  forest: "Asset2_0000s_0000s_0004_Forest.png",
  village: "Asset2_0000s_0000s_0000_Village.png",
  canopy: "Asset2_0000s_0000s_0001_Tree-Canopy.png",
  dream: "Asset2_0000s_0000s_0003_Dream.png",
  rainforest: "Asset2_0000s_0000s_0002_Rainforest.png",
};
const HOME_BEDS: Partial<Record<BedId, string>> = {
  daun: "Asset2_0000s_0003_Leaf.png",
  ranting: "Asset2_0000s_0004_Twig.png",
  goa: "Asset2_0000s_0001_Goa.png",
  kasur: "Asset2_0000s_0002_Bed.png",
};
const BED_CARDS: Partial<Record<BedId, string>> = {
  daun: "Asset2_0000s_0000s_0002_Leaf.png",
  ranting: "Asset2_0000s_0000s_0004_Twig.png",
  goa: "Asset2_0000s_0000s_0001_Goa.png",
  kasur: "Asset2_0000s_0000s_0003_Bed.png",
  hamok: "Asset2_0000s_0000s_0000_Hamok.png",
};
const HOME_BED_FOREGROUNDS: Partial<Record<BedId, string>> = {
  daun: "Asset_0000s_0001_Foreground_Leaf.png",
  ranting: "Asset_0000s_0000_Foreground_Twig.png",
  goa: "Asset_0000s_0002_Foreground_Goa.png",
  kasur: "Asset_0000s_0003_Foreground__Bed.png",
};
const animatedBugs = new Map<SpriteName, HTMLImageElement>();
function bugArt(type: string, animate = false) {
  if (!BUG_ART.includes(type as (typeof BUG_ART)[number]))
    return icons[type as keyof typeof icons] ?? "";
  const name =
    type === "moth"
      ? "moth-animation"
      : type === "cockroach"
        ? "cockroach-animation"
        : null;
  if (animate && name && progress.quality !== "low" && !progress.reduced) {
    void loadSprite(name)
      .then((img) => animatedBugs.set(name, img))
      .catch(() => {});
    return `<img class="bug-art" src="${base}gimmy/bugs/${type}.webp" alt=""/><canvas class="bug-animation" data-sprite="${name}" hidden></canvas>`;
  }
  return `<img class="bug-art" src="${base}gimmy/bugs/${type}.webp" alt=""/>`;
}
let progress = freshProgress(),
  storageOK = true;
try {
  progress = loadProgress(localStorage);
} catch {
  storageOK = false;
}
function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(progress));
  } catch {
    if (storageOK) {
      storageOK = false;
      toast(
        "Penyimpanan tidak tersedia. Poin hanya tersimpan selama halaman terbuka.",
      );
    }
  }
}
type State = "home" | "ready" | "playing" | "paused" | "waking" | "result";
type Kind = Bug | "leaf" | "frog";
interface Entity {
  id: number;
  type: Kind;
  x: number;
  y: number;
  startX: number;
  startY: number;
  born: number;
  due: number;
  max: number;
  el: HTMLButtonElement;
  used: boolean;
}
let state: State = "home",
  selected = levelFor(progress.xp),
  runId = "",
  run = new CountdownRun(selected, bank),
  director = new ObstacleDirector(selected),
  camera = new CameraDirector();
let scene: GimmyScene | undefined,
  ready = false,
  idle = 0,
  wakeTime = 0,
  readyTime = 0,
  last = performance.now(),
  frame = 0,
  serial = 0;
let hitTimes: number[] = [];
let entities: Entity[] = [],
  drag: {
    entity: Entity;
    pointer: number;
    x: number;
    y: number;
    moved: boolean;
  } | null = null;
const format = (t: number) => {
  const n = Math.ceil(Math.max(0, t) - 1e-8);
  return `${Math.floor(n / 60)
    .toString()
    .padStart(2, "0")}:${(n % 60).toString().padStart(2, "0")}`;
};
$("#app").innerHTML = `<main id="shell">
 <div id="stage"><div class="forest-art"></div><img id="home-bed-layer" class="home-scene-layer" alt=""/><div class="mist"></div><div id="fireflies" aria-hidden="true">${Array.from({ length: 16 }, (_, i) => `<i style="--x:${(i * 37) % 100}%;--y:${(i * 23) % 90}%;--delay:${i * 0.4}s"></i>`).join("")}</div><div id="character-anchor"><div class="gimmy-shadow"></div><canvas id="gimmy" aria-label="Gimmy si tarsius kecil"></canvas><div class="zzz" aria-hidden="true">z<span>z</span><small>z</small></div></div><img id="home-bed-foreground" class="home-scene-layer" alt=""/><div id="objects"></div><img id="home-global-foreground" class="home-scene-layer" src="${rootAsset("Asset2_0000s_0000_Foreground.png")}" alt=""/></div>
 <div class="edge-shade"></div>
 <header><a href="#" class="wordmark" aria-label="Beranda Gimmy">GIMMY<span>THE LITTLE TARSIUS</span></a><button id="settings" class="art-button" aria-label="Pengaturan"><img src="${asset("settings")}" alt=""/></button></header>
 <button id="profile" aria-label="Pilih level"><img src="${asset("level")}" alt=""/><div><h2>Gimmy</h2><strong id="level"></strong><small id="xp"></small><div class="xp-track"><i id="xpbar"></i></div></div></button>
 <button id="map-select" class="map-badge" aria-label="Forest, peta aktif"><img src="${asset("forest-card")}" alt=""/><span>Forest <small>AKTIF</small></span></button>
 <section id="home"><img class="logo" src="${base}gimmy/logo.webp" alt="Gimmy : The Little Tarsius"/><div class="home-copy"><h1>Jaga mimpi kecilnya.</h1><p>Redakan riuh hutan. Bertahan sampai 00:00.</p><button id="play" class="art-button" aria-label="Play" disabled><img src="${asset("play")}" alt="Play"/></button><small id="load-note" role="status">Menyiapkan Gimmy…</small><button id="level-choice" class="text-button">Pilih tantangan</button></div></section>
 <section id="hud" hidden><div class="chain-stack"><div id="run-points"><span>✦ Poin tersimpan</span><strong>0</strong><small id="earned">+0 sesi ini</small></div><div class="chain"><img src="${asset("chain")}" alt="Sleep Chain"/><strong id="timer">02:00</strong></div><small id="next-reward"></small><div id="milestones" aria-label="Milestone sesi"><i></i><i></i><i></i><i></i></div></div>
 <button id="pause" class="round-button" aria-label="Jeda permainan">Ⅱ</button><div id="hint" role="status"></div><button id="branch" hidden>♧ Ketuk ranting <small>Alihkan katak</small></button><div class="sleep-panel"><div><span>☾ SLEEP METER</span><strong id="sleep-label">Cozy</strong></div><div class="sleep-track" role="progressbar" aria-label="Sleep Meter" aria-valuemin="0" aria-valuemax="100"><i id="sleep-fill"></i></div><small><span id="sleep-number">80</span> / 100 <span id="risk">Jaga mimpinya sampai waktu habis</span></small></div></section>
 <nav id="home-nav"><button id="book" class="art-button collection-entry" aria-label="Bug Guide"><img src="${base}gimmy/collection-ui/Bug Guide2.png" alt="Bug Guide"/></button><button id="my-bed" class="art-button collection-entry" aria-label="Bed Upgrade"><img src="${base}gimmy/collection-ui/Bed Upgrade.png" alt="Bed Upgrade"/></button><button id="skins" class="art-button collection-entry" aria-label="Skins Collection"><img src="${base}gimmy/collection-ui/Collection.png" alt="Skins Collection"/></button><button id="how" class="art-button" aria-label="Cara bermain"><img src="${asset("info")}" alt="Info"/></button></nav>
 <div id="ready-cue" hidden aria-live="polite"></div><footer><span>GIMMY · SLEEP CHALLENGE</span><span id="best"></span></footer>
 </main><div id="toast" role="status"></div><dialog id="dialog" aria-labelledby="dialog-title"></dialog>`;
const modal = $<HTMLDialogElement>("#dialog");
let toastTimer = 0;
function toast(message: string) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(
    () => $("#toast").classList.remove("show"),
    2200,
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
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.025, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.35);
    o.connect(g).connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + 0.35);
  } catch {}
}
function refreshProfile() {
  const unlocked = levelFor(progress.xp),
    active = state === "home" ? selected : run.level,
    next = LEVELS[unlocked];
  $("#level").textContent =
    `Level ${active} / 5 · ${format(configFor(active).duration)}`;
  $("#xp").textContent = next
    ? `${progress.xp}/${next.threshold} poin → Lv.${unlocked + 1}`
    : `${progress.xp} poin · Level maksimum`;
  const min = configFor(unlocked).threshold;
  $("#xpbar").style.width = next
    ? `${((progress.xp - min) / (next.threshold - min)) * 100}%`
    : "100%";
  $("#best").textContent =
    `${progress.completed?.length ?? 0}/5 TANTANGAN SELESAI`;
  $("#level-choice").textContent =
    `Level ${selected} · ${format(configFor(selected).duration)} · Pilih tantangan ↗`;
}
function bank(_points: number, milestone: number) {
  const prev = levelFor(progress.xp);
  if (!credit(progress, runId, milestone)) return;
  save();
  refreshProfile();
  toast(
    levelFor(progress.xp) > prev
      ? `Level ${levelFor(progress.xp)} terbuka untuk sesi berikutnya!`
      : "+5 poin tersimpan",
  );
  tone(660);
}
function dialog(title: string, body: string) {
  modal.innerHTML = `<button class="close round-button" aria-label="Tutup">×</button><span class="eyebrow">GIMMY · THE LITTLE TARSIUS</span><h2 id="dialog-title">${title}</h2>${body}`;
  modal.querySelector(".close")!.addEventListener("click", () => modal.close());
  if (!modal.open) modal.showModal();
}
function collectionDialog(kind: "beds" | "skins" | "bugs", body: string, total: string) {
  const title = kind === "beds" ? "Asset2_0000s_0000_Beds-Collection.png" : kind === "skins" ? "Asset2_0000s_0001_Skins-Collection.png" : "Asset2_0000s_0002_Bugs-Guide-Collection.png";
  modal.classList.add("collection-dialog");
  modal.innerHTML = `<div class="collection-bg"></div><img class="collection-panel" src="${base}gimmy/collection-ui/Asset2_0000s_0005_Panel.png" alt=""/><img class="collection-title" src="${base}gimmy/collection-ui/${title}" alt=""/><div class="collection-total"><img src="${base}gimmy/collection-ui/Asset2_0000s_0004_Total-Skin.png" alt="Total"/><strong>${total}</strong></div><button class="collection-exit" aria-label="Kembali ke main menu"><img src="${base}gimmy/collection-ui/Asset2_0000s_0003_Exit.png" alt="Exit"/></button><div class="collection-content">${body}</div>`;
  modal.querySelector(".collection-exit")!.addEventListener("click", () => modal.close());
  modal.addEventListener("close", () => modal.classList.remove("collection-dialog"), { once: true });
  if (!modal.open) modal.showModal();
}
function chooseLevel() {
  dialog(
    "Pilih mimpi berikutnya",
    `<p>Level terbuka dari total poin. Poin tidak habis saat naik level.</p><div class="levels">${LEVELS.map((c) => `<button data-level="${c.level}" ${c.level > levelFor(progress.xp) ? "disabled" : ""} class="${c.level === selected ? "selected" : ""}"><strong>Level ${c.level}</strong><b>${format(c.duration)}</b><small>${c.level > levelFor(progress.xp) ? `${progress.xp}/${c.threshold} poin` : progress.completed?.includes(c.level) ? "✓ Pernah berhasil" : "Terbuka"}${c.level === 5 ? " · Ekstra sulit" : ""}</small></button>`).join("")}</div>`,
  );
  modal.querySelectorAll<HTMLButtonElement>("[data-level]").forEach(
    (b) =>
      (b.onclick = () => {
        selected = Number(b.dataset.level);
        refreshProfile();
        modal.close();
      }),
  );
}
function settings(preSleep = false) {
  if (state === "playing" || state === "ready") freeze();
  dialog(
    preSleep ? "Sebelum terlelap" : "Pengaturan",
    `<p>${preSleep ? `Level ${selected} · jaga Sleep sampai ${format(configFor(selected).duration)} berakhir.` : "Sesuaikan kenyamanan dunia kecil Gimmy."}</p><label class="field">Kualitas visual<select id="quality"><option value="low">Ringan · ponsel / hemat daya</option><option value="medium">Seimbang</option><option value="high">Tinggi</option></select></label><label class="check"><input id="sound" type="checkbox" ${progress.sound ? "checked" : ""}/> Suara interaksi</label><label class="check"><input id="reduced" type="checkbox" ${progress.reduced ? "checked" : ""}/> Kurangi gerakan & zoom</label><div class="notice">Ketuk makanan. Geser daun menjauh, atau ketuk daun lalu pilih arah buang. Ketuk ranting saat katak datang.</div><button id="confirm" class="primary">${preSleep ? "Mulai bermimpi" : "Simpan & lanjutkan"}</button>`,
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
  if (scene) {
    scene.reduced = progress.reduced;
    scene.quality(progress.quality);
  }
}
function help() {
  dialog(
    "Sampai hitungan nol",
    `<ol><li><b>Tujuan:</b> jaga Sleep di atas nol sampai countdown mencapai 00:00.</li><li><b>Makanan:</b> ketuk ngengat/kumbang/jangkrik atau seret ke sarang. Makanan menambah Sleep, bukan waktu.</li><li><b>Gangguan:</b> geser daun menjauh; ketuk ranting untuk mengalihkan katak. Jangkrik yang dibiarkan akan berbunyi.</li><li><b>Poin:</b> +5 pada 25%, 50%, 75%, dan penyelesaian sesi. Poin tetap tersimpan jika gagal.</li></ol><p>Level 2/3/4/5 terbuka pada 40/100/180/280 poin. Level sesi tidak berubah di tengah permainan.</p><p class="muted">Keyboard: Tab memilih, Enter menangkap/mengusir, Esc menjeda. Pada layar sentuh, daun juga bisa diketuk lalu dibuang memakai tombol arah.</p>`,
  );
}
function book() {
  const found = BUG_ART.filter((t) => t in foodValue && progress.bugs[t as Bug] > 0).length;
  collectionDialog(
    "bugs",
    `<div class="bug-grid">${BUG_ART.map((t) => {
      const active = t in foodValue;
      return `<article><div>${bugArt(t)}</div><h3>${bugNames[t as Bug] ?? EXTRA_BUG_NAMES[t]}</h3><b>${active ? `+${foodValue[t as Bug]} Sleep` : "Segera hadir"}</b><small>${active ? `${progress.bugs[t as Bug]} ditemukan` : "Belum tersedia"}</small></article>`;
    }).join("")}</div>`,
    `${found}/${BUG_ART.length}`,
  );
}
function skinsCollection() {
  collectionDialog(
    "skins",
    '<div class="skin-empty"><strong>Skin Collection</strong><p>Slot skin siap. Asset skin individual belum tersedia di project.</p></div>',
    "0/0",
  );
}
function refreshWorld() {
  const map = MAPS.find((m) => m.id === (progress.selectedMap ?? "forest"))!;
  $("#map-select").innerHTML =
    `<img src="${base}gimmy/maps/${map.id}.webp" alt=""/><span>${map.name}<small>AKTIF</small></span>`;
  $("#map-select").setAttribute("aria-label", `${map.name}, pilih peta`);
  $(".forest-art").style.backgroundImage =
    `url("${rootAsset(HOME_BACKGROUNDS[map.id])}")`;
  const bedId = progress.selectedBed ?? "daun";
  const bed = HOME_BEDS[bedId] ?? HOME_BEDS.daun!;
  const bedForeground =
    HOME_BED_FOREGROUNDS[bedId] ?? HOME_BED_FOREGROUNDS.daun!;
  $<HTMLImageElement>("#home-bed-layer").src = rootAsset(bed);
  $<HTMLImageElement>("#home-bed-foreground").src = rootAsset(bedForeground);
  $("#my-bed").title =
    `Bed ${BEDS.find((b) => b.id === bedId)!.name}`;
}
function collectionLoading(loading: boolean) {
  ready = !loading;
  $<HTMLButtonElement>("#play").disabled = loading;
  $<HTMLButtonElement>("#map-select").disabled = loading;
  $<HTMLButtonElement>("#my-bed").disabled = loading;
  $("#load-note").textContent = loading
    ? "Menyiapkan tempat mimpi…"
    : "Pilih kualitas visual sebelum bermain";
}
function chooseBed() {
  if (state !== "home" || !ready) return;
  collectionDialog(
    "beds",
    `<div class="collection-grid bed-card-grid">${BEDS.map((b) => `<button data-bed="${b.id}" class="${progress.selectedBed === b.id ? "selected" : ""}"><img src="${rootAsset(BED_CARDS[b.id] ?? BED_CARDS.daun!)}" alt="Bed ${b.name}"/><strong>${b.name}</strong><small>${progress.selectedBed === b.id ? "✓ Dipakai" : "Pakai"}</small></button>`).join("")}</div><p id="collection-status" role="status">Pilih bed untuk melihatnya bersama Gimmy.</p>`,
    `${BEDS.length}/${BEDS.length}`,
  );
  modal.querySelectorAll<HTMLButtonElement>("[data-bed]").forEach(
    (b) =>
      (b.onclick = async () => {
        if (!ready || !scene) return;
        const id = b.dataset.bed as BedId;
        if (id === progress.selectedBed) return;
        collectionLoading(true);
        modal
          .querySelectorAll<HTMLButtonElement>("[data-bed]")
          .forEach((x) => (x.disabled = true));
        $("#collection-status").textContent = "Memuat bed…";
        try {
          progress.selectedBed = id;
          save();
          refreshWorld();
          layoutScene();
          collectionLoading(false);
          chooseBed();
        } catch {
          collectionLoading(false);
          chooseBed();
          $("#collection-status").textContent =
            "Bed gagal dimuat. Pilihan sebelumnya tetap dipakai; pilih lagi untuk mencoba.";
        }
      }),
  );
}
function chooseMap() {
  if (state !== "home" || !ready) return;
  dialog(
    "Dunia Gimmy",
    `<p>Pilih suasana mimpi. Lima tantangan memiliki aturan yang sama di setiap dunia.</p><div class="collection-grid">${MAPS.map((m) => `<button data-map="${m.id}" class="${progress.selectedMap === m.id ? "selected" : ""}"><img src="${base}gimmy/maps/${m.id}.webp" alt="${m.name}"/><strong>${m.name}</strong><small>${progress.selectedMap === m.id ? "✓ Aktif" : "Pakai"}</small></button>`).join("")}</div><p id="collection-status" role="status"></p>`,
  );
  modal.querySelectorAll<HTMLButtonElement>("[data-map]").forEach(
    (b) =>
      (b.onclick = async () => {
        if (!ready) return;
        const id = b.dataset.map as WorldId;
        collectionLoading(true);
        modal
          .querySelectorAll<HTMLButtonElement>("[data-map]")
          .forEach((x) => (x.disabled = true));
        $("#collection-status").textContent = "Memuat dunia…";
        try {
          const img = new Image();
          img.src = `${base}gimmy/maps/${id}.webp`;
          await img.decode();
          progress.selectedMap = id;
          save();
          refreshWorld();
          layoutScene();
          collectionLoading(false);
          chooseMap();
        } catch {
          collectionLoading(false);
          chooseMap();
          $("#collection-status").textContent =
            "Dunia gagal dimuat. Pilih lagi untuk mencoba.";
        }
      }),
  );
}
function remove(e: Entity) {
  e.used = true;
  document.querySelector(`[data-leaf-actions="${e.id}"]`)?.remove();
  e.el.remove();
  entities = entities.filter((x) => x !== e);
  if (drag?.entity === e) cancelDrag();
  if (e.type === "frog") $("#branch").hidden = true;
}
function clearEntities() {
  for (const e of [...entities]) remove(e);
  drag = null;
}
function beginReady(seconds: number) {
  state = "ready";
  readyTime = seconds;
  $("#ready-cue").hidden = false;
  $("#ready-cue").textContent = Math.ceil(seconds).toString();
  last = performance.now();
}
function start(level = selected) {
  if (!ready) return;
  clearTimeout(toastTimer);
  $("#toast").classList.remove("show");
  selected = Math.min(levelFor(progress.xp), Math.max(1, level));
  clearEntities();
  runId = crypto.randomUUID();
  run = new CountdownRun(selected, bank);
  director = new ObstacleDirector(selected);
  camera = new CameraDirector();
  idle = 0;
  wakeTime = 0;
  hitTimes = [];
  document.body.classList.remove("awake");
  document.body.classList.add("in-game");
  $("#home").hidden = true;
  $("#home-nav").hidden = true;
  $("#hud").hidden = false;
  $<HTMLButtonElement>("#profile").disabled = true;
  $<HTMLButtonElement>("#map-select").disabled = true;
  $("#hint").textContent = "Bertahan sampai 00:00. Poin langsung tersimpan.";
  scene?.resetSleep();
  beginReady(3);
  refreshProfile();
  updateHUD();
  tone(330);
}
function home() {
  clearTimeout(toastTimer);
  $("#toast").classList.remove("show");
  state = "home";
  modal.close();
  clearEntities();
  selected = levelFor(progress.xp);
  $("#ready-cue").hidden = true;
  $("#home").hidden = false;
  $("#home-nav").hidden = false;
  $("#hud").hidden = true;
  $<HTMLButtonElement>("#profile").disabled = false;
  $<HTMLButtonElement>("#map-select").disabled = !ready;
  document.body.classList.remove("awake", "in-game");
  $("#stage").style.transform = "scale(1)";
  scene?.resetSleep();
  refreshProfile();
}
let pauseFrom: State = "playing";
function freeze() {
  pauseFrom = state;
  state = "paused";
  cancelDrag();
  $("#ready-cue").hidden = true;
}
function pause() {
  if (state !== "playing" && state !== "ready") return;
  freeze();
  dialog(
    "Mimpinya aman",
    `<p>Waktu, gangguan, dan Sleep dijeda sampai kamu melanjutkan.</p><button class="primary" id="resume">Lanjutkan mimpi</button><button class="secondary" id="leave">Kembali ke hutan</button>`,
  );
  $("#resume").onclick = () => modal.close();
  $("#leave").onclick = home;
}
modal.addEventListener("close", () => {
  if (modal.open) return;
  if (state === "paused") {
    idle = 0;
    beginReady(pauseFrom === "ready" ? Math.max(1, readyTime) : 1);
  } else if (state === "result") home();
});
function finish() {
  if (state !== "playing") return;
  clearEntities();
  if (run.outcome === "success") {
    progress.completed = [
      ...new Set([...(progress.completed ?? []), run.level]),
    ];
    save();
    tone(740);
    results();
  } else if (run.awake) {
    state = "waking";
    wakeTime = 0;
    document.body.classList.add("awake");
    scene?.setSleep(0);
    $("#hint").textContent = "Gimmy bangun. Poin milestone tetap tersimpan.";
    tone(220);
  }
}
function results() {
  state = "result";
  const success = run.outcome === "success",
    unlocked = levelFor(progress.xp);
  dialog(
    success ? "Mimpi terjaga!" : "Gimmy sudah bangun",
    `<p>${success ? `Level ${run.level} selesai. Terima kasih sudah menjaga mimpinya.` : "Coba lagi. Semua poin yang sudah didapat tetap tersimpan."}</p><div class="result-grid"><div><small>${success ? "COUNTDOWN SELESAI" : "WAKTU TERSISA"}</small><strong>${format(run.remaining)}</strong></div><div><small>POIN SESI</small><strong>+${run.points}</strong></div></div><p>Total ${progress.xp} poin · Level ${unlocked}${unlocked === 5 ? " (maksimum)" : ""}. ${success ? "" : "Bangun tidak memberi bonus."}</p><button id="again" class="primary">Ulang Level ${run.level}</button>${unlocked > run.level ? `<button id="next-level" class="primary">Main Level ${unlocked} · ${format(configFor(unlocked).duration)}</button>` : ""}<button id="back-home" class="secondary">Kembali ke hutan</button>`,
  );
  $("#again").onclick = () => {
    modal.close();
    start(run.level);
  };
  if (unlocked > run.level)
    $("#next-level").onclick = () => {
      modal.close();
      start(unlocked);
    };
  $("#back-home").onclick = home;
  refreshProfile();
}
function updateHUD() {
  $("#sleep-label").textContent = sleepLabel(run.sleep);
  $("#sleep-fill").style.width = `${run.sleep}%`;
  $("#sleep-fill").classList.toggle("danger", run.sleep < 25);
  $(".sleep-track").setAttribute(
    "aria-valuenow",
    Math.ceil(run.sleep).toString(),
  );
  $("#sleep-number").textContent = Math.ceil(run.sleep).toString();
  $("#risk").textContent =
    run.sleep < 25
      ? "Gimmy gelisah. Cari makanan!"
      : "Jaga mimpinya sampai waktu habis";
  $("#timer").textContent = format(run.remaining);
  $("#timer").classList.toggle(
    "urgent",
    run.remaining <= configFor(run.level).duration * 0.2,
  );
  $("#next-reward").textContent =
    run.paid >= 4
      ? "Sleep Chain selesai!"
      : `${format((run.duration * (run.paid + 1)) / 4 - run.seconds)} lagi → +5 poin`;
  $("#run-points strong").textContent = progress.xp.toString();
  $("#earned").textContent = `+${run.points} sesi ini`;
  $("#milestones")
    .querySelectorAll("i")
    .forEach((e, i) => e.classList.toggle("paid", i < run.paid));
}
function spawn(type: Kind, lifetime = 6, lane = Math.floor(Math.random() * 3)) {
  const w = $("#shell").clientWidth,
    mobile = w < 600,
    wide = w > 1100;
  const xs = mobile ? [18, 50, 82] : wide ? [40, 57, 74] : [35, 58, 80];
  const x = type === "frog" ? (mobile ? 80 : 76) : xs[lane],
    y =
      type === "frog"
        ? 66
        : type === "leaf"
          ? mobile
            ? 39
            : 31
          : mobile
            ? 47
            : 40;
  const el = document.createElement("button");
  el.className = `entity ${type}`;
  el.innerHTML = `${bugArt(type, true)}<span class="entity-time"></span>`;
  const e: Entity = {
    id: ++serial,
    type,
    x,
    y,
    startX: x,
    startY: y,
    born: run.seconds,
    due: run.seconds + lifetime,
    max: lifetime,
    el,
    used: false,
  };
  el.setAttribute(
    "aria-label",
    type === "leaf"
      ? "Usir daun"
      : type === "frog"
        ? "Katak — ketuk ranting"
        : `Beri makan ${bugNames[type]}`,
  );
  $("#objects").append(el);
  entities.push(e);
  if (type === "frog") {
    $("#branch").hidden = false;
    $("#hint").textContent = "Katak mau bernyanyi. Ketuk ranting!";
  } else if (type === "leaf")
    $("#hint").textContent =
      "Geser daun menjauh, atau ketuk lalu pilih arah buang.";
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
    if (Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y) > 8)
      drag.moved = true;
    if (drag.moved) {
      const r = $("#stage").getBoundingClientRect();
      e.x = ((ev.clientX - r.left) / r.width) * 100;
      e.y = ((ev.clientY - r.top) / r.height) * 100;
      position(e);
    }
  };
  el.onpointerup = (ev) => {
    syncInputTime();
    if (!drag || drag.entity !== e || drag.pointer !== ev.pointerId) return;
    const d = drag;
    drag = null;
    el.classList.remove("held");
    idle = 0;
    if (type === "leaf") {
      if (
        d.moved &&
        Math.hypot(ev.clientX - d.x, ev.clientY - d.y) > 40 &&
        Math.hypot(e.x - 47, e.y - 58) >
          Math.hypot(e.startX - 47, e.startY - 58)
      ) {
        resolve(e, true);
      } else if (!d.moved) {
        leafActions(e);
      } else toast("Geser menjauh dari sarang.");
    } else if (type === "frog") toast("Ketuk ranting untuk mengalihkan katak.");
    else if (!d.moved || (e.x > 15 && e.x < 80 && e.y > 45 && e.y < 76))
      resolve(e, true);
  };
  el.onpointercancel = cancelDrag;
  el.onlostpointercapture = () => {
    if (drag?.entity === e) cancelDrag();
  };
  el.onclick = (ev) => {
    syncInputTime();
    if (ev.detail === 0 && state === "playing") {
      if (type === "frog") toast("Pilih tombol ranting.");
      else resolve(e, true);
    }
  };
  position(e);
  return e;
}
function leafActions(e: Entity) {
  document.querySelector(".leaf-actions")?.remove();
  const panel = document.createElement("div");
  panel.className = "leaf-actions";
  panel.dataset.leafActions = e.id.toString();
  panel.style.left = `${e.x}%`;
  panel.style.top = `${e.y}%`;
  panel.innerHTML =
    '<button aria-label="Buang daun ke kiri">← Buang</button><button aria-label="Buang daun ke kanan">Buang →</button>';
  $("#objects").append(panel);
  panel.querySelectorAll("button").forEach((b) => {
    b.onclick = () => {
      syncInputTime();
      resolve(e, true);
    };
  });
}
function syncInputTime() {
  if (state === "playing") {
    const now = performance.now(),
      dt = (now - last) / 1000;
    last = now;
    if (dt > 2) pause();
    else if (dt > 0) simulate(dt);
  }
}

function position(e: Entity) {
  const sprite = e.el.querySelector<HTMLCanvasElement>(".bug-animation");
  if (sprite) {
    const name = sprite.dataset.sprite as SpriteName,
      img = animatedBugs.get(name);
    if (img) {
      sprite.hidden = false;
      e.el.querySelector<HTMLImageElement>(".bug-art")!.hidden = true;
      drawSprite(
        sprite,
        name,
        img,
        progress.reduced ? 0 : run.seconds - e.born,
      );
    }
  }
  e.el.style.left = `${e.x}%`;
  e.el.style.top = `${e.y}%`;
  e.el.style.setProperty(
    "--life",
    `${Math.max(0, (e.due - run.seconds) / e.max) * 100}%`,
  );
  e.el.classList.toggle("imminent", e.due - run.seconds < 1.3);
}
function cancelDrag() {
  if (drag) {
    drag.entity.el.classList.remove("held");
    drag = null;
  }
}
function resolve(e: Entity, success: boolean) {
  if (e.used || state !== "playing") return;
  remove(e);
  if (success) {
    if (e.type === "leaf" || e.type === "frog") {
      tone(330);
      $("#hint").textContent = "Mimpinya aman. Tetap perhatikan hutan.";
    } else {
      const fx = document.createElement("img");
      fx.className = "feeding-bug";
      fx.src = `${base}gimmy/bugs/${e.type}.webp`;
      fx.style.left = `${e.x}%`;
      fx.style.top = `${e.y}%`;
      $("#objects").append(fx);
      if (!progress.reduced)
        requestAnimationFrame(() => {
          const r = $("#character-anchor").getBoundingClientRect(),
            s = $("#stage").getBoundingClientRect();
          fx.style.transform = `translate(${r.left + r.width / 2 - (s.left + (s.width * e.x) / 100)}px,${r.top + r.height * 0.55 - (s.top + (s.height * e.y) / 100)}px) scale(.25)`;
          fx.style.opacity = "0";
        });
      window.setTimeout(() => fx.remove(), 450);
      run.change(foodValue[e.type]);
      progress.bugs[e.type]++;
      save();
      toast(`${bugNames[e.type]} · +${foodValue[e.type]} Sleep`);
      tone(520);
    }
  }
  updateHUD();
}
// Advance to each impact timestamp before banking a checkpoint or completing the run.
function simulate(dt: number) {
  let remaining = dt;
  while (remaining > 1e-8 && state === "playing") {
    for (const req of director.update(run.seconds, entities))
      spawn(req.type, req.lifetime, req.lane);
    const due = Math.min(run.duration, ...entities.map((e) => e.due));
    const step = Math.max(
      0,
      Math.min(remaining, 1 / 60, due - run.seconds, run.remaining),
    );
    const end = run.seconds + step;
    const impacts = entities.filter((e) => e.due <= end + 1e-8);
    const damage = impacts.reduce(
      (sum, e) =>
        sum +
        (e.type in damageFor ? damageFor[e.type as keyof typeof damageFor] : 0),
      0,
    );
    for (const e of impacts) remove(e);
    run.step(step, damage);
    remaining -= step;
    idle += step;
    if (damage) {
      hitTimes = hitTimes.filter((t) => run.seconds - t <= 1);
      hitTimes.push(run.seconds);
      if (hitTimes.length >= 2)
        director.nextThreat = Math.max(director.nextThreat, run.seconds + 0.8);
      toast(`Hutan berisik · −${damage} Sleep`);
    }
    for (const e of entities) {
      if (drag?.entity !== e) {
        const t = Math.min(1, (run.seconds - e.born) / e.max);
        if (e.type === "leaf") {
          e.x = e.startX + (47 - e.startX) * t;
          e.y = e.startY + (62 - e.startY) * t;
        } else if (e.type === "cricket") {
          e.x = e.startX + (55 - e.startX) * t;
          e.y = e.startY + 12 * t;
        } else if (e.type !== "frog")
          e.x = e.startX + Math.sin((run.seconds - e.born) * 1.5 + e.id) * 3;
      }
      position(e);
    }
    if (run.outcome !== "playing") {
      updateHUD();
      finish();
      break;
    }
    if (step === 0 && !impacts.length) break;
  }
  updateHUD();
}
function layoutScene() {
  const w = $("#shell").clientWidth,
    h = $("#shell").clientHeight,
    scale = Math.max(w / 976, h / 1098),
    bw = 976 * scale,
    bh = 1098 * scale;
  const focal = 0.5,
    left = (w - bw) * focal,
    top = (h - bh) * 0.5;
  const x = left + bw * 0.5,
    y = h * 0.56;
  const a = $("#character-anchor");
  const ch = Math.min(h * 0.42, 400),
    cw = Math.min(w * 0.8, ch * 2.1);
  a.style.cssText = `left:${x}px;top:${y}px;width:${cw}px;height:${ch}px`;
  $("#stage").style.transformOrigin = `${x}px ${y}px`;
  scene?.resize();
}
$("#play").onclick = () => settings(true);
$("#profile").onclick = chooseLevel;
$("#level-choice").onclick = chooseLevel;
$("#settings").onclick = () => {
  if (state !== "waking" && state !== "result") settings();
};
$("#map-select").onclick = chooseMap;
$("#my-bed").onclick = chooseBed;
$("#book").onclick = book;
$("#skins").onclick = skinsCollection;
$("#how").onclick = help;
$("#pause").onclick = pause;
$("#branch").onclick = () => {
  syncInputTime();
  const e = entities.find((e) => e.type === "frog");
  if (e) resolve(e, true);
};
$(".wordmark").onclick = (ev) => {
  ev.preventDefault();
  if (state === "playing" || state === "ready") pause();
  else if (state === "home") home();
};
modal.addEventListener("cancel", (e) => {
  if (state === "result") {
    e.preventDefault();
    home();
  }
});
document.addEventListener("pointerdown", () => (idle = 0));
document.addEventListener("keydown", (ev) => {
  idle = 0;
  if (
    ev.code === "Escape" &&
    !modal.open &&
    (state === "playing" || state === "ready")
  ) {
    ev.preventDefault();
    pause();
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});
window.addEventListener("blur", pause);
window.addEventListener("resize", layoutScene);
function tick(now: number) {
  let dt = Math.max(0, (now - last) / 1000);
  last = now;
  requestAnimationFrame(tick);
  if (document.hidden) return;
  if (dt > 2 && (state === "playing" || state === "ready")) {
    pause();
    dt = 0;
  }
  if (state === "ready") {
    readyTime -= dt;
    $("#ready-cue").textContent = Math.max(1, Math.ceil(readyTime)).toString();
    if (readyTime <= 0) {
      $("#ready-cue").hidden = true;
      state = "playing";
      tone(500);
    }
  } else if (state === "playing") {
    simulate(dt);
    if (state === "playing") scene?.setSleep(run.sleep);
  } else if (state === "waking") {
    wakeTime += dt;
    if (wakeTime > 2.3) results();
  }
  if (state === "playing" || state === "waking")
    $("#stage").style.transform =
      `scale(${camera.update(run.sleep, idle, !!drag, Math.min(dt, 0.1), progress.reduced)})`;
  frame += dt;
  const interval = progress.quality === "low" ? 1 / 30 : 1 / 60;
  if (frame >= interval) {
    scene?.render(
      Math.min(frame, 0.15),
      state !== "paused" && state !== "result",
    );
    frame = 0;
  }
}
refreshProfile();
refreshWorld();
applyQuality();
layoutScene();
save();
async function load() {
  try {
    scene = new GimmyScene($<HTMLCanvasElement>("#gimmy"), progress.quality);
    scene.reduced = progress.reduced;
    await scene.load(progress.selectedBed ?? "daun");
    layoutScene();
    ready = true;
    $<HTMLButtonElement>("#play").disabled = false;
    $("#load-note").textContent = "Pilih kualitas visual sebelum bermain";
  } catch (e) {
    console.error(e);
    $("#load-note").textContent =
      "Model gagal dimuat. Ketuk Play untuk mencoba lagi.";
    $<HTMLButtonElement>("#play").disabled = false;
    $("#play").onclick = () => location.reload();
  }
}
void load();
requestAnimationFrame(tick);
if (import.meta.env.DEV)
  Object.assign(window, {
    __gimmy: {
      get snapshot() {
        return {
          state,
          ready,
          bed: progress.selectedBed,
          map: progress.selectedMap,
          sleepState: scene?.sleepState.state,
          sprite: scene?.decodedName,
          renderResources: { ...scene?.renderer.info.memory },
          sleep: run.sleep,
          seconds: run.seconds,
          remaining: run.remaining,
          outcome: run.outcome,
          points: run.points,
          xp: progress.xp,
          level: levelFor(progress.xp),
          runLevel: run.level,
          zoom: camera.zoom,
          drag: !!drag,
          entities: entities.map((e) => ({
            id: e.id,
            type: e.type,
            due: e.due,
          })),
        };
      },
      start,
      home,
      spawn,
      feed() {
        run.change(100);
      },
      setSleep(n: number) {
        run.sleep = n;
      },
      setIdle(n: number) {
        idle = n;
      },
      step(seconds: number, perfect = false) {
        while (seconds > 0 && state === "playing") {
          if (perfect) {
            run.change(100);
            for (const e of [...entities]) resolve(e, true);
          }
          simulate(Math.min(0.1, seconds));
          seconds -= 0.1;
        }
      },
      skipReady() {
        if (state === "ready") {
          state = "playing";
          $("#ready-cue").hidden = true;
        }
      },
      setPoints(n: number) {
        progress.xp = n;
        selected = levelFor(n);
        save();
        refreshProfile();
      },
      wake() {
        run.change(-100);
        finish();
      },
    },
  });
