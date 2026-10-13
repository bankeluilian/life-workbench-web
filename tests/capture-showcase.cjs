const { chromium } = require(process.env.WORKBENCH_PLAYWRIGHT || 'playwright');
const { pathToFileURL } = require('node:url');
const { resolve } = require('node:path');
const { mkdirSync } = require('node:fs');
(async () => {
  mkdirSync('docs/redesign/previews', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 430, height: 911 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(pathToFileURL(resolve('html-export/人生支线工作台.html')).href);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    for (const route of ['home', 'branches', 'learning', 'project', 'insights']) {
      await page.setViewportSize({ width: 430, height: 911 });
      await page.evaluate(route => window.workbench.navigate(route), route);
      await page.waitForFunction(() => [...document.querySelectorAll('.page.active img')].every(img => img.complete && img.naturalWidth));
      const height = await page.evaluate(() => Math.max(911, document.querySelector('.app').scrollHeight));
      await page.setViewportSize({ width: 430, height });
      await page.screenshot({ path: `docs/redesign/previews/${route}.png` });
    }
    await page.setViewportSize({ width: 430, height: 911 });
    await page.evaluate(() => { window.workbench.navigate('home'); window.workbench.openRecord('sleep'); });
    await page.screenshot({ path: 'docs/redesign/previews/record.png' });
    if (errors.length) throw new Error(errors.join('\n'));
    console.log('六张完整预览已生成，浏览器脚本错误 0。');
    await context.close();
  } finally { await browser.close(); }
})();
