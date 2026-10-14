const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { resolve } = require('node:path');
const { mkdirSync } = require('node:fs');
const { chromium } = require(process.env.WORKBENCH_PLAYWRIGHT || 'playwright');
const htmlUrl = pathToFileURL(resolve(process.env.WORKBENCH_HTML || 'html-export/index.html')).href;
let browser;
before(async () => { browser = await chromium.launch({ channel: 'chrome', headless: true }); });
after(async () => { await browser?.close(); });
async function fresh(width = 390) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, acceptDownloads: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(htmlUrl);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  return { context, page, errors };
}
test('学习详情与项目计划可访问，任务在三个页面同步并持久保存', async () => {
  const { context, page, errors } = await fresh();
  try {
    await page.locator('[data-nav="branches"]').click();
    assert.equal(await page.locator('[data-open-page="learning"]').count() > 0, true, '学习支线应打开学习详情');
    await page.locator('.page.active [data-open-page="learning"]').first().click();
    assert.equal(await page.locator('[data-page="learning"]').isVisible(), true);
    await page.locator('.page.active [data-open-page="project"]').first().click();
    assert.equal(await page.locator('[data-page="project"]').isVisible(), true);
    await page.locator('[data-task-toggle="0"]').filter({ visible: true }).first().click();
    await page.reload();
    const completed = await page.evaluate(() => JSON.parse(localStorage.getItem('life-workbench-html-v1')).completed);
    assert.ok(completed.includes(0));
    await page.getByRole('button', { name: '返回支线', exact: true }).click();
    await page.locator('[data-nav="home"]').click();
    assert.equal(await page.locator('[data-ring="tasks"] strong').textContent(), '33%');
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
test('四类记录、睡眠质量与状态保存，日期切换不会污染今天', async () => {
  const { context, page, errors } = await fresh();
  try {
    await page.locator('[data-record="sleep"]').first().click();
    await page.getByLabel('睡觉时间', { exact: true }).fill('22:30');
    await page.getByLabel('起床时间', { exact: true }).fill('06:30');
    await page.getByLabel('睡眠质量', { exact: true }).fill('82');
    await page.locator('[data-sleep-status="fast"]').click();
    await page.getByRole('button', { name: /保存记录/ }).click();
    assert.equal(await page.locator('[data-value="sleep"]').textContent(), '8.0/8 小时');
    await page.locator('[data-record="exercise"]').first().click();
    await page.getByLabel('运动时长（分钟）').fill('30');
    await page.getByRole('button', { name: /保存记录/ }).click();
    await page.locator('[data-record="finance"]').first().click();
    await page.getByLabel('金额', { exact: true }).fill('12.5');
    await page.getByLabel('类型', { exact: true }).selectOption('income');
    await page.getByRole('button', { name: /保存记录/ }).click();
    await page.locator('[data-record="idea"]').first().click();
    await page.getByLabel('记录灵感').fill('<b>这是原样保存的灵感</b>');
    await page.getByRole('button', { name: /保存记录/ }).click();
    await page.locator('.header .date').click();
    await page.getByLabel('工作台日期').fill('2025-01-10');
    await page.getByRole('button', { name: '保存日期', exact: true }).click();
    assert.equal(await page.locator('[data-value="sleep"]').textContent(), '0.0/8 小时');
    await page.locator('[data-record="sleep"]').first().click();
    await page.getByLabel('起床时间', { exact: true }).fill('05:30');
    await page.getByRole('button', { name: /保存记录/ }).click();
    await page.reload();
    const state = await page.evaluate(() => JSON.parse(localStorage.getItem('life-workbench-html-v1')));
    assert.equal(state.sleepRecords[0].quality, 82);
    assert.equal(state.sleepRecords[0].status, 'fast');
    assert.equal(state.sleepRecords[1].hours, 7);
    assert.equal(state.sleep, 8, '历史记录不能覆盖今天的旧兼容字段');
    assert.equal(state.finance[0].amount, 12.5);
    assert.equal(state.ideas[0].text, '<b>这是原样保存的灵感</b>');
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
test('专注刷新恢复、暂停时间准确、结束后只计入一次', async () => {
  const { context, page, errors } = await fresh();
  try {
    await page.locator('#focusButton').click();
    await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('life-workbench-html-v1'));
      state.focusSession.startedAt -= 125000;
      localStorage.setItem('life-workbench-html-v1', JSON.stringify(state));
    });
    await page.reload();
    assert.equal(await page.locator('#focusOverlay').isVisible(), true);
    await page.locator('#pauseFocus').click();
    assert.match(await page.locator('#focusTime').textContent(), /^02:/);
    await page.locator('#finishFocus').click();
    assert.equal(await page.locator('#profileFocus').textContent(), '2');
    await page.reload();
    assert.equal(await page.locator('#profileFocus').textContent(), '2');
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
test('备份可以导出恢复，旧版数据仍可读取，重置需要确认', async () => {
  const { context, page, errors } = await fresh();
  try {
    await page.evaluate(() => localStorage.setItem('life-workbench-html-v1', JSON.stringify({ exercise: 20, sleep: 7, focus: 10, completed: [1], ideas: [], finance: [] })));
    await page.reload();
    assert.equal(await page.locator('[data-value="exercise"]').textContent(), '20/40 分钟');
    await page.locator('[data-nav="profile"]').click();
    const downloaded = page.waitForEvent('download');
    await page.locator('#exportButton').click();
    assert.equal((await downloaded).suggestedFilename(), 'life-workbench-backup.json');
    await page.locator('#importFile').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 1, focus: 25, completed: [0, 2], exerciseRecords: [], sleepRecords: [], finance: [], ideas: [] })) });
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: '确认恢复', exact: true }).click();
    assert.equal(await page.locator('#profileFocus').textContent(), '25');
    page.once('dialog', dialog => dialog.dismiss());
    await page.locator('#resetButton').click();
    assert.equal(await page.locator('#profileFocus').textContent(), '25');
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#resetButton').click();
    assert.equal(await page.locator('#profileFocus').textContent(), '0');
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
test('375、390、430px 六张页面均无横向溢出、缺图和脚本错误', async () => {
  mkdirSync('docs/redesign/screenshots', { recursive: true });
  for (const width of [375, 390, 430]) {
    const { context, page, errors } = await fresh(width);
    try {
      for (const route of ['home', 'branches', 'learning', 'project', 'insights']) {
        await page.evaluate(route => window.workbench.navigate(route), route);
        const broken = await page.locator('.page.active img').evaluateAll(images => images.filter(i => !i.complete || !i.naturalWidth).map(i => i.src));
        assert.deepEqual(broken, [], `${route} 图片应完整加载`);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px ${route} 不应溢出`);
        const overflow = await page.locator('.page.active').evaluate(el => el.scrollWidth > el.clientWidth + 1);
        assert.equal(overflow, false, `${width}px ${route} 卡片不应横向溢出`);
        await page.screenshot({ path: `docs/redesign/screenshots/${route}-${width}.png`, fullPage: true });
      }
      await page.evaluate(() => { window.workbench.navigate('home'); window.workbench.openRecord('sleep'); });
      await page.screenshot({ path: `docs/redesign/screenshots/record-${width}.png`, fullPage: true });
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  }
});
test('任务新增编辑移动删除、笔记与词汇复习都能保存', async () => {
  const { context, page, errors } = await fresh();
  try {
    await page.evaluate(() => window.workbench.navigate('project'));
    await page.locator('.page.active [data-edit-task="new"]').click();
    await page.getByLabel('任务名称').fill('专业课复习');
    await page.getByLabel('预计分钟').fill('45');
    await page.locator('#taskForm [name="category"]').selectOption('specialty');
    await page.getByRole('button', { name: '保存任务', exact: true }).click();
    await page.locator('.page.active [data-edit-task="8"]').click();
    await page.getByLabel('任务名称').fill('专业课复习与整理');
    await page.locator('#taskForm [name="bucket"]').selectOption('week');
    await page.getByRole('button', { name: '保存任务', exact: true }).click();
    assert.equal(await page.locator('[data-bucket="week"] [data-drag-task="8"]').count(), 1);
    await page.locator('[data-drag-task="8"]').dragTo(page.locator('[data-bucket="later"]'));
    assert.equal(await page.locator('[data-bucket="later"] [data-drag-task="8"]').count(), 1);
    await page.reload();
    assert.equal(await page.locator('[data-bucket="later"] [data-drag-task="8"]').count(), 1);
    await page.locator('.page.active [data-edit-task="8"]').click();
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#deleteTask').click();
    assert.equal(await page.locator('[data-drag-task="8"]').count(), 0);
    await page.evaluate(() => window.workbench.navigate('learning'));
    await page.locator('.page.active [data-action="notes"]').click();
    await page.locator('[data-edit-note="new"]').click();
    await page.getByLabel('笔记标题').fill('今天的理解');
    await page.getByLabel('笔记内容').fill('<img src=x onerror=alert(1)> 原样保留这段文字');
    await page.getByRole('button', { name: '保存笔记', exact: true }).click();
    assert.equal(await page.locator('.recent-note b').textContent(), '今天的理解');
    assert.equal(await page.locator('.recent-note p img').count(), 0, '笔记不能被执行为 HTML');
    await page.locator('.page.active .recent-note [data-edit-note]').click();
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#deleteNote').click();
    await page.locator('.page.active [data-action="review"]').click();
    await page.locator('[data-master-word="acquire"]').click();
    await page.locator('#listOverlay [data-close-overlay]').click();
    await page.reload();
    const state = await page.evaluate(() => JSON.parse(localStorage.getItem('life-workbench-html-v1')));
    assert.ok(state.mastered.includes('acquire'));
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
test('主题、首页布局与提醒可持久保存，菜单和弹层支持键盘退出', async () => {
  const { context, page, errors } = await fresh();
  try {
    await page.locator('#menuButton').click();
    assert.equal(await page.locator('#menuOverlay').isVisible(), true);
    await page.locator('#menuOverlay [data-open-page="profile"]').click();
    await page.locator('[data-profile-action="theme"]').click();
    await page.locator('[data-profile-action="layout"]').click();
    await page.locator('[data-profile-action="reminders"]').click();
    await page.reload();
    assert.match(await page.locator('.app').getAttribute('class'), /theme-lavender/);
    assert.match(await page.locator('.app').getAttribute('class'), /compact-home/);
    assert.equal(await page.locator('.reminder-state').count(), 1);
    await page.locator('[data-profile-action="privacy"]').click();
    assert.match(await page.locator('#toast').textContent(), /当前浏览器/);
    await page.locator('[data-nav="home"]').click();
    await page.locator('.add').click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#recordOverlay').isVisible(), false);
    assert.equal(await page.locator('.app').evaluate(el => el.inert), false);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
test('跨天不重复完成任务，旧运动睡眠迁移后不会冒充今天的记录', async () => {
  const { context, page, errors } = await fresh();
  try {
    await page.clock.install({ time: new Date('2026-10-14T12:00:00') });
    await page.evaluate(() => localStorage.setItem('life-workbench-html-v1', JSON.stringify({ version: 2, selectedDate: '2026-10-14', completed: [0], completedByDate: { '2026-10-13': [0] }, exercise: 20, sleep: 7, exerciseRecords: [{id:'exercise',date:'2026-10-13',minutes:20}], sleepRecords:[{id:'sleep',date:'2026-10-13',hours:7}] })));
    await page.reload();
    assert.equal(await page.locator('[data-ring="tasks"] strong').textContent(), '0%');
    assert.equal(await page.locator('[data-value="exercise"]').textContent(), '0/40 分钟');
    assert.equal(await page.locator('[data-value="sleep"]').textContent(), '0.0/8 小时');
    await page.evaluate(() => localStorage.setItem('life-workbench-html-v1', JSON.stringify({ selectedDate: '2026-10-14', exercise: 30, sleep: 8, completed: [0] })));
    await page.reload();
    assert.equal(await page.locator('[data-value="exercise"]').textContent(), '30/40 分钟');
    await page.clock.setSystemTime(new Date('2026-10-15T12:00:00'));
    await page.reload();
    await page.locator('.header .date').click();
    await page.locator('#todayButton').click();
    assert.equal(await page.locator('[data-ring="tasks"] strong').textContent(), '0%');
    assert.equal(await page.locator('[data-value="exercise"]').textContent(), '0/40 分钟');
    assert.equal(await page.locator('[data-value="sleep"]').textContent(), '0.0/8 小时');
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
test('异常任务与损坏 JSON 不会在启动时清空原始数据', async () => {
  const { context, page, errors } = await fresh();
  try {
    await page.evaluate(() => localStorage.setItem('life-workbench-html-v1', JSON.stringify({ version:2, tasks:[null], focus:25, completed:[], exerciseRecords:[], sleepRecords:[], ideas:[{id:'keep',text:'要保留的灵感',date:'2026-10-14'}] })));
    await page.reload();
    assert.equal(await page.locator('#profileFocus').textContent(), '25');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('life-workbench-html-v1')).ideas[0]?.text), '要保留的灵感');
    await page.evaluate(() => localStorage.setItem('life-workbench-html-v1', '{broken-json'));
    await page.reload();
    assert.equal(await page.evaluate(() => localStorage.getItem('life-workbench-html-v1')), '{broken-json');
    assert.match(await page.locator('#toast').textContent(), /原始/);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
test('恢复备份会预先规范异常任务，图片字段无法注入脚本', async () => {
  const { context, page, errors } = await fresh();
  let alerts = 0;
  page.on('dialog', async dialog => { if (dialog.type() === 'confirm') await dialog.accept(); else { alerts++; await dialog.dismiss(); } });
  try {
    await page.locator('[data-nav="profile"]').click();
    const raw = { version:2, focus:25, completed:[], exerciseRecords:[], sleepRecords:[], tasks:[null,{id:8,title:'合法任务',minutes:20,bucket:'today',category:'english',icon:'x" onerror="alert(123)//'}] };
    await page.locator('#importFile').setInputFiles({ name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(raw)) });
    await page.locator('#confirmImport').click();
    assert.equal(await page.locator('#importOverlay').isVisible(), false);
    assert.equal(await page.locator('#profileFocus').textContent(), '25');
    await page.evaluate(() => window.workbench.navigate('learning'));
    await page.waitForTimeout(100);
    assert.equal(alerts, 0);
    assert.equal(await page.locator('[onerror]').count(), 0);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
test('新任务编号不会复用已经保存专注历史的旧任务', async () => {
  const { context, page, errors } = await fresh();
  try {
    await page.evaluate(() => window.workbench.navigate('project'));
    await page.locator('.page.active [data-edit-task="new"]').click();
    await page.getByLabel('任务名称').fill('第一件任务');
    await page.getByRole('button',{name:'保存任务',exact:true}).click();
    await page.evaluate(() => {const s=JSON.parse(localStorage.getItem('life-workbench-html-v1'));s.focusRecords=[{id:'old',taskId:8,date:s.selectedDate,minutes:10}];localStorage.setItem('life-workbench-html-v1',JSON.stringify(s));});
    await page.reload();
    await page.locator('.page.active [data-edit-task="8"]').click();
    page.once('dialog', d => d.accept());
    await page.locator('#deleteTask').click();
    await page.locator('.page.active [data-edit-task="new"]').click();
    await page.getByLabel('任务名称').fill('全新的另一件任务');
    await page.getByRole('button',{name:'保存任务',exact:true}).click();
    const raw = await page.evaluate(() => JSON.parse(localStorage.getItem('life-workbench-html-v1')));
    const task = raw.tasks.find(t => t.title === '全新的另一件任务');
    assert.ok(task.id > 8);
    assert.equal(raw.focusRecords[0].taskId, 8);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
test('支线标题、阶段、月度重点、插画和专注浮条不会重叠', async () => {
  for (const width of [320, 375, 390, 430]) {
    const { context, page, errors } = await fresh(width);
    try {
      await page.locator('[data-nav="branches"]').click();
      const overlaps = await page.evaluate(() => {
        const selectors = ['.branch-hero h2', '.branch-hero > p', '.streak', '.month-focus', '.branch-hero .hero-art'];
        const rects = selectors.map(selector => ({ selector, rect: document.querySelector(selector).getBoundingClientRect() }));
        const collisions = [];
        for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i].rect, b = rects[j].rect;
          if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) collisions.push([rects[i].selector, rects[j].selector]);
        }
        for (const head of document.querySelectorAll('.branch-head')) {
          const copy = head.querySelector('p').getBoundingClientRect(), ring = head.querySelector('.ring').getBoundingClientRect();
          if (copy.right > ring.left + 1) collisions.push(['支线说明', '进度圆环']);
        }
        return collisions;
      });
      assert.deepEqual(overlaps, [], `${width}px 支线各区域不应重叠`);
      await page.locator('[data-nav="home"]').click();
      await page.locator('#focusButton').click();
      await page.locator('#pauseFocus').click();
      await page.locator('#focusOverlay [data-close-overlay]').click();
      await page.locator('[data-nav="branches"]').click();
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      const gap = await page.evaluate(() => document.querySelector('#focusPill').getBoundingClientRect().top - document.querySelector('.paused-row').getBoundingClientRect().bottom);
      assert.ok(gap >= 4, `${width}px 专注浮条不能遮住暂缓支线，实际间距 ${gap}px`);
      const docked = await page.evaluate(() => { const nav = document.querySelector('.bottom').getBoundingClientRect(), pill = document.querySelector('#focusPill').getBoundingClientRect(); return pill.top >= nav.top && pill.bottom <= nav.bottom; });
      assert.equal(docked, true, `${width}px 专注状态应停靠在导航区内`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px 不应横向溢出`);
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  }
});
