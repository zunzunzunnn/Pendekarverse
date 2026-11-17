import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const browser = await chromium.launch({ channel: "chrome" });
try {
  const page = await browser.newPage({
    viewport: { width: 360, height: 640 },
    hasTouch: true,
    isMobile: true,
  });
  await page.goto(process.env.GIMMY_URL ?? "http://127.0.0.1:5187/");
  const ready = () => page.locator("#startup").waitFor({ state: "hidden" });
  await ready();
  await page.locator("#map-select").tap({ timeout: 4000 });
  await page.locator('[data-map="village"]').tap();
  await page.getByRole("button", { name: "Tutup", exact: true }).tap();
  await page.locator("#my-bed").tap();
  await page.locator('[data-bed="hamok"]').tap();
  await page.getByRole("button", { name: "Kembali ke main menu" }).tap();
  const assertSelection = async () => {
    assert.match(
      await page.locator("#map-select").getAttribute("aria-label"),
      /Village/,
    );
    await page
      .locator('#home-bed-layer[src$="/hamok-scene.webp"]')
      .waitFor({ timeout: 4000 });
    assert.ok(
      await page
        .locator("#home-bed-layer")
        .evaluate((img) => img.decode().then(() => img.naturalWidth)),
    );
    assert.ok(
      await page.locator("#home-bed-foreground").isHidden(),
      "No Leaf foreground on Hamok",
    );
  };
  await assertSelection();
  await page.reload();
  await ready();
  await assertSelection();
  await page.screenshot({ path: "tests/qa-hamok-mobile.png" });
  await page.locator("#play").tap();
  await page.locator("#confirm").tap();
  await page.locator("#pause").waitFor();
  await assertSelection();
  console.log("Map tap, Village persistence, Hamok scene and Play passed");
} finally {
  await browser.close();
}
