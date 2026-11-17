import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.startsWith("webgl")
        ? null
        : getContext.call(this, type, ...args);
    };
  });
  let fail = true;
  await page.route("**/gimmy/maps/forest.webp", (route) =>
    fail ? route.abort() : route.continue(),
  );
  await page.goto(process.env.GIMMY_URL ?? "http://127.0.0.1:5187/");
  const loading = page.getByRole("progressbar", { name: "Aset Gimmy" });
  const retry = page.getByRole("button", { name: "Coba lagi" });
  await retry.waitFor({ timeout: 12000 });
  assert.equal(await loading.isVisible(), true);
  assert.equal(await page.locator("#play").isEnabled(), false);
  fail = false;
  await retry.click();
  await loading.waitFor({ state: "hidden", timeout: 30000 });
  assert.equal(await page.locator("#play").isEnabled(), true);
  assert.equal(await page.locator("#startup-bar").getAttribute("value"), "100");
  assert.equal(
    await page.locator(".new-gimmy-animation").getAttribute("width"),
    "192",
  );
  await page.locator("#play").click();
  await page.locator("#confirm").click();
  await page.locator("#pause").waitFor();
  console.log("Loading failure, retry, and Play without WebGL passed");
} finally {
  await browser.close();
}
