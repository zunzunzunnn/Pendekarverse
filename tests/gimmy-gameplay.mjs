import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--enable-webgl", "--ignore-gpu-blocklist"],
});
const errors = [];
let checks = 0;
const check = (v, s) => {
  assert.ok(v, s);
  checks++;
};
try {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  await ctx.addInitScript(() => {
    if (!localStorage.getItem("gimmy.progress.v2"))
      localStorage.setItem(
        "gimmy.progress.v1",
        JSON.stringify({
          xp: 35,
          best: 122,
          bugs: { moth: 7, cricket: 2, beetle: 1 },
          quality: "low",
          sound: false,
          reduced: false,
        }),
      );
  });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://127.0.0.1:5187");
  await p.waitForFunction(() => window.__gimmy?.snapshot.ready);
  const snap = () => p.evaluate(() => window.__gimmy.snapshot);
  check((await snap()).xp === 35, "old points migrated");
  check(
    (await p.locator("#play img").getAttribute("src")).endsWith(
      "/gimmy/ui/play.webp",
    ),
    "Play uses supplied asset",
  );
  await p.locator("#profile").tap();
  check(await p.locator('[data-level="2"]').isDisabled(), "locked level");
  await p.getByRole("button", { name: "Tutup", exact: true }).tap();
  await p.locator("#play").tap();
  await p.locator("#confirm").tap();
  check((await snap()).state === "ready", "start has ready countdown");
  await p.waitForFunction(() => window.__gimmy.snapshot.state === "playing");
  check((await snap()).remaining > 119, "full gameplay duration after cue");
  await p.evaluate(() => window.__gimmy.spawn("moth"));
  const box = await p
    .getByRole("button", { name: "Beri makan Ngengat" })
    .first()
    .boundingBox();
  const before = (await snap()).sleep;
  await p.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  check((await snap()).sleep > before + 8, "touch feeds");
  await p.evaluate(() => window.__gimmy.spawn("leaf"));
  const leaf = await p
    .getByRole("button", { name: "Usir daun" })
    .first()
    .boundingBox();
  await p.touchscreen.tap(leaf.x + leaf.width / 2, leaf.y + leaf.height / 2);
  const arrow = await p
    .getByRole("button", { name: "Buang daun ke kiri" })
    .boundingBox();
  check(!!arrow, "leaf tap has accessible alternative");
  await p.touchscreen.tap(
    arrow.x + arrow.width / 2,
    arrow.y + arrow.height / 2,
  );
  check(
    !(await snap()).entities.some((e) => e.type === "leaf"),
    "leaf removed",
  );
  await p.evaluate(() => {
    window.__gimmy.spawn("frog");
  });
  await p.locator("#branch").tap();
  check(
    !(await snap()).entities.some((e) => e.type === "frog"),
    "frog distracted",
  );
  await p.evaluate(() => window.__gimmy.setIdle(12));
  await p.waitForTimeout(600);
  check((await snap()).zoom > 1.02, "idle zoom");
  await p.evaluate(() => window.__gimmy.spawn("beetle"));
  const b = await p
    .getByRole("button", { name: "Beri makan Kumbang" })
    .first()
    .boundingBox();
  await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await p.mouse.down();
  const z = (await snap()).zoom;
  await p.evaluate(() => window.__gimmy.setSleep(20));
  await p.waitForTimeout(300);
  check(Math.abs((await snap()).zoom - z) < 0.002, "drag holds camera");
  await p.mouse.up();
  await p.evaluate(() => window.__gimmy.feed());
  await p.locator("#settings").tap();
  check((await snap()).state === "paused", "settings pauses");
  const time = (await snap()).seconds;
  await p.waitForTimeout(400);
  check((await snap()).seconds === time, "settings freezes timer");
  await p.locator("#quality").selectOption("medium");
  await p.locator("#confirm").tap();
  await p.waitForFunction(() => window.__gimmy.snapshot.state === "ready");
  check((await snap()).seconds === time, "resume cue freezes timer");
  await p.waitForFunction(() => window.__gimmy.snapshot.state === "playing");
  await p.evaluate(() => window.__gimmy.step(30, true));
  check((await snap()).xp === 40, "first reward opens level two");
  check((await snap()).runLevel === 1, "active level unchanged");
  check((await snap()).remaining > 80, "duration unchanged after unlock");
  await p.evaluate(() => window.__gimmy.wake());
  await p.waitForFunction(() => window.__gimmy.snapshot.state === "result");
  check((await snap()).xp === 40, "failure retains banked points");
  check(
    await p.locator("#next-level").isVisible(),
    "next level available after failed run with sufficient points",
  );
  await p.locator("#next-level").tap();
  await p.evaluate(() => window.__gimmy.skipReady());
  check((await snap()).runLevel === 2, "new run uses unlocked level");
  check((await snap()).remaining > 89, "level two 90 seconds");
  await p.evaluate(() => window.__gimmy.home());
  await p.reload();
  await p.waitForFunction(() => window.__gimmy?.snapshot.ready);
  check((await snap()).xp === 40, "v2 persists after reload");
  await p.evaluate(() => window.__gimmy.setPoints(280));
  for (let level = 1; level <= 5; level++) {
    const r = await p.evaluate((level) => {
      window.__gimmy.home();
      window.__gimmy.start(level);
      window.__gimmy.skipReady();
      return window.__gimmy.snapshot;
    }, level);
    check(
      r.remaining === [120, 90, 60, 30, 30][level - 1],
      `level ${level} duration`,
    );
    await p.evaluate(() => window.__gimmy.step(130, true));
    check((await snap()).outcome === "success", `level ${level} can complete`);
    check((await snap()).points === 20, `level ${level} rewards 20`);
  }
  check((await snap()).level === 5, "level capped");
  await p.locator("#back-home").tap();
  await p.locator("#profile").tap();
  check((await p.locator("[data-level]").count()) === 5, "no level six");
  await p.getByRole("button", { name: "Tutup", exact: true }).tap();
  for (const [w, h] of [
    [360, 640],
    [390, 844],
    [844, 390],
    [1440, 900],
  ]) {
    await p.setViewportSize({ width: w, height: h });
    await p.screenshot({ path: `tests/v3-home-${w}.png` });
    const play = await p.locator("#play").boundingBox();
    check(play.y >= 0 && play.y + play.height <= h, `Play inside ${w}`);
    check(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `no overflow ${w}`,
    );
    await p.evaluate(() => {
      window.__gimmy.start(5);
      window.__gimmy.skipReady();
    });
    await p.screenshot({ path: `tests/v3-game-${w}.png` });
    const meter = await p.locator(".sleep-panel").boundingBox(),
      chain = await p.locator(".chain").boundingBox(),
      points = await p.locator("#run-points").boundingBox();
    check(meter.y > h * 0.6, "meter below");
    check(points.y + points.height <= chain.y + 1, "points above chain");
    await p.evaluate(() => window.__gimmy.home());
  }
  for (let i = 0; i < 10; i++) {
    await p.evaluate(() => {
      window.__gimmy.start(1);
      window.__gimmy.skipReady();
      window.__gimmy.home();
    });
    check((await snap()).entities.length === 0, "restart clears objects");
  }
  check(errors.length === 0, "no runtime errors");
  console.log(JSON.stringify({ checks, errors }));
  await ctx.close();
} finally {
  await browser.close();
}
