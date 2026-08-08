import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test("保存睡眠记录后洞察同步更新", async ({ page }) => {
  await page.getByRole("button", { name: "打开快速记录" }).click();
  await expect(page.getByRole("dialog", { name: /快速记录/ })).toBeVisible();
  await page.getByLabel("睡觉时间").fill("22:30");
  await page.getByLabel("起床时间").fill("06:30");
  await page.getByRole("button", { name: /保存记录/ }).click();
  await expect(page.getByText("睡眠记录已保存")).toBeVisible();
  await page.getByRole("button", { name: "洞察", exact: true }).click();
  await expect(page.getByText("8.0", { exact: false }).first()).toBeVisible();
});

test("运动记录可以保存并在刷新后保留", async ({ page }) => {
  await page.getByRole("button", { name: "打开快速记录" }).click();
  await page.getByRole("tab", { name: "运动" }).click();
  await page.getByLabel("运动时长（分钟）").fill("30");
  await page.getByRole("button", { name: /保存记录/ }).click();
  await expect(page.getByText("30/40 分钟")).toBeVisible();
  await page.reload();
  await expect(page.getByText("30/40 分钟")).toBeVisible();
});
