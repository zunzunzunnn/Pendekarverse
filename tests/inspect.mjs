import { chromium } from "@playwright/test";
import fs from "node:fs";
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--enable-webgl", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
await page.goto("http://127.0.0.1:5187");
await page.waitForTimeout(1800);
await page.screenshot({ path: "tests/menu.png" });
await page.getByRole("button", { name: "Masuk" }).click();
await page.waitForSelector("#start", { timeout: 60000 });
await page.waitForTimeout(1000);
await page.screenshot({ path: "tests/selection.png" });
await page.locator("#start").click();
await page.locator("#skip").click();
await page.waitForTimeout(3000);
await page.screenshot({ path: "tests/game.png" });
console.log(
  JSON.stringify({
    errors,
    state: await page.evaluate(() => ({
      state: window.__game.state,
      enemies: window.__game.enemies.length,
      meshes: window.__game.renderer.info.render.calls,
      triangles: window.__game.renderer.info.render.triangles,
      player: window.__game.player.root.position.toArray(),
      fps: window.__game.fps,
    })),
  }),
);
await browser.close();
