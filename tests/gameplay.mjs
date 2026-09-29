import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--enable-webgl", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:5187");
await page.locator("#enter").click();
await page.locator("#start").waitFor({ timeout: 60000 });
await page.locator('[data-character="1"]').click();
assert.equal(
  await page.locator('[data-character="1"]').getAttribute("aria-pressed"),
  "true",
);
await page.locator("#quality").selectOption("medium");
await page.locator("#start").click();
await page.locator("#skip").click();
const logic = await page.evaluate(() => {
  const g = window.__game,
    results = [];
  const check = (name, value) => {
    if (!value) throw Error(name);
    results.push(name);
  };
  const ticks = (n) => {
    for (let i = 0; i < n; i++) g.fixed(1 / 60);
  };
  g.start();
  g.skip();
  g.spawn();
  const e = g.enemies[0];
  e.state = "idle";
  e.cooldown = 100;
  e.body.root.position.copy(g.player.root.position);
  e.body.root.position.z -= 1.1;
  g.player.root.rotation.y = Math.PI;
  g.initialSpawn = true;
  g.beginAttack();
  ticks(20);
  check("Single attack damages only once", e.hp === 50);
  ticks(20);
  check("Recovery causes no additional damage", e.hp === 50);
  for (let n = 0; n < 2; n++) {
    g.beginAttack();
    ticks(40);
  }
  check(
    "Three punches kill once",
    e.hp === 0 && g.kills === 1 && g.score === 100,
  );
  ticks(130);
  check("Corpse removal awards no extra score", g.score === 100);
  g.start();
  g.skip();
  g.input.keys.add("KeyW");
  const z = g.player.root.position.z;
  ticks(60);
  check(
    "Movement covers 3.5m per second",
    Math.abs(g.player.root.position.z - (z - 3.5)) < 0.02,
  );
  g.input.clear();
  g.start();
  g.skip();
  g.initialSpawn = true;
  g.input.keys.add("KeyW");
  g.input.keys.add("KeyD");
  const initial = g.player.root.position.clone();
  ticks(60);
  check(
    "Diagonal movement normalized",
    Math.abs(g.player.root.position.distanceTo(initial) - 3.5) < 0.02,
  );
  g.input.clear();
  g.input.jump = true;
  ticks(5);
  const vy = g.velocityY;
  g.input.jump = true;
  ticks(1);
  check("Double jump rejected", g.velocityY < vy);
  ticks(70);
  check("Landing returns to ground", g.player.root.position.y === 0);
  g.pause();
  const elapsed = g.elapsed,
    hp = g.hp,
    count = g.enemies.length;
  ticks(120);
  check(
    "Pause freezes timers health and spawning",
    g.elapsed === elapsed && g.hp === hp && g.enemies.length === count,
  );
  check("Pause clears held input", g.input.keys.size === 0 && !g.input.sprint);
  g.start();
  g.skip();
  g.initialSpawn = true;
  g.spawn();
  const enemy = g.enemies[0];
  enemy.state = "attack";
  enemy.timer = 0.44;
  enemy.body.root.position.copy(g.player.root.position);
  enemy.body.root.position.z -= 1;
  g.hp = 10;
  ticks(2);
  check("Lethal damage ends session", g.state === "dead" && g.hp === 0);
  const score = g.score;
  ticks(120);
  check("No scoring after death", g.score === score);
  for (let cycle = 0; cycle < 10; cycle++) {
    g.start();
    g.skip();
    ticks(160);
    check(
      "Fresh session " + cycle,
      g.hp === 100 &&
        g.score === 0 &&
        g.enemies.length === 2 &&
        g.input.keys.size === 0,
    );
    g.menu();
    check("Cleanup " + cycle, g.enemies.length === 0 && !g.player);
    g.choose(cycle % 2);
  }
  g.start();
  g.skip();
  return results;
});
await page.keyboard.down("KeyW");
await page.waitForTimeout(300);
await page.keyboard.up("KeyW");
const before = await page.evaluate(() => window.__game.player.root.position.z);
await page.keyboard.press("KeyP");
await page.waitForTimeout(400);
assert.equal(await page.evaluate(() => window.__game.state), "paused");
assert.equal(
  await page.evaluate(() => window.__game.player.root.position.z),
  before,
);
await page.locator("#resume").click();
await page.mouse.move(900, 380);
await page.mouse.down();
await page.mouse.move(1050, 430, { steps: 8 });
await page.mouse.up();
assert.equal(await page.evaluate(() => window.__game.attackTime), -1);
await page.evaluate(() => {
  window.__game.pause();
});
await page.screenshot({ path: "tests/pause.png" });
await page.locator("#settings").click();
await page.locator("#reducedMotion").check();
await page.locator("#save-settings").click();
await page.locator("#resume").click();
await page.waitForTimeout(1000);
await page.screenshot({ path: "tests/game.png" });
const stats = await page.evaluate(() => ({
  fps: window.__game.fps,
  drawCalls: window.__game.renderer.info.render.calls,
  triangles: window.__game.renderer.info.render.triangles,
}));
const mobile = await browser.newContext({
  viewport: { width: 844, height: 390 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
});
const mp = await mobile.newPage();
mp.on("pageerror", (e) => errors.push(e.message));
await mp.goto("http://127.0.0.1:5187");
await mp.locator("#enter").tap();
await mp.locator("#start").waitFor({ timeout: 60000 });
await mp.locator("#start").tap();
await mp.locator("#skip").tap();
assert.equal(await mp.evaluate(() => window.__game.quality), "low");
const touch = await mp.context().newCDPSession(mp);
const stick = await mp.locator("#stick").boundingBox(),
  attack = await mp.locator('[data-action="attack"]').boundingBox();
await touch.send("Input.dispatchTouchEvent", {
  type: "touchStart",
  touchPoints: [
    { x: stick.x + stick.width / 2, y: stick.y + stick.height / 2, id: 1 },
  ],
});
await touch.send("Input.dispatchTouchEvent", {
  type: "touchMove",
  touchPoints: [{ x: stick.x + stick.width / 2, y: stick.y + 10, id: 1 }],
});
await mp.waitForTimeout(300);
await touch.send("Input.dispatchTouchEvent", {
  type: "touchStart",
  touchPoints: [
    { x: stick.x + stick.width / 2, y: stick.y + 10, id: 1 },
    { x: attack.x + 40, y: attack.y + 40, id: 2 },
  ],
});
await mp.waitForTimeout(70);
assert.ok(await mp.evaluate(() => window.__game.attackTime >= 0));
assert.ok(await mp.evaluate(() => window.__game.input.y < -0.5));
await touch.send("Input.dispatchTouchEvent", {
  type: "touchEnd",
  touchPoints: [],
});
assert.equal(await mp.evaluate(() => window.__game.input.y), 0);
await mp.screenshot({ path: "tests/mobile.png" });
await mp.setViewportSize({ width: 390, height: 844 });
await mp.waitForTimeout(300);
assert.equal(await mp.evaluate(() => window.__game.state), "paused");
await mp.setViewportSize({ width: 844, height: 390 });
await mp.locator("#resume").tap();
assert.equal(await mp.evaluate(() => window.__game.state), "playing");
assert.deepEqual(errors, []);
console.log(
  JSON.stringify(
    {
      passed: logic.length + 10,
      logic,
      desktop: stats,
      mobile:
        "Analog + attack simultaneous; release; portrait pause; landscape resume passed",
      errors,
    },
    null,
    2,
  ),
);
await browser.close();
