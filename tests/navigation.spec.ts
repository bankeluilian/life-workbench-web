import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test("底部导航可以切换全部一级页面", async ({ page }) => {
  await page.getByRole("button", { name: "支线" }).click();
  await expect(page).toHaveURL(/\/branches$/);
  await expect(page.getByRole("heading", { name: /我的支线/ }).first()).toBeVisible();
  await page.getByRole("button", { name: "洞察" }).click();
  await expect(page).toHaveURL(/\/insights$/);
  await page.getByRole("button", { name: "我的" }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await page.getByRole("button", { name: "首页", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("二级路由刷新后仍可访问", async ({ page }) => {
  await page.goto("/projects/cet4");
  await expect(page.getByRole("heading", { name: /英语四级备考/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: /英语四级备考/ })).toBeVisible();
  await page.goto("/learning/review");
  await expect(page.getByRole("heading", { name: "学习复习列表" })).toBeVisible();
});
