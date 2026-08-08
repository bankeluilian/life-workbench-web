import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test("任务完成状态可切换并持久化", async ({ page }) => {
  const complete = page.getByRole("button", { name: "完成词汇学习 80 个" }).first();
  await complete.click();
  await expect(page.getByRole("button", { name: "取消完成词汇学习 80 个" }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "取消完成词汇学习 80 个" }).first()).toBeVisible();
  await page.getByRole("button", { name: "取消完成词汇学习 80 个" }).first().click();
  await expect(page.getByRole("button", { name: "完成词汇学习 80 个" }).first()).toBeVisible();
});

test("专注计时可暂停并在刷新后恢复", async ({ page }) => {
  await page.getByRole("button", { name: /继续专注/ }).click();
  await expect(page.getByRole("dialog", { name: "专注计时器" })).toBeVisible();
  await page.getByRole("button", { name: "暂停" }).click();
  await expect(page.getByRole("button", { name: "继续", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("dialog", { name: "专注计时器" })).toBeVisible();
  await expect(page.getByRole("button", { name: "继续", exact: true })).toBeVisible();
});
