import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--enable-webgl", "--ignore-gpu-blocklist"],
});
const errors = [];
let checks = 0;
const check = (condition, message) => {
  assert.ok(condition, message);
  checks++;
};
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:5187");
  await page.waitForFunction(() => window.__gimmy?.snapshot.ready);
  const snapshot = () => page.evaluate(() => window.__gimmy.snapshot);
  check(
    (await page.title()) === "Gimmy : The Little Tarsius",
    "official title",
  );
  await page.locator("#map-select").click();
  check(
    await page.locator("[data-map=rainforest]").isDisabled(),
    "map initially locked",
  );
  await page.getByRole("button", { name: "Tutup", exact: true }).click();
  await page.locator("#play").tap();
  await page.locator("#quality").selectOption("low");
  await page.locator("#confirm").tap();
  check((await snapshot()).state === "playing", "start with chosen quality");
  await page.evaluate(() => window.__gimmy.spawn("moth"));
  const before = (await snapshot()).sleep;
  const mothBox = await page
    .getByRole("button", { name: "Beri makan Ngengat" })
    .first()
    .boundingBox();
  await page.touchscreen.tap(
    mothBox.x + mothBox.width / 2,
    mothBox.y + mothBox.height / 2,
  );
  check((await snapshot()).sleep > before + 8, "touch feeding");
  await page.evaluate(() => window.__gimmy.spawn("leaf"));
  const leaf = page.getByRole("button", { name: "Usir daun" }).first();
  await leaf.focus();
  await page.keyboard.press("Enter");
  check(
    (await page.getByRole("button", { name: "Usir daun" }).count()) === 0,
    "keyboard leaf accessible",
  );
  await page.evaluate(() => {
    window.__gimmy.setSleep(60);
    window.__gimmy.spawn("frog");
  });
  await page.locator("#branch").tap();
  check(
    !(await snapshot()).entities.some((e) => e.type === "frog"),
    "frog distraction",
  );
  await page.evaluate(() => {
    window.__gimmy.spawn("leaf");
    window.__gimmy.setSleep(80);
    window.__gimmy.setIdle(12);
  });
  await page.waitForTimeout(900);
  check((await snapshot()).zoom > 1.02, "idle camera zoom");
  const bounds = await page
    .getByRole("button", { name: "Usir daun" })
    .boundingBox();
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  await page.mouse.down();
  const locked = (await snapshot()).zoom;
  await page.evaluate(() => window.__gimmy.setSleep(5));
  await page.waitForTimeout(400);
  check(
    Math.abs((await snapshot()).zoom - locked) < 0.003,
    "camera fixed during drag",
  );
  await page.mouse.move(380, 350, { steps: 10 });
  await page.mouse.up();
  check(!(await snapshot()).drag, "drag released");
  await page.evaluate(() => window.__gimmy.feed());
  await page.locator("#pause").tap();
  const paused = (await snapshot()).seconds;
  await page.waitForTimeout(500);
  check((await snapshot()).seconds === paused, "pause freezes time");
  await page.locator("#resume").tap();
  await page.waitForFunction(() => window.__gimmy.snapshot.state === "playing");
  await page.evaluate(() => {
    window.__gimmy.feed();
    window.__gimmy.step(31);
    window.__gimmy.feed();
    window.__gimmy.step(30);
    window.__gimmy.feed();
    window.__gimmy.step(30);
    window.__gimmy.feed();
    window.__gimmy.step(30);
  });
  check((await snapshot()).xp === 110, "four milestones bank 110 XP");
  check((await snapshot()).level === 2, "level unlock");
  await page.evaluate(() => window.__gimmy.wake());
  await page.waitForTimeout(3100);
  check((await snapshot()).state === "result", "wake result reached");
  check((await snapshot()).xp === 110, "wake does not add or remove points");
  await page.locator("#back-home").tap();
  await page.reload();
  await page.waitForFunction(() => window.__gimmy?.snapshot.ready);
  check((await snapshot()).xp === 110, "bank survives reload");
  await page.locator("#map-select").tap();
  await page.locator("[data-map=rainforest]").tap();
  await page.locator("#play").tap();
  await page.locator("#confirm").tap();
  check((await snapshot()).map === "rainforest", "second map playable");
  await page.screenshot({ path: "tests/gimmy-rainforest.png" });
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => {
      window.__gimmy.home();
      window.__gimmy.start();
    });
    check((await snapshot()).entities.length === 0, "restart clean " + i);
  }
  await page.evaluate(() => window.__gimmy.home());
  await page.setViewportSize({ width: 844, height: 390 });
  await page.screenshot({ path: "tests/gimmy-landscape.png" });
  check(await page.locator("#play").isVisible(), "landscape play visible");
  check(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "no horizontal overflow",
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: "tests/gimmy-desktop.png" });
  check(errors.length === 0, "no runtime errors: " + errors.join("; "));
  console.log(JSON.stringify({ checks, errors }, null, 2));
  await context.close();
} finally {
  await browser.close();
}
