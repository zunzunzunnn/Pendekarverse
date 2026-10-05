import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--enable-webgl", "--ignore-gpu-blocklist"],
});
let checks = 0;
const errors = [];
const check = (v, message) => {
  assert.ok(v, message);
  checks++;
};
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  await context.addInitScript(() => {
    if (!localStorage.getItem("gimmy.progress.v3"))
      localStorage.setItem(
        "gimmy.progress.v2",
        JSON.stringify({
          xp: 280,
          best: 75,
          bugs: { moth: 8, cricket: 3, beetle: 2 },
          quality: "medium",
          sound: false,
          reduced: false,
          completed: [1, 2],
        }),
      );
  });
  const p = await context.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://127.0.0.1:5187");
  await p.waitForFunction(() => window.__gimmy?.snapshot.ready);
  const snap = () => p.evaluate(() => window.__gimmy.snapshot);
  check((await snap()).xp === 280, "v2 points migrated");
  for (const id of ["daun", "ranting", "goa", "kasur", "hamok"]) {
    await p.locator("#my-bed").tap();
    await p.locator(`[data-bed="${id}"]`).tap();
    await p.waitForFunction(
      (id) =>
        window.__gimmy.snapshot.bed === id && window.__gimmy.snapshot.ready,
      id,
    );
    check((await snap()).xp === 280, "bed does not spend points");
    await p.getByRole("button", { name: "Tutup", exact: true }).tap();
    await p.screenshot({ path: `tests/v4-bed-${id}.png` });
  }
  for (const id of ["forest", "rainforest", "village", "canopy", "dream"]) {
    await p.locator("#map-select").tap();
    await p.locator(`[data-map="${id}"]`).tap();
    await p.waitForFunction(
      (id) =>
        window.__gimmy.snapshot.map === id && window.__gimmy.snapshot.ready,
      id,
    );
    check((await snap()).xp === 280, "map does not spend points");
    await p.getByRole("button", { name: "Tutup", exact: true }).tap();
  }
  await p.reload();
  await p.waitForFunction(() => window.__gimmy?.snapshot.ready);
  check(
    (await snap()).bed === "hamok" && (await snap()).map === "dream",
    "choices persist",
  );
  await p.evaluate(() => {
    window.__gimmy.start(1);
    window.__gimmy.skipReady();
  });
  for (const [value, state, sprite] of [
    [95, "deep", "sleep1"],
    [65, "cozy", "sleep2"],
    [35, "light", "sleep3"],
    [15, "restless", "sleep4"],
  ]) {
    await p.evaluate((v) => window.__gimmy.setSleep(v), value);
    await p.waitForFunction(
      (s) => window.__gimmy.snapshot.sprite === s,
      sprite,
    );
    check((await snap()).sleepState === state, "meter drives source condition");
  }
  await p.evaluate(() => {
    window.__gimmy.setSleep(45);
    window.__gimmy.spawn("cockroach");
  });
  const food = p.getByRole("button", { name: "Beri makan Kecoak" }).first();
  const box = await food.boundingBox();
  await p.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  check((await snap()).sleep > 53, "cockroach feeds by touch");
  await p.evaluate(() => window.__gimmy.wake());
  await p.waitForFunction(() => window.__gimmy.snapshot.sprite === "sleep5");
  check((await snap()).sleepState === "awake", "wake expression");
  await p.evaluate(() => window.__gimmy.home());
  await p.locator("#settings").tap();
  await p.locator("#quality").selectOption("low");
  await p.locator("#confirm").tap();
  await p.waitForFunction(
    () => document.querySelector(".sleep-sprite").width === 192,
  );
  for (const [w, h] of [
    [360, 640],
    [390, 844],
    [844, 390],
    [1440, 900],
  ]) {
    await p.setViewportSize({ width: w, height: h });
    await p.screenshot({ path: `tests/v4-home-${w}.png` });
    const play = await p.locator("#play").boundingBox(),
      bed = await p.locator("#my-bed").boundingBox();
    check(play.y >= 0 && play.y + play.height <= h, "play fits viewport");
    check(
      !(
        play.y < bed.y + bed.height &&
        play.y + play.height > bed.y &&
        play.x < bed.x + bed.width &&
        play.x + play.width > bed.x
      ),
      "play and bed do not overlap",
    );
    check(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "no horizontal overflow",
    );
  }
  // A failed optional bed load must leave the previous world playable.
  await p.setViewportSize({ width: 390, height: 844 });
  await p.route("**/gimmy/beds/goa.glb", (r) => r.abort());
  await p.locator("#my-bed").tap();
  await p.locator('[data-bed="goa"]').tap();
  await p.waitForFunction(() => window.__gimmy.snapshot.ready);
  check(
    (await snap()).bed === "hamok",
    "failed bed preserves previous selection",
  );
  await p.getByRole("button", { name: "Tutup", exact: true }).tap();
  await p.unroute("**/gimmy/beds/goa.glb");
  await p.locator("#my-bed").tap();
  await p.locator('[data-bed="goa"]').tap();
  await p.waitForFunction(
    () =>
      window.__gimmy.snapshot.bed === "goa" && window.__gimmy.snapshot.ready,
  );
  check((await snap()).bed === "goa", "retry loads bed");
  await p.getByRole("button", { name: "Tutup", exact: true }).tap();
  for (let i = 0; i < 10; i++) {
    const id = i % 2 ? "goa" : "kasur";
    await p.locator("#my-bed").tap();
    await p.locator(`[data-bed="${id}"]`).tap();
    await p.waitForFunction(
      (id) =>
        window.__gimmy.snapshot.bed === id && window.__gimmy.snapshot.ready,
      id,
    );
    await p.getByRole("button", { name: "Tutup", exact: true }).tap();
    await p.waitForTimeout(30);
    const resources = (await snap()).renderResources;
    check(
      resources.geometries <= 1 && resources.textures <= 4,
      "repeated bed swaps release GPU resources",
    );
  }
  const fresh = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const f = await fresh.newPage();
  const requests = [];
  f.on("request", (r) => requests.push(r.url()));
  await f.goto("http://127.0.0.1:5187");
  await f.waitForFunction(() => window.__gimmy?.snapshot.ready);
  check(
    requests.some((u) => u.endsWith("/sleep1-low.webp")),
    "mobile requests lightweight animated atlas",
  );
  check(
    !requests.some((u) => /\/sleep[1-5]\.webp$/.test(u)),
    "mobile avoids full resolution sleep atlases",
  );
  await f.locator("#my-bed").tap();
  check(
    (await f.locator("[data-bed]:disabled").count()) === 4,
    "four locked beds for new player",
  );
  await f.getByRole("button", { name: "Tutup", exact: true }).tap();
  await f.locator("#map-select").tap();
  check(
    (await f.locator("[data-map]:disabled").count()) === 4,
    "four locked maps for new player",
  );
  await fresh.close();
  check(errors.length === 0, `runtime errors: ${errors}`);
  console.log(JSON.stringify({ checks, errors }));
} finally {
  await browser.close();
}
