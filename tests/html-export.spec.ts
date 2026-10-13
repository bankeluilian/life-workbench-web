import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const htmlUrl = pathToFileURL(resolve('html-export/index.html')).href;
test.beforeEach(async ({ page }) => {
  await page.goto(htmlUrl);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('独立 HTML 保留背景、每日一句、六页导航和真实零起步数据', async ({ page }) => {
  await expect(page.locator('#dailyQuote')).not.toBeEmpty();
  await expect(page.locator('[data-ai-advice]')).toHaveCount(1);
  const background = await page.locator('.app').evaluate(el => getComputedStyle(el, '::before').backgroundImage);
  expect(background).toContain('life-workbench-bg-v1.webp');
  await expect(page.getByText('9:41', { exact: true })).toHaveCount(0);
  await expect(page.locator('[data-value="exercise"]')).toHaveText('0/40 分钟');
  await page.getByRole('button', { name: '菜单', exact: true }).click();
  await page.locator('#menuOverlay [data-open-page="learning"]').click();
  await expect(page.locator('[data-page="learning"]')).toBeVisible();
  await page.locator('.page.active [data-open-page="project"]').first().click();
  await expect(page.locator('[data-page="project"]')).toBeVisible();
  await page.getByRole('button', { name: '返回支线', exact: true }).click();
  for (const name of ['insights', 'profile', 'home']) await page.locator(`[data-nav="${name}"]`).click();
  await page.locator('.header .date').click();
  await page.getByLabel('工作台日期', { exact: true }).fill('2026-08-10');
  await page.locator('#saveDateButton').click();
  await page.reload();
  await expect(page.locator('#dateLabel')).toHaveText('08/10 周一');
});

test('HTML 任务可完成撤销，跨页同步并持久保存', async ({ page }) => {
  await page.evaluate(() => window.workbench.navigate('project'));
  await page.locator('.page.active [data-task-toggle="0"]').click();
  await page.reload();
  await expect(page.locator('.page.active [data-task-toggle="0"]')).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '返回支线', exact: true }).click();
  await page.locator('[data-nav="home"]').click();
  await expect(page.locator('[data-ring="tasks"] strong')).toHaveText('33%');
  await page.evaluate(() => window.workbench.navigate('learning'));
  await page.locator('.page.active [data-task-toggle="0"]').click();
  await expect(page.locator('[data-ring="tasks"] strong')).toHaveText('0%');
});

test('HTML 四种记录保存并联动睡眠曲线', async ({ page }) => {
  for (const type of ['exercise', 'sleep', 'finance', 'idea']) {
    await page.locator(`.page.active [data-record="${type}"]`).first().click();
    if (type === 'exercise') await page.getByLabel('运动时长（分钟）').fill('30');
    if (type === 'sleep') {
      await page.getByLabel('睡觉时间', { exact: true }).fill('22:30');
      await page.getByLabel('起床时间', { exact: true }).fill('06:30');
      await page.getByLabel('睡眠质量', { exact: true }).fill('82');
    }
    if (type === 'finance') { await page.getByLabel('金额', { exact: true }).fill('12.5'); await page.getByLabel('类型', { exact: true }).selectOption('income'); }
    if (type === 'idea') await page.getByLabel('记录灵感').fill('今天的一点新想法');
    await page.getByRole('button', { name: /保存记录/ }).click();
  }
  await page.reload();
  await expect(page.locator('[data-value="exercise"]')).toHaveText('30/40 分钟');
  await expect(page.locator('[data-value="sleep"]')).toHaveText('8.0/8 小时');
  await expect(page.locator('#recordSummary')).toContainText('收支 1 条 · 想法 1 条');
});

test('HTML 专注暂停、继续与刷新恢复使用实际时间', async ({ page }) => {
  await page.locator('#focusButton').click();
  await page.waitForTimeout(1100);
  await page.locator('#pauseFocus').click();
  await expect(page.locator('#pauseFocus')).toHaveText('继续');
  await page.reload();
  await expect(page.locator('#focusOverlay')).toBeVisible();
  await expect(page.locator('#pauseFocus')).toHaveText('继续');
  await page.locator('#finishFocus').click();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('life-workbench-html-v1') || '{}'));
  expect(state.focus).toBeGreaterThan(0);
  expect(state.focus).toBeLessThan(1);
  expect(state.focusRecords).toHaveLength(1);
});

test('HTML 主题、布局、提醒、导出与确认清零可用', async ({ page }) => {
  await page.locator('[data-nav="profile"]').click();
  await page.locator('[data-profile-action="theme"]').click();
  await expect(page.locator('.app')).toHaveClass(/theme-lavender/);
  await page.locator('[data-profile-action="layout"]').click();
  await expect(page.locator('.app')).toHaveClass(/compact-home/);
  await page.locator('[data-profile-action="reminders"]').click();
  await expect(page.locator('[data-profile-action="reminders"] span')).toHaveClass(/reminder-state/);
  const download = page.waitForEvent('download');
  await page.locator('#exportButton').click();
  expect((await download).suggestedFilename()).toBe('life-workbench-backup.json');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#resetButton').click();
  await expect(page.locator('.app')).not.toHaveClass(/theme-lavender/);
});
