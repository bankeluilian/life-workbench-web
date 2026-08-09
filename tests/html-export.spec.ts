import { expect, test } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const htmlUrl = pathToFileURL(resolve("html-export/index.html")).href;

test.beforeEach(async ({ page }) => {
  await page.goto(htmlUrl);
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test("generated background, daily quote, and AI advice are available", async ({ page }) => {
  const initialQuote = await page.locator("#dailyQuote").textContent();
  const background = await page.locator(".app").evaluate((element) => {
    const style = getComputedStyle(element, "::before");
    return { image: style.backgroundImage, opacity: style.opacity };
  });

  expect(background.image).toContain("life-workbench-bg-v1.webp");
  expect(background.opacity).toBe("0.18");
  await expect(page.locator("[data-ai-advice]")).toHaveCount(4);
  await expect(page.locator('.page.active [data-ai-advice] p')).not.toBeEmpty();

  await page.locator(".header .date").click();
  await page.locator("#dateInput").fill("2026-08-10");
  await page.locator("#saveDateButton").click();
  await expect(page.locator("#dailyQuote")).toHaveText(initialQuote ?? "");
});

test("独立 HTML 顶部、菜单、日期与导航均可用", async ({ page }) => {
  await expect(page.getByText("9:41", { exact: true })).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("▮▮▮");

  await page.getByRole("button", { name: "菜单", exact: true }).click();
  await expect(page.getByRole("dialog", { name: /页面导航/ })).toBeVisible();
  await page.getByRole("button", { name: /我的支线/ }).click();
  await expect(page.getByRole("heading", { name: /我的支线/ }).first()).toBeVisible();

  for (const label of ["洞察", "我的", "首页"]) {
    await page.getByRole("button", { name: label, exact: true }).click();
  }

  await page.locator(".header .date").click();
  await page.getByLabel("工作台日期").fill("2026-08-10");
  await page.getByRole("button", { name: "保存日期", exact: true }).click();
  await expect(page.locator("#dateLabel")).toHaveText("08/10 周一");
  await page.reload();
  await expect(page.locator("#dateLabel")).toHaveText("08/10 周一");
});

test("独立 HTML 任务、专注与四种快速记录可用", async ({ page }) => {
  await page.getByRole("button", { name: "完成词汇学习", exact: true }).click();
  await expect(page.locator(".task").first()).toHaveClass(/done/);

  await page.getByRole("button", { name: "运动", exact: true }).first().click();
  await page.getByLabel("运动时长（分钟）").fill("30");
  await page.getByRole("button", { name: /保存记录/ }).click();
  await expect(page.getByText("30/40 分钟", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "睡眠", exact: true }).first().click();
  await page.getByLabel("睡觉时间").fill("22:30");
  await page.getByLabel("起床时间").fill("06:30");
  await page.getByRole("button", { name: /保存记录/ }).click();
  await expect(page.getByText("8.0/8 小时", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "收支", exact: true }).first().click();
  await page.getByLabel("金额").fill("12.50");
  await page.getByLabel("类型").selectOption("income");
  await page.getByRole("button", { name: /保存记录/ }).click();
  await expect(page.getByText("记录已保存", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "想法", exact: true }).first().click();
  await page.getByLabel("记录灵感").fill("测试灵感");
  await page.getByRole("button", { name: /保存记录/ }).click();
  await expect(page.getByText("记录已保存", { exact: true })).toBeVisible();

  await page.locator("#focusButton").click();
  await expect(page.locator("#focusButton")).toHaveText("Ⅱ 暂停专注");
  await page.waitForTimeout(1_100);
  await page.locator("#focusButton").click();
  await expect(page.locator("#profileFocus")).toHaveText("1");

  await page.reload();
  await expect(page.locator(".task").first()).toHaveClass(/done/);
  await expect(page.getByText("30/40 分钟", { exact: true })).toBeVisible();
});

test("独立 HTML 支线快捷操作与个人页设置可用", async ({ page }) => {
  await page.getByRole("button", { name: "支线", exact: true }).click();
  await page.getByRole("button", { name: /记录一次运动/ }).click();
  await expect(page.getByLabel("运动时长（分钟）")).toBeVisible();
  await page.getByRole("button", { name: "关闭", exact: true }).click();

  await page.getByRole("button", { name: /记录一笔收支/ }).click();
  await expect(page.getByLabel("金额")).toBeVisible();
  await page.getByRole("button", { name: "关闭", exact: true }).click();

  await page.getByRole("button", { name: /背词汇 20min/ }).click();
  await page.getByRole("button", { name: "首页", exact: true }).click();
  await expect(page.locator("#focusButton")).toHaveText("Ⅱ 暂停专注");
  await page.locator("#focusButton").click();

  await page.getByRole("button", { name: "我的", exact: true }).click();
  await page.getByRole("button", { name: /主题外观/ }).click();
  await expect(page.locator(".app")).toHaveClass(/theme-lavender/);
  await page.getByRole("button", { name: /首页布局/ }).click();
  await expect(page.locator(".app")).toHaveClass(/compact-home/);
  await page.getByRole("button", { name: /提醒与专注/ }).click();
  await expect(page.locator('[data-profile-action="reminders"] span')).toHaveClass(/reminder-state/);
  await page.getByRole("button", { name: /数据与隐私/ }).click();
  await expect(page.getByText("数据仅保存在当前浏览器，可随时导出或清零", { exact: true })).toBeVisible();
});

test("独立 HTML 支持导出和确认清零", async ({ page }) => {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "我的", exact: true }).click();
  await page.getByRole("button", { name: /导出 JSON/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("life-workbench-backup.json");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /全部数据清零/ }).click();
  await page.getByRole("button", { name: "首页", exact: true }).click();
  await expect(page.getByText("0/40 分钟", { exact: true })).toBeVisible();
  await expect(page.getByText("0/3 项", { exact: true })).toBeVisible();
});
