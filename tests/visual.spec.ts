import { test } from "@playwright/test";

const routes = [
  ["home", "/"],
  ["branches", "/branches"],
  ["project", "/projects/cet4"],
  ["learning", "/learning"],
  ["insights", "/insights"],
  ["profile", "/profile"],
  ["settings", "/settings"],
] as const;

for (const width of [390, 430]) {
  for (const [name, route] of routes) {
    test(`${name} ${width}px 视觉截图`, async ({ page }) => {
      await page.setViewportSize({ width, height: 932 });
      await page.addInitScript(() => window.localStorage.clear());
      await page.goto(route);
      await page.locator(".loading-state").waitFor({ state: "hidden" });
      await page.screenshot({ path: `tests/screenshots/${name}-${width}.png`, fullPage: true });
    });
  }
}

test("快速记录弹层截图", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 932 });
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  await page.getByRole("button", { name: "打开快速记录" }).click();
  await page.getByRole("dialog", { name: /快速记录/ }).waitFor();
  await page.screenshot({ path: "tests/screenshots/quick-record-390.png", fullPage: true });
});
