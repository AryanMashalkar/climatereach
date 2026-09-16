import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
const origin = process.env.QA_URL || "http://localhost:5173";
mkdirSync("work/qa/screens", { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    (process.platform === "win32"
      ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
      : undefined),
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1050 },
  acceptDownloads: true,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const passed = [];
const mark = (name) => {
  passed.push(name);
  console.log("PASS", name);
};
await page.goto(origin, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Save journey", exact: true }).waitFor();
assert.ok(
  (await page.locator(".journey-result").innerText()).includes(
    "Fits your preferences",
  ),
);
mark("Initial route renders with valid preferences");
await page.screenshot({ path: "work/qa/screens/desktop.png", fullPage: true });
const initial = await page.locator(".route-line").getAttribute("points");
await page
  .getByRole("button", { name: "View Cedar community room", exact: true })
  .click();
await page
  .getByRole("button", { name: "Mark unavailable & recalculate" })
  .click();
await page.keyboard.press("Escape");
await page.waitForTimeout(150);
const rerouted = await page.locator(".route-line").getAttribute("points");
assert.notEqual(initial, rerouted);
assert.ok(
  (await page.locator(".journey-result").innerText()).includes(
    "Fits your preferences",
  ),
);
mark("Closing a rest stop recomputes a different feasible route");
await page.screenshot({ path: "work/qa/screens/rerouted.png", fullPage: true });
const rest = page.getByRole("slider", {
  name: "Maximum distance between rests",
});
await rest.focus();
await page.keyboard.press("Home");
await page
  .getByRole("heading", {
    name: "There is no route with rests this close together.",
  })
  .waitFor();
assert.equal(await page.locator(".route-line").count(), 0);
mark("Impossible rest interval shows no-route explanation");
await page.screenshot({ path: "work/qa/screens/no-route.png", fullPage: true });
await page.getByRole("button", { name: "Restore example journey" }).click();
await page.getByRole("button", { name: "Save journey", exact: true }).click();
await page
  .getByRole("button", { name: "Open saved journey", exact: true })
  .click();
const downloadWait = page.waitForEvent("download");
await page
  .getByRole("button", { name: "Download offline trip card", exact: true })
  .click();
const download = await downloadWait;
await download.saveAs("work/qa/offline-trip.html");
assert.ok(
  readFileSync("work/qa/offline-trip.html", "utf8").includes(
    "Fictional demonstration",
  ),
);
mark("Save and standalone HTML download work");
await page.keyboard.press("Escape");
await page
  .getByRole("button", { name: "Cooling places", exact: true })
  .first()
  .click();
await page.getByRole("tab", { name: "Water", exact: true }).click();
assert.equal(await page.locator(".place-card").count(), 5);
mark("Cooling-place filter matches fixture amenities");
await page
  .getByRole("button", { name: "My preparedness", exact: true })
  .click();
await page.getByRole("checkbox").first().click();
await page
  .getByLabel("Source link", { exact: true })
  .fill("https://www.ready.gov/floods");
await page
  .getByLabel("Original warning text")
  .fill("Test copy: follow your local authority’s instructions.");
await page.getByRole("button", { name: "Save warning on this device" }).click();
await page.getByText("Saved copy · not a live alert").waitFor();
mark("Checklist and original-source warning persist locally");
await page.screenshot({
  path: "work/qa/screens/preparedness.png",
  fullPage: true,
});
await page.reload({ waitUntil: "networkidle" });
await page
  .getByRole("button", { name: "My preparedness", exact: true })
  .click();
assert.equal(
  await page.getByRole("checkbox").first().getAttribute("data-state"),
  "checked",
);
assert.ok(await page.getByText("Saved copy · not a live alert").isVisible());
mark("Saved preparation survives reload");
await page.getByRole("button", { name: "Plan a journey", exact: true }).click();
await page.getByRole("button", { name: "Try the story" }).click();
await page.getByRole("button", { name: "Next chapter" }).click();
assert.notEqual(
  await page.locator(".route-line").getAttribute("points"),
  initial,
);
await page.getByRole("button", { name: "Next chapter" }).click();
await page
  .getByRole("heading", {
    name: "There is no route with rests this close together.",
  })
  .waitFor();
await page.getByRole("button", { name: "Next chapter" }).click();
await page.getByRole("button", { name: "Finish story" }).click();
mark("Four-part demo story exercises real route state");
await page.getByRole("combobox", { name: "Departure time" }).click();
await page.getByRole("option", { name: "17:00" }).click();
assert.ok(
  (await page.locator(".map-top-left").innerText()).includes("Evening"),
);
mark("Departure time updates scenario shade");
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "work/qa/screens/mobile.png", fullPage: true });
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > window.innerWidth,
);
assert.equal(overflow, false);
mark("390px mobile layout has no horizontal overflow");
await page.setViewportSize({ width: 1440, height: 1050 });
await page
  .getByRole("button", { name: "My preparedness", exact: true })
  .click();
await page.waitForTimeout(1000);
const cacheState = await page.evaluate(async () => ({
  controller: !!navigator.serviceWorker.controller,
  caches: await caches.keys(),
  webmcp: !!document.modelContext,
}));
if (process.env.CHECK_OFFLINE === "1") {
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page
    .getByRole("button", { name: "Plan a journey", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "My preparedness", exact: true })
    .click();
  assert.ok(await page.getByText("Saved copy · not a live alert").isVisible());
  await page
    .getByRole("button", { name: "Plan a journey", exact: true })
    .click();
  await page.getByRole("button", { name: "Try the story" }).click();
  await page.getByRole("button", { name: "Next chapter" }).click();
  assert.ok(await page.locator(".route-line").isVisible());
  mark("Offline reload preserves preparation and live local routing");
  await context.setOffline(false);
}
assert.deepEqual(errors, []);
mark("No browser runtime errors");
writeFileSync(
  "work/qa/e2e-report.json",
  JSON.stringify({ origin, passed, errors, cacheState }, null, 2),
);
await browser.close();
