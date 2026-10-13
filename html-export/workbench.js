(() => {
  'use strict';
  const KEY = 'life-workbench-html-v1';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = (value, low, high) => Math.min(high, Math.max(low, number(value)));
  const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const today = () => dateKey(new Date());
  const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime()) && dateKey(new Date(`${value}T12:00:00`)) === value;
  const shiftDate = (key, delta) => { const d = new Date(`${key}T12:00:00`); d.setDate(d.getDate() + delta); return dateKey(d); };
  const lastSeven = key => Array.from({ length: 7 }, (_, i) => shiftDate(key, i - 6));
  const percent = (value, total) => total ? Math.min(100, Math.round(value / total * 100)) : 0;
  const fixed = value => number(value).toFixed(1);
  const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const asset = path => globalThis.WORKBENCH_ASSETS?.[path] || path;
  const image = (name, className = '', alt = '') => `<img src="${esc(asset(`assets/clean/illustrations/${name}.png`))}" class="${esc(className)}" alt="${esc(alt)}">`;
  const icon = (name, color = 'coral') => {
    const safeName = typeof name === 'string' && /^[a-z_]+$/.test(name) ? name : 'book';
    const safeColor = ['coral', 'purple', 'green', 'orange'].includes(color) ? color : 'coral';
    return `<img class="icon" src="${esc(asset(`assets/icon-preview/${safeName}_${safeColor}.png`))}" alt="">`;
  };
  const spark = '<span class="spark">✦</span>';
  const progress = (value, color = 'var(--orange)', id = '') => `<div class="progress" style="--accent:${color}"><span${id ? ` id="${id}"` : ''} style="width:${clamp(value, 0, 100)}%"></span></div>`;
  const ring = (value, color, content, attrs = '') => `<div class="ring" style="--value:${clamp(value, 0, 100) * 3.6}deg;--accent:${color}" ${attrs}>${content}</div>`;
  const defaults = () => ({
    version: 2, exercise: 0, sleep: 0, study: 0, focus: 0, completed: [], completedByDate: {},
    exerciseRecords: [], sleepRecords: [], finance: [], ideas: [], focusRecords: [], focusSession: null,
    selectedDate: today(), theme: 'warm', compactHome: false, reminders: false, name: '小兔软糖', stage: '备考期',
    projectStart: today(), projectWeek: 1, wordGoal: 2000, notes: [], mastered: [], priorities: ['保持每晚 7 小时以上睡眠，照顾好能量', '每天留出 30 分钟英语学习，慢慢积累', '安排 2 次运动，让身体和注意力都充充电'],
    nextTaskId: 8, tasks: [
      { id: 0, title: '词汇学习 80 个', minutes: 30, bucket: 'today', category: 'english', icon: 'book', description: '学习新词 + 复习巩固' },
      { id: 1, title: '长篇阅读 1 篇', minutes: 25, bucket: 'today', category: 'reading', icon: 'book', description: '四级阅读真题' },
      { id: 2, title: '听力真题 1 套', minutes: 20, bucket: 'today', category: 'english', icon: 'headphones', description: '真题听力练习' },
      { id: 3, title: '写作模板背诵', minutes: 20, bucket: 'week', category: 'english', icon: 'pencil' },
      { id: 4, title: '翻译每日一句', minutes: 15, bucket: 'week', category: 'english', icon: 'book' },
      { id: 5, title: '模拟卷练习', minutes: 60, bucket: 'week', category: 'english', icon: 'clipboard' },
      { id: 6, title: '语法专项练习', minutes: 20, bucket: 'later', category: 'english', icon: 'book' },
      { id: 7, title: '词根词缀整理', minutes: 15, bucket: 'later', category: 'english', icon: 'pencil' }
    ]
  });
  function normalize(raw) {
    const base = defaults();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
    for (const key of ['exercise', 'sleep', 'study', 'focus']) base[key] = Math.max(0, number(raw[key]));
    for (const key of ['exerciseRecords', 'sleepRecords', 'finance', 'ideas', 'focusRecords', 'notes']) base[key] = Array.isArray(raw[key]) ? raw[key].filter(v => v && typeof v === 'object' && !Array.isArray(v)) : [];
    if (Array.isArray(raw.tasks)) base.tasks = raw.tasks.filter(t => t && typeof t === 'object' && Number.isSafeInteger(t.id) && t.id >= 0 && t.id < 1e12 && typeof t.title === 'string' && ['today', 'week', 'later'].includes(t.bucket)).map(t => ({ ...t, minutes: clamp(t.minutes, 1, 600), category: ['english', 'reading', 'specialty'].includes(t.category) ? t.category : 'english' }));
    const ids = new Set(base.tasks.map(t => t.id));
    const datedCompletions = raw.completedByDate && typeof raw.completedByDate === 'object' && !Array.isArray(raw.completedByDate);
    const legacyDate = validDate(raw.selectedDate) ? raw.selectedDate : validDate(String(raw.exportedAt || '').slice(0, 10)) ? String(raw.exportedAt).slice(0, 10) : today();
    if (datedCompletions) {
      for (const [key, values] of Object.entries(raw.completedByDate)) if (validDate(key) && Array.isArray(values)) base.completedByDate[key] = [...new Set(values.filter(id => ids.has(id)))];
    }
    if (raw.version !== 2 && !datedCompletions && Array.isArray(raw.completed)) base.completedByDate[legacyDate] = [...new Set(raw.completed.filter(id => ids.has(id)))];
    // Convert undated v1 values once, rather than reusing them every new day.
    if (raw.version !== 2 && !base.exerciseRecords.length && base.exercise > 0) base.exerciseRecords.push({ id: uid(), date: legacyDate, minutes: base.exercise, legacy: true });
    if (raw.version !== 2 && !base.sleepRecords.length && base.sleep > 0) base.sleepRecords.push({ id: uid(), date: legacyDate, hours: clamp(base.sleep, 0, 24), legacy: true });
    base.exercise = base.exerciseRecords.filter(r => r.date === today()).reduce((sum, r) => sum + Math.max(0, number(r.minutes)), 0);
    base.sleep = clamp(base.sleepRecords.filter(r => r.date === today()).at(-1)?.hours, 0, 24);
    base.completed = base.completedByDate[today()] || [];
    for (const key of ['selectedDate', 'projectStart']) if (validDate(raw[key])) base[key] = raw[key];
    base.projectWeek = clamp(raw.projectWeek ?? 1, 1, 12);
    base.wordGoal = clamp(raw.wordGoal ?? 2000, 1, 1000000);
    base.theme = ['warm', 'lavender', 'mint'].includes(raw.theme) ? raw.theme : 'warm';
    for (const key of ['compactHome', 'reminders']) base[key] = Boolean(raw[key]);
    for (const key of ['name', 'stage']) if (typeof raw[key] === 'string' && raw[key].trim()) base[key] = raw[key].slice(0, 40);
    base.mastered = Array.isArray(raw.mastered) ? raw.mastered.filter(v => typeof v === 'string') : [];
    if (Array.isArray(raw.priorities)) base.priorities = base.priorities.map((v, i) => typeof raw.priorities[i] === 'string' ? raw.priorities[i].slice(0, 200) : v);
    if (raw.focusSession && typeof raw.focusSession === 'object' && number(raw.focusSession.startedAt) > 0) {
      base.focusSession = { ...raw.focusSession, startedAt: number(raw.focusSession.startedAt), elapsedMs: Math.max(0, number(raw.focusSession.elapsedMs)), running: Boolean(raw.focusSession.running), date: validDate(raw.focusSession.date) ? raw.focusSession.date : today() };
    }
    const referencedIds = [...base.tasks.map(t => t.id), ...base.focusRecords.map(r => number(r.taskId, -1)), number(base.focusSession?.taskId, -1)].filter(id => Number.isSafeInteger(id) && id >= 0 && id < 1e12);
    const savedNext = Number.isSafeInteger(raw.nextTaskId) && raw.nextTaskId >= 8 && raw.nextTaskId < 1e12 ? raw.nextTaskId : 8;
    base.nextTaskId = Math.max(8, savedNext, ...referencedIds.map(id => id + 1));
    return base;
  }
  let state, loadFailed = false;
  try { const raw = JSON.parse(localStorage.getItem(KEY) || 'null'); if (raw !== null && (typeof raw !== 'object' || Array.isArray(raw))) throw new Error('Invalid local state'); state = normalize(raw); } catch { state = defaults(); loadFailed = true; }
  let pageName = 'home', learningTab = 'english', activeTab = 'sleep', sleepStatus = 'fast', pendingImport = null, lastFocused = null, toastTimer;
  function persist() {
    state.completed = state.completedByDate[today()] || [];
    try {
      if (loadFailed) { const original = localStorage.getItem(KEY); if (original && !localStorage.getItem(`${KEY}-recovery`)) localStorage.setItem(`${KEY}-recovery`, original); }
      localStorage.setItem(KEY, JSON.stringify(state)); loadFailed = false; return true;
    } catch { return false; }
  }
  function toast(message) {
    $('#toast').textContent = message; $('#toast').classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 2400);
  }
  function commit(message) { const saved = persist(); render(); if (message) toast(saved ? message : '浏览器无法保存数据，请先导出备份'); return saved; }
  const selected = () => state.selectedDate || today();
  const doneOn = key => state.completedByDate[key] || [];
  const dayTasks = () => state.tasks.filter(t => t.bucket === 'today');
  function metrics(key = selected()) {
    const exerciseRows = state.exerciseRecords.filter(r => r.date === key);
    const sleepRows = state.sleepRecords.filter(r => r.date === key);
    const exercise = exerciseRows.reduce((s, r) => s + Math.max(0, number(r.minutes)), 0);
    const sleep = sleepRows.length ? clamp(sleepRows.at(-1).hours, 0, 24) : 0;
    const completed = doneOn(key);
    const study = state.tasks.filter(t => completed.includes(t.id)).reduce((s, t) => s + t.minutes, 0);
    const focus = state.focusRecords.filter(r => r.date === key).reduce((s, r) => s + number(r.minutes), 0);
    return { exercise, sleep, study, focus, done: completed.length, dailyDone: dayTasks().filter(t => completed.includes(t.id)).length };
  }
  function weekly(keys = lastSeven(selected())) {
    const data = keys.map(key => metrics(key));
    const sleep = data.map(v => v.sleep).filter(v => v > 0);
    return { keys, data, tasks: data.reduce((s, v) => s + v.done, 0), focus: data.reduce((s, v) => s + v.focus, 0), sleep: sleep.length ? sleep.reduce((s, v) => s + v, 0) / sleep.length : 0, sleepDays: sleep.length };
  }
  const learnedWords = () => Math.min(state.wordGoal, Object.values(state.completedByDate).filter(ids => ids.includes(0)).length * 80);
  function streak() {
    let count = 0, key = selected();
    if (!metrics(key).done && !metrics(key).focus && !metrics(key).exercise) key = shiftDate(key, -1);
    for (let i = 0; i < 3650; i++) { const m = metrics(key); if (!m.done && !m.focus && !m.exercise) break; count++; key = shiftDate(key, -1); }
    return count;
  }
  const dateLabel = key => { const d = new Date(`${key}T12:00:00`); return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} 周${'日一二三四五六'[d.getDay()]}`; };
  const scheduleTime = (task, index) => {
    const start = [540, 840, 1170][index % 3] + Math.floor(index / 3) * 60;
    const format = minutes => `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    return `${format(start)} – ${format(start + task.minutes)}`;
  };
  const quoteForDate = () => {
    const quotes = ['你未来的样子，\n藏在你现在的选择里。', '每天进步一点点，\n理想的生活会慢慢靠近。', '把复杂的目标，\n拆成一个现在能开始的动作。', '允许自己循序渐进，\n也相信时间会给出回响。', '休息也是计划的一部分，\n照顾好能量，再认真出发。'];
    return quotes[Math.floor(new Date(`${today()}T12:00:00`).getTime() / 86400000) % quotes.length];
  };
  function chart(values, { second = null, mini = false, max = 10, type = 'sleep', labels = false } = {}) {
    const width = 300, height = mini ? 37 : 116, left = mini ? 5 : 24, right = mini ? 5 : 9, top = mini ? 5 : 13, bottom = mini ? 7 : 15;
    const x = i => left + i * (width - left - right) / 6;
    const y = v => height - bottom - clamp(v / max, 0, 1) * (height - top - bottom);
    const points = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const secondPoints = second?.map((v, i) => `${x(i).toFixed(1)},${y(v / 100 * max).toFixed(1)}`).join(' ');
    const empty = !values.some(v => v > 0) && !second?.some(v => v > 0);
    return `<div class="chart" data-chart="${type}"><svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="${type === 'sleep' ? '睡眠' : '学习'}最近七天趋势，${values.map(v => fixed(v)).join('、')}">${!mini ? [0, .5, 1].map(v => `<line class="grid-line" x1="${left}" x2="${width - right}" y1="${y(max * v)}" y2="${y(max * v)}"/><text x="0" y="${y(max * v) + 3}">${max * v}${type === 'sleep' ? 'h' : ''}</text>`).join('') : ''}<polygon class="area" points="${left},${height - bottom} ${points} ${width - right},${height - bottom}"/><polyline class="line" points="${points}"/>${values.map((v, i) => `<circle class="dot" cx="${x(i)}" cy="${y(v)}" r="${mini ? 2 : 2.6}"/>${labels && v > 0 ? `<text x="${x(i)}" y="${y(v) - 8}" text-anchor="middle">${fixed(v)}</text>` : ''}`).join('')}${second ? `<polyline class="line orange" points="${secondPoints}"/>${second.map((v, i) => `<circle class="dot orange" cx="${x(i)}" cy="${y(v / 100 * max)}" r="2.6"/>${labels && v > 0 ? `<text x="${x(i)}" y="${y(v / 100 * max) + 15}" text-anchor="middle">${v}%</text>` : ''}`).join('')}` : ''}</svg>${empty && !mini ? '<div class="chart-empty">记录后，趋势会在这里慢慢生长</div>' : ''}</div>${mini ? '' : `<div class="days">${lastSeven(selected()).map(key => `<span>${'日一二三四五六'[new Date(`${key}T12:00:00`).getDay()]}</span>`).join('')}</div>`}`;
  }
  function title(text, right = '', symbol = spark) { return `<div class="section-title"><h3>${symbol} ${text}</h3>${right}</div>`; }
  function homeHTML() {
    const m = metrics(), week = weekly(), task = dayTasks().find(t => !doneOn(selected()).includes(t.id)) || dayTasks()[0];
    const taskMinutes = task ? (doneOn(selected()).includes(task.id) ? task.minutes : state.focusRecords.filter(r => r.date === selected() && r.taskId === task.id).reduce((s, r) => s + number(r.minutes), 0)) : 0;
    const hour = new Date().getHours(), greeting = hour < 11 ? '早上好呀！' : hour < 17 ? '下午好呀！' : '晚上好呀！';
    const rings = [['exercise', '运动', m.exercise, 40, '分钟', 'var(--green)', image('14-sneaker-icon')], ['sleep', '睡眠', m.sleep, 8, '小时', 'var(--purple)', image('11-crescent-moon-sparkles')], ['study', '学英语', m.study, 60, '分钟', 'var(--orange)', image('13-open-book-icon')], ['tasks', '习惯完成', m.dailyDone, dayTasks().length, '项', 'var(--coral)', icon('check')]];
    const finance = state.finance.filter(r => String(r.date).slice(0, 10) === selected()).length, ideas = state.ideas.filter(r => String(r.date).slice(0, 10) === selected()).length;
    return `<div class="hero"><h2>${greeting} <span class="spark">☀</span></h2><p>愿你稳步向理想的自己靠近 ${spark}</p><div class="weather"><b>${image('12-sun-and-cloud')}暖阳</b><span>今日也要好好生活</span></div>${image('03-rabbit-with-mug', 'hero-art art', '捧着杯子的小兔')}</div>
      <article class="card quote"><span class="tag">★ 今日一句</span><h3 id="dailyQuote">${esc(quoteForDate())}</h3>${image('09-tulip-daisy-cluster', 'art', '郁金香与雏菊')}</article>
      <article class="card overview">${title('今日概览')}<div class="rings">${rings.map(([key, name, value, target, unit, color, img]) => `<div class="ring-wrap">${ring(percent(value, target), color, `${img}<span class="ring-label">${name}</span><strong>${percent(value, target)}%</strong>`, `data-ring="${key}"`)}<span data-value="${key}">${key === 'sleep' ? fixed(value) : Math.round(value)}/${target} ${unit}</span></div>`).join('')}</div></article>
      <article class="card main-task"><h3>${icon('target')} 今日主任务</h3><h4>${task ? esc(task.title) : '为今天选一件重要的事'} <small>${task ? `${task.minutes}min` : ''}</small></h4><p class="subtitle">积累一点点，稳步靠近理想生活</p>${image('02-rabbit-reading', 'art', '阅读的小兔')}<div class="main-bottom">${progress(percent(taskMinutes, task?.minutes || 30), 'var(--orange)', 'mainProgress')}<small>${Math.floor(taskMinutes)}/${task?.minutes || 30} 分钟</small><button class="primary" id="focusButton" data-focus="${task?.id ?? 0}">${state.focusSession ? '▷ 返回专注' : '▷ 继续专注'}</button></div></article>
      ${title('今日支持任务', '<button class="text-button" data-open-page="project">查看全部 ›</button>', '<span style="color:#f3b6a3">♥</span>')}
      <div class="support-grid"><button class="support-task" data-record="exercise"><span class="support-heading">${icon('dumbbell', 'green')}<b>健身训练</b></span><small>20 分钟力量训练</small><span>${Math.round(m.exercise)}/20 分钟</span>${progress(percent(m.exercise, 20), 'var(--green)')}<span class="next">›</span></button><button class="support-task" data-open-page="learning" data-learning-tab="reading"><span class="support-heading">${image('13-open-book-icon')}<b>阅读 30 分钟</b></span><small>持续输入，拓宽视野</small><span>${doneOn(selected()).includes(1) ? 25 : 0}/30 分钟</span>${progress(doneOn(selected()).includes(1) ? 83 : 0, 'var(--purple)')}<span class="next">›</span></button><button class="support-task" data-record="idea"><span class="support-heading">${icon('camera', 'orange')}<b>自媒体更新</b></span><small>记录灵感 / 创作想法</small><span>${ideas}/1 次</span>${progress(percent(ideas, 1), 'var(--coral)')}<span class="next">›</span></button></div>
      <div class="home-bottom"><article class="card">${title('本周睡眠趋势', `<small>平均 ${fixed(week.sleep)}h</small>`, image('11-crescent-moon-sparkles', 'icon'))}${chart(week.data.map(v => v.sleep))}</article><article class="card">${title('快速记录', '', '<span class="spark">ϟ</span>')}<div class="quick-grid"><button class="quick" data-record="exercise">${image('14-sneaker-icon')}记运动</button><button class="quick" data-record="sleep">${image('11-crescent-moon-sparkles')}记睡眠</button><button class="quick" data-record="finance"><span class="coin">¥</span>记收入</button><button class="quick" data-record="idea"><span class="idea-icon">♧</span>记想法</button></div></article></div>
      <p class="record-summary" id="recordSummary"><strong>${m.exercise || m.sleep || finance || ideas ? '已保存' : '尚未记录'}</strong>　运动 ${Math.round(m.exercise)} 分钟 · 睡眠 ${fixed(m.sleep)} 小时 · 收支 ${finance} 条 · 想法 ${ideas} 条</p>`;
  }
  function branchesHTML() {
    const week = weekly(), totalDaily = dayTasks().length * 7;
    const branches = [
      ['学习成长', '每天进步一点点，未来更自由', '13-open-book-icon', 'var(--purple)', percent(week.tasks, totalDaily), '背词汇 20min', 'data-open-page="learning"', week.data.map(v => percent(v.dailyDone, dayTasks().length)), 6],
      ['身体健康', '健康是所有热爱的底气', '14-sneaker-icon', 'var(--green)', percent(week.data.filter(v => v.exercise > 0).length, 5), '记录一次运动', 'data-record="exercise"', week.data.map(v => v.exercise), 5],
      ['事业赚钱', '把热爱变现，创造更多可能', null, 'var(--orange)', percent(state.ideas.filter(r => week.keys.includes(String(r.date).slice(0, 10))).length, 3), '记录一笔收支', 'data-record="finance"', week.keys.map(key => state.ideas.filter(r => String(r.date).slice(0, 10) === key).length * 30), 3]
    ];
    return `<div class="branch-hero"><h2>我的支线 ${spark}</h2><p>当前阶段：<button class="stage-btn" data-action="stage">${esc(state.stage)} ⌄</button></p><span class="streak">🔥 持续推进 <b>${streak()}</b> 天</span><div class="month-focus"><h3>${icon('target')} 本月重点</h3><p>英语、睡眠、自媒体</p>${image('09-tulip-daisy-cluster', 'art')}</div>${image('03-rabbit-with-mug', 'hero-art art', '陪伴成长的小兔')}</div>
      <div id="branchCards">${branches.map(([name, copy, img, color, value, next, action, trend, days]) => `<article class="card branch-card" style="--accent:${color}"><div class="branch-head"><button class="badge text-button" ${action} aria-label="打开${name}">${img ? image(img) : icon('wallet', 'orange')}</button><div><h3>${name}</h3><p>${copy} ${spark}</p><span class="tag">Lv.${Math.floor(value / 20)}　${value ? '稳步推进' : '待开始'}</span><small>每周 ${days} 天</small></div>${ring(value, color, `<strong>${value}%</strong><span>本周进度</span>`)}</div><div class="branch-footer"><div><small>本周趋势</small>${chart(trend, { mini: true, max: 100, type: 'study' })}</div><div><small>下一步行动</small><button class="pill" ${action}>${next}<span>›</span></button></div></div></article>`).join('')}</div>
      ${title('保持中的支线', '<button class="text-button" data-action="manageBranches">管理全部 ›</button>', '<span style="color:#f3b6a3">♥</span>')}
      <div class="keeping-grid">${[['wallet', 'orange', '财务管理', 2, 'finance'], ['clipboard', 'green', '生活秩序', 3, 'project'], ['leaf', 'green', '内在成长', 2, 'idea'], ['book', 'purple', '阅读积累', 4, 'learning']].map(([i, color, text, days, target]) => `<button class="keeping" ${['finance', 'idea'].includes(target) ? `data-record="${target}"` : `data-open-page="${target}"`}>${icon(i, color)}${text}<small>每周 ${days} 天</small>${progress(0, `var(--${color})`)}</button>`).join('')}</div>
      ${title('暂时放缓', '<button class="text-button" data-action="paused">查看全部 (2) ⌄</button>', '<span>☁</span>')}<div class="paused-row"><button data-action="paused">✈ 旅行体验 <small>待回归</small></button><button data-action="paused">♧ 社交拓展 <small>待回归</small></button></div>`;
  }
  function adviceHTML() {
    const m = metrics(), remaining = dayTasks().find(t => !doneOn(selected()).includes(t.id));
    const text = m.sleep >= 7 ? '昨晚休息得不错，今天可以留一段完整时间给深度学习。每天一点点，慢慢向前！' : remaining ? `今天先专注 ${remaining.minutes} 分钟，完成「${remaining.title}」。小小的积累，也在靠近梦想！` : '今天的计划已完成。花 5 分钟回顾收获，再给自己一点放松的时间吧！';
    return `<article class="card ai-learning-card" data-ai-advice="learning"><h3>${icon('robot', 'purple')} AI 学习建议 ${spark}</h3><p>${esc(text)}</p>${image('07-rabbit-moon-mug', 'art', '月光下的小兔')}</article>`;
  }
  function learningHTML() {
    const words = learnedWords(), value = percent(words, state.wordGoal), week = weekly(), tasks = dayTasks().filter(t => learningTab === 'english' ? ['english', 'reading'].includes(t.category) : t.category === learningTab), note = state.notes.at(-1);
    const deadline = shiftDate(state.projectStart, 84), daysLeft = Math.max(0, Math.ceil((new Date(`${deadline}T12:00:00`) - new Date(`${selected()}T12:00:00`)) / 86400000));
    return `<article class="card goal-card">${image('02-rabbit-reading', 'learning-title-art art')}<span class="tag">目标进行中</span><div class="goal-main">${ring(value, 'var(--orange)', `<strong>${value}%</strong><span>完成进度</span>`)}<div class="goal-copy"><h3 class="goal-name">${image('13-open-book-icon')}四级核心词汇</h3><p>目标：掌握 ${state.wordGoal} 个高频词汇</p><div class="goal-actions"><span class="tag">🔥 连续学习 ${streak()} 天</span><button class="primary" data-focus="0">继续学习</button></div><button class="text-button project-link" data-open-page="project">查看备考项目 ›</button></div></div><div class="goal-stats"><div><small>☆ 已学单词</small><b>${words.toLocaleString()} 词</b></div><div><small>♧ 掌握率</small><b>${value}%</b></div><div><small>♧ 距离考试</small><b>还有 ${daysLeft} 天</b></div></div></article>
      <div class="learning-tabs" role="tablist" aria-label="学习分类">${[['english', '英语'], ['reading', '阅读'], ['specialty', '专业']].map(([id, label]) => `<button data-learning-tab="${id}" class="${learningTab === id ? 'active' : ''}" role="tab" aria-selected="${learningTab === id}">${label}</button>`).join('')}</div>
      <article class="card learning-plan">${title('今日学习计划', '<button class="text-button" data-open-page="project">编辑计划 ›</button>', icon('clipboard', 'orange'))}<div>${tasks.length ? tasks.map((task, index) => { const done = doneOn(selected()).includes(task.id); const actual = done ? task.minutes : state.focusRecords.filter(r => r.date === selected() && r.taskId === task.id).reduce((s, r) => s + number(r.minutes), 0); return `<div class="task task-row ${done ? 'done' : ''}"><button class="task-icon text-button" data-focus="${task.id}" aria-label="专注${esc(task.title)}">${icon(task.icon || 'book', ['coral', 'purple', 'green'][index % 3])}</button><div><b class="task-title">${esc(task.title)}</b><small>${esc(task.description || '一点点积累，看见进步')}</small></div><div><small>${Math.floor(actual)}/${task.minutes} 分钟</small>${progress(percent(actual, task.minutes), index === 1 ? 'var(--purple)' : 'var(--orange)')}</div><button class="check" data-task-toggle="${task.id}" aria-label="${done ? '撤销' : '完成'}${esc(task.title)}" aria-pressed="${done}">✓</button></div>`; }).join('') : '<p class="empty-plan">这条支线还没有今日任务，先加一项小计划吧。</p>'}</div></article>
      <div class="learning-grid"><article class="card">${title('本周学习时长', `<small>平均 ${fixed(week.data.reduce((s, v) => s + v.study, 0) / 7 / 60)}h</small>`, icon('clock', 'purple'))}${chart(week.data.map(v => v.study / 60), { type: 'study', max: 10 })}</article><article class="card">${title('最近笔记', '<button class="text-button" data-action="notes">全部 ›</button>', icon('book', 'purple'))}<div class="recent-note"><span class="tag">${note ? '学习记录' : '今日复习'}</span><b>${note ? esc(note.title) : '四级高频词组 ' + spark}</b><p>${note ? esc(note.content) : 'acquire　获得；获取\nappropriate　适当的；恰当的\ncontribute　贡献；捐助'}</p><button class="pill" ${note ? `data-edit-note="${esc(note.id)}"` : 'data-action="review"'}>${note ? '查看笔记' : '去复习'}</button></div></article></div>${adviceHTML()}<p class="page-tip">💡 坚持每天完成计划，进步看得见，梦想更近一步！</p>`;
  }
  function projectHTML() {
    const m = metrics(), completed = doneOn(selected()), allDone = state.tasks.filter(t => completed.includes(t.id)).length, overall = percent(allDone, state.tasks.length), deadline = shiftDate(state.projectStart, 84), daysLeft = Math.max(0, Math.ceil((new Date(`${deadline}T12:00:00`) - new Date(`${selected()}T12:00:00`)) / 86400000));
    const tasksToday = dayTasks(), scheduledMinutes = tasksToday.reduce((s, t) => s + t.minutes, 0);
    return `<article class="card project-hero"><h2 class="project-title">${image('13-open-book-icon')}英语四级备考 ${spark}</h2><p>每天进步一点点，四级一次过！ ${spark}</p>${image('01-rabbit-writing', 'art', '写计划的小兔')}<div class="project-meta"><div><small>总体进度</small><b class="overall">${overall}%</b>${progress(overall, 'var(--green)')}</div><div><small>截止日期</small><b>${deadline.replaceAll('-', '.')}</b><small>还有 ${daysLeft} 天</small></div><div><small>当前阶段</small><b class="current-stage">第 <span class="week-number">${state.projectWeek}</span> 周 / 共 12 周</b></div></div></article>
      <article class="card weeks-card">${title('12 周计划进度', '<button class="text-button" data-action="planDetails">查看计划详情 ›</button>', icon('calendar'))}<div class="week-track" style="--weeks:${(state.projectWeek - 1) / 11 * 100}%">${Array.from({ length: 12 }, (_, i) => `<button data-week="${i + 1}" class="${i + 1 < state.projectWeek ? 'past' : i + 1 === state.projectWeek ? 'current' : ''}" aria-label="切换第${i + 1}周" aria-pressed="${i + 1 === state.projectWeek}"><i>${i + 1 <= state.projectWeek ? '✓' : '○'}</i><span>W${i + 1}</span></button>`).join('')}</div></article>
      <div class="project-board">${[['today', '今日必须', 'target', 'coral'], ['week', '本周推进', 'trend', 'purple'], ['later', '可延后', 'clock', 'orange']].map(([id, label, img, color]) => { const tasks = state.tasks.filter(t => t.bucket === id); const value = percent(tasks.filter(t => completed.includes(t.id)).length, tasks.length); return `<section class="bucket" data-bucket="${id}"><h3>${icon(img, color)}${label}<small>${tasks.length}</small></h3><div class="bucket-list">${tasks.map(task => `<div class="task board-task ${completed.includes(task.id) ? 'done' : ''}" draggable="true" data-drag-task="${task.id}"><button class="check" data-task-toggle="${task.id}" aria-label="${completed.includes(task.id) ? '撤销' : '完成'}${esc(task.title)}" aria-pressed="${completed.includes(task.id)}">${completed.includes(task.id) ? '✓' : ''}</button><div><span class="task-title">${esc(task.title.replaceAll(' ', ''))}</span><small>${task.minutes} 分钟</small></div><button class="edit-task" data-edit-task="${task.id}" aria-label="编辑${esc(task.title)}"></button></div>`).join('') || '<p class="empty-plan">留一点弹性</p>'}</div><div class="bucket-foot">${id === 'today' ? '一步一步，完成今天 ☆' : id === 'week' ? `本周目标进度 ${value}%` + progress(value, 'var(--purple)') : '灵活安排时间 🌱'}</div></section>`; }).join('')}</div><div class="project-tools"><button class="text-button" data-edit-task="new">＋ 新建任务</button></div>
      <article class="card schedule">${title('今日时间安排', `<small>总计 ${fixed(scheduledMinutes / 60)} 小时</small>`, icon('clock', 'orange'))}<div>${tasksToday.map((t, i) => `<div class="schedule-row"><span class="time">${icon(t.icon || 'book', ['green', 'purple', 'orange'][i % 3])}${scheduleTime(t, i)}</span><span>${esc(t.title)} <span class="tag">专注</span></span><button data-focus="${t.id}" aria-label="开始专注${esc(t.title)}">›</button></div>`).join('') || '<p class="empty-plan">添加一件今日必须的事，为它留一点时间。</p>'}</div></article>
      <article class="card result-card"><h3>${icon('star', 'orange')}本周关键结果</h3><p>已完成 ${weekly().tasks} 项任务，积累 ${learnedWords()} 个词汇</p><small>继续保持，稳步向前！ ${spark}</small>${image('05-rabbit-heart-box', 'art', '给你一颗心的小兔')}</article><div class="project-start"><button class="primary" data-focus="${tasksToday.find(t => !completed.includes(t.id))?.id ?? tasksToday[0]?.id ?? 0}">▷ 开始专注</button></div>`;
  }
  function insightsHTML() {
    const week = weekly(), previous = weekly(lastSeven(shiftDate(selected(), -7))), sleepDiff = week.sleep - previous.sleep, focusDiff = (week.focus - previous.focus) / 60, tasksDiff = week.tasks - previous.tasks;
    const diff = (value, unit = '') => `${value >= 0 ? '+' : ''}${unit ? fixed(value) : value}${unit} ${value > 0 ? '↑' : value < 0 ? '↓' : '—'}`;
    const habits = [['运动', '14-sneaker-icon', v => percent(v.exercise, 40), 'green'], ['早睡', '11-crescent-moon-sparkles', v => percent(v.sleep, 8), 'green'], ['学英语', '13-open-book-icon', v => percent(v.study, 60), 'orange'], ['习惯打卡', null, v => percent(v.dailyDone, dayTasks().length), 'green']];
    return `<div class="insights-hero"><h2>本周洞察 ${spark}</h2><p>${week.keys[0].slice(5).replace('-', '/')} – ${selected().slice(5).replace('-', '/')} <button class="text-button" data-action="date">⌄</button></p>${image('04-rabbit-magnifying-flowers', 'art', '观察花朵的小兔')}</div><div class="stats"><article class="card stat"><div>${icon('clipboard', 'green')}完成任务</div><b><span id="statTasks">${week.tasks}</span><small>项</small></b><small>较上周 ${diff(tasksDiff)}</small></article><article class="card stat"><div>${icon('clock', 'orange')}专注时长</div><b><span id="statFocus">${fixed(week.focus / 60)}</span><small>h</small></b><small>较上周 ${diff(focusDiff, 'h')}</small></article><article class="card stat"><div>${image('11-crescent-moon-sparkles')}睡眠平均</div><b><span id="statSleep">${fixed(week.sleep)}</span><small>h</small></b><small>${week.sleepDays ? `较上周 ${diff(sleepDiff, 'h')}` : '从第一次记录开始'}</small></article></div>
      <article class="card insights-chart">${title('睡眠与学习趋势', '<button class="text-button" data-action="date">按天查看 ⌄</button>')}<div class="chart-legend"><span>睡眠时长（小时）</span><span>学习完成率（%）</span></div>${chart(week.data.map(v => v.sleep), { second: week.data.map(v => percent(v.dailyDone, dayTasks().length)), labels: true })}</article>
      <article class="card heat-card">${title('习惯完成热力图', '<small>完成率　<span style="color:#dfe8c0">●</span> 低　<span style="color:#9fb776">●</span> 高</small>', '<span style="color:#f3b6a3">♥</span>')}<div class="heat"><div class="heat-row head"><span></span>${week.keys.map(key => `<span>周${'日一二三四五六'[new Date(`${key}T12:00:00`).getDay()]}</span>`).join('')}</div>${habits.map(([name, img, get, color]) => `<div class="heat-row"><b>${img ? image(img) : icon('check', 'orange')}${name}</b>${week.data.map((v, i) => { const value = get(v); return `<i title="${week.keys[i]} ${name} ${value}%" aria-label="${week.keys[i]} ${name} ${value}%" style="background:color-mix(in srgb,var(--${color}) ${value}%,#faf9ed)"></i>`; }).join('')}</div>`).join('')}</div></article>
      <article class="card insight-card">${title('本周洞察', '', icon('lightbulb', 'orange'))}<div class="insight-panels"><div class="insight-panel">${image('11-crescent-moon-sparkles')}<div><b>${week.sleepDays ? `有 ${week.data.filter(v => v.sleep >= 7).length} 天睡眠达到 7 小时` : '记录睡眠，照顾自己的能量'}</b><p id="insightText">${week.sleepDays ? `已记录 ${week.sleepDays} 天，平均 ${fixed(week.sleep)} 小时。持续记录，更容易看清自己的节奏。` : '还没有足够数据。先记下昨晚的睡眠，变化会慢慢显现。'}</p></div></div><div class="insight-panel">${image('15-heart-medal-icon')}<div><b>${week.focus ? '认真投入的时间，都会留下痕迹' : '为重要的事情留一段专注'}</b><p>${week.focus ? `本周累计专注 ${Math.round(week.focus)} 分钟，完成 ${week.tasks} 项任务。` : '从一个 20 分钟的小任务开始，建立自己的行动节奏。'}</p></div></div></div><div class="priorities"><h3>${spark} 下周优先 3 件事</h3>${image('08-rabbit-plan-card-flowers', 'art', '拿着计划的小兔')}${state.priorities.map((p, i) => `<p><span>${i + 1}</span><button class="text-button" data-priority="${i}" style="text-align:left;font-size:10px;padding:0">${esc(p)}</button></p>`).join('')}</div></article>`;
  }
  function profileHTML() {
    const completed = Object.values(state.completedByDate).reduce((sum, ids) => sum + ids.length, 0), level = Math.floor(completed / 10);
    return `<article class="card profile-head">${image('03-rabbit-with-mug', 'avatar', '小兔头像')}<div><span class="tag">Lv.${level}</span><h2><button class="text-button" data-action="name" style="font:inherit">${esc(state.name)} ✎</button></h2><p>当前人生阶段：${esc(state.stage)}</p></div></article><article class="card">${title('本月里程碑') }<div class="profile-metrics">${ring(percent(completed, 30), 'var(--orange)', `<strong id="milestoneRing">${percent(completed, 30)}%</strong>`)}<p>累计完成 <b id="profileTasks">${completed}</b> 项任务<br>累计专注 <b id="profileFocus">${Math.floor(state.focus)}</b> 分钟</p></div></article><div class="menu-list"><button data-profile-action="theme">主题外观 <small>${({ warm: '奶油暖阳', lavender: '温柔薰衣草', mint: '清新薄荷' })[state.theme]} ›</small></button><button data-profile-action="layout">首页布局 <small>${state.compactHome ? '精简模式' : '完整模式'} ›</small></button><button data-profile-action="reminders">提醒与专注 <span class="${state.reminders ? 'reminder-state' : ''}">${state.reminders ? '专注满 20 分钟时提醒' : '已关闭'} ›</span></button><button data-profile-action="privacy">数据与隐私 <small>保存在本机浏览器 ›</small></button><button data-action="records">全部记录 <small>查看与删除 ›</small></button><button data-action="notes">学习笔记 <small>${state.notes.length} 篇 ›</small></button></div><div class="backup-grid" style="margin-top:14px"><button class="secondary" id="exportButton">↓ 导出 JSON 备份</button><button class="secondary" id="importButton">↑ 恢复 JSON 备份</button></div><button class="text-button danger" id="resetButton" style="display:block;margin:17px auto">全部数据清零</button><p class="page-tip">每一个小小的行动，都在靠近更好的自己 ${spark}</p>`;
  }
  function render() {
    const renderers = { home: homeHTML, branches: branchesHTML, learning: learningHTML, project: projectHTML, insights: insightsHTML, profile: profileHTML };
    for (const [name, fn] of Object.entries(renderers)) $(`[data-page="${name}"]`).innerHTML = fn();
    const app = $('.app'); app.classList.toggle('theme-lavender', state.theme === 'lavender'); app.classList.toggle('theme-mint', state.theme === 'mint'); app.classList.toggle('compact-home', state.compactHome);
    $('#dateLabel').textContent = dateLabel(selected()); $('#dateInput').value = selected(); $('#recordDateHint').textContent = dateLabel(selected());
    updateNavigation(); updateFocus();
  }
  function updateNavigation() {
    const detail = ['learning', 'project'].includes(pageName);
    $$('.page').forEach(el => el.classList.toggle('active', el.dataset.page === pageName));
    $$('[data-nav]').forEach(el => { const active = el.dataset.nav === pageName || (detail && el.dataset.nav === 'branches'); el.classList.toggle('active', active); active ? el.setAttribute('aria-current', 'page') : el.removeAttribute('aria-current'); });
    $('.app').classList.toggle('detail', detail); $('.header').classList.toggle('detail-header', detail); $('.header').classList.toggle('branch-header', pageName === 'branches');
    $('#pageTitle').innerHTML = `${esc(({ home: '人生支线工作台', branches: '我的支线', learning: '学习成长', project: '项目计划', insights: '人生支线工作台', profile: '我的' })[pageName])} ${detail ? '' : spark}`;
    $('#menuButton').innerHTML = detail ? '‹' : '<span class="menu-lines" aria-hidden="true">☰</span>';
    $('#menuButton').setAttribute('aria-label', detail ? '返回支线' : '菜单');
    document.title = `${({ home: '人生支线工作台', branches: '我的支线', learning: '学习成长', project: '项目计划', insights: '本周洞察', profile: '我的' })[pageName]} · HTML 版`;
  }
  function navigate(name, updateHash = true) {
    if (!['home', 'branches', 'learning', 'project', 'insights', 'profile'].includes(name)) name = 'home';
    pageName = name; closeAll(); updateNavigation(); if (updateHash && location.hash !== `#${name}`) history.pushState(null, '', `#${name}`);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function openOverlay(id) {
    closeAll(false); lastFocused = document.activeElement; const overlay = $(`#${id}`); overlay.classList.add('open'); $('.app').inert = true; document.body.style.overflow = 'hidden'; overlay.querySelector('[tabindex="-1"]')?.focus();
  }
  function closeAll(restoreFocus = true) {
    $$('.overlay').forEach(el => el.classList.remove('open')); $('.app').inert = false; document.body.style.overflow = '';
    if (restoreFocus && lastFocused?.isConnected) lastFocused.focus(); updateFocus();
  }
  function setTab(tab) {
    if (!['exercise', 'sleep', 'finance', 'idea'].includes(tab)) tab = 'sleep';
    activeTab = tab;
    $$('[data-tab]').forEach(el => { el.classList.toggle('active', el.dataset.tab === tab); if (el.getAttribute('role') === 'tab') el.setAttribute('aria-selected', el.dataset.tab === tab); });
    $$('[data-panel]').forEach(el => { const active = el.dataset.panel === tab; el.classList.toggle('active', active); el.querySelectorAll('input,select,textarea').forEach(input => input.disabled = !active); });
    $('#noteLabel').innerHTML = `${tab === 'sleep' ? '☾ 睡眠' : ({ exercise: '运动', finance: '收支', idea: '灵感' })[tab]}备注 <small>（可选）</small>`;
    $('#recordForm [name="note"]').placeholder = tab === 'sleep' ? '记录一下昨晚的睡眠感受吧～' : '写下此刻的感受吧～';
  }
  function openRecord(tab = 'sleep') { $('#recordForm').reset(); sleepStatus = 'fast'; setSleepStatus('fast'); $('#qualityValue').textContent = '82分'; $('#noteCount').textContent = '0/100'; setTab(tab); openOverlay('recordOverlay'); }
  function setSleepStatus(value) { sleepStatus = value; $$('[data-sleep-status]').forEach(el => { const active = el.dataset.sleepStatus === value; el.classList.toggle('active', active); el.setAttribute('aria-pressed', active); }); }
  function elapsedMs() { const session = state.focusSession; return session ? number(session.elapsedMs) + (session.running ? Math.max(0, Date.now() - session.startedAt) : 0) : 0; }
  function timeText(ms) { const seconds = Math.floor(ms / 1000); return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
  function updateFocus() {
    const session = state.focusSession, pill = $('#focusPill'); pill.hidden = !session || $('#focusOverlay').classList.contains('open');
    if (!session) return;
    const task = state.tasks.find(t => t.id === session.taskId);
    $('#focusTitle').textContent = task?.title || '给自己一点专注时间'; $('#focusTime').textContent = timeText(elapsedMs());
    $('#focusStatus').textContent = session.running ? '正在专注，慢慢来就很好' : '已暂停，准备好再继续'; $('#pauseFocus').textContent = session.running ? '暂停' : '继续';
    pill.innerHTML = `${session.running ? '▷ 专注中' : 'Ⅱ 已暂停'} <span>${timeText(elapsedMs())}</span>`;
    if (state.reminders && elapsedMs() >= 1200000 && !session.reminded) { session.reminded = true; persist(); toast('已专注 20 分钟，记得放松一下眼睛'); }
  }
  function startFocus(id) {
    if (!state.focusSession) { state.focusSession = { id: uid(), taskId: number(id), date: selected(), startedAt: Date.now(), elapsedMs: 0, running: true }; persist(); render(); }
    openOverlay('focusOverlay'); updateFocus();
  }
  function pauseFocus() { const session = state.focusSession; if (!session) return; session.elapsedMs = elapsedMs(); session.startedAt = Date.now(); session.running = !session.running; persist(); updateFocus(); }
  function finishFocus() {
    const session = state.focusSession; if (!session) return;
    const ms = elapsedMs(), minutes = ms / 60000;
    if (ms > 0 && !state.focusRecords.some(r => r.id === session.id)) { state.focusRecords.push({ id: session.id, date: session.date, taskId: session.taskId, minutes, elapsedMs: ms }); state.focus += minutes; }
    state.focusSession = null; closeAll(); commit(`已保存 ${Math.floor(ms / 60000)} 分 ${Math.floor(ms / 1000) % 60} 秒专注`);
  }
  function toggleTask(id) {
    id = number(id); if (!state.tasks.some(t => t.id === id)) return;
    const completed = doneOn(selected()); const has = completed.includes(id); state.completedByDate[selected()] = has ? completed.filter(v => v !== id) : [...completed, id];
    commit(has ? '已撤销完成，慢慢来就好' : '任务已完成，今天又前进了一点！');
  }
  function openTask(id) {
    const task = id === 'new' ? null : state.tasks.find(t => t.id === number(id)), form = $('#taskForm'); form.reset(); form.elements.id.value = task ? task.id : ''; form.elements.title.value = task?.title || ''; form.elements.minutes.value = task?.minutes || 20; form.elements.bucket.value = task?.bucket || 'today'; form.elements.category.value = task?.category || learningTab;
    $('#editTitle').textContent = task ? '编辑任务' : '新建任务'; $('#deleteTask').hidden = !task; openOverlay('editOverlay');
  }
  function openNote(id) { const note = state.notes.find(n => n.id === id), form = $('#noteForm'); form.reset(); form.elements.id.value = note?.id || ''; form.elements.title.value = note?.title || ''; form.elements.content.value = note?.content || ''; $('#deleteNote').hidden = !note; openOverlay('noteOverlay'); }
  function openList(name, content) { $('#listTitle').textContent = name; $('#listContent').innerHTML = content; openOverlay('listOverlay'); }
  function showNotes() { openList('学习笔记', `<button class="primary" data-edit-note="new">＋ 新建笔记</button>${state.notes.length ? [...state.notes].reverse().map(n => `<article class="list-item"><b>${esc(n.title)}</b><p>${esc(n.content)}</p><small>${esc(n.date)}</small><div class="list-actions"><button data-edit-note="${esc(n.id)}">编辑</button></div></article>`).join('') : '<p class="empty-note">还没有笔记，把今天的一点理解收好吧。</p>'}`); }
  const vocabulary = [['acquire', '获得；获取'], ['appropriate', '适当的；恰当的'], ['contribute', '贡献；捐助']];
  function showReview() { openList('四级高频词组 · 复习', `<p class="muted" style="font-size:12px">把学会的单词标记为已掌握，随时可以撤销。</p>${vocabulary.map(([word, meaning]) => `<div class="list-item review-word ${state.mastered.includes(word) ? 'mastered' : ''}"><div><b>${word}</b><p>${meaning}</p></div><button data-master-word="${word}" aria-pressed="${state.mastered.includes(word)}">${state.mastered.includes(word) ? '已掌握 ✓' : '标记掌握'}</button></div>`).join('')}`); }
  function showRecords() {
    const records = ['exerciseRecords', 'sleepRecords', 'finance', 'ideas'].flatMap(type => state[type].map(r => ({ ...r, recordType: type }))).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    openList('全部记录', records.length ? records.map(r => `<article class="list-item"><b>${({ exerciseRecords: '运动', sleepRecords: '睡眠', finance: r.type === 'income' ? '收入' : '支出', ideas: '想法' })[r.recordType]}</b><p>${esc(r.recordType === 'exerciseRecords' ? `${r.minutes} 分钟` : r.recordType === 'sleepRecords' ? `${fixed(r.hours)} 小时${r.quality !== undefined ? ` · 质量 ${r.quality} 分` : ''}` : r.recordType === 'finance' ? `¥ ${number(r.amount).toFixed(2)}` : r.text)}</p>${r.note ? `<p>${esc(r.note)}</p>` : ''}<small>${esc(String(r.date).slice(0, 10))}</small><div class="list-actions"><button data-delete-record="${esc(r.id)}" data-record-type="${r.recordType}">删除</button></div></article>`).join('') : '<p class="empty-note">这里会收好每一次记录。</p>');
  }
  function handleAction(action) {
    if (action === 'date') { $('#dateInput').value = selected(); openOverlay('dateOverlay'); }
    if (action === 'notes') showNotes();
    if (action === 'review') showReview();
    if (action === 'records') showRecords();
    if (action === 'stage' || action === 'name') { const key = action === 'stage' ? 'stage' : 'name'; const value = prompt(key === 'name' ? '怎么称呼你？' : '你目前处于什么人生阶段？', state[key]); if (value?.trim()) { state[key] = value.trim().slice(0, 40); commit('已更新'); } }
    if (action === 'manageBranches') openList('管理支线', '<p class="muted">让重点支线先向前一点，其余支线保持小步行动。</p><div class="menu-list"><button data-open-page="learning">学习成长 ›</button><button data-record="exercise">身体健康 ›</button><button data-record="finance">财务管理 ›</button><button data-open-page="project">生活秩序 ›</button><button data-record="idea">内在成长 ›</button></div>');
    if (action === 'paused') openList('暂时放缓的支线', '<p class="muted">暂停也是一种选择。想重新开始时，为这条支线写下一个小行动。</p><div class="menu-list"><button data-record="idea">✈ 旅行体验 · 写下下一站 ›</button><button data-record="idea">♧ 社交拓展 · 记下想见的人 ›</button></div>');
    if (action === 'planDetails') openList('12 周备考计划', `<label class="field"><span>计划开始日期</span><input id="projectStartInput" type="date" value="${state.projectStart}"></label><label class="field"><span>词汇目标</span><input id="wordGoalInput" type="number" min="1" max="1000000" value="${state.wordGoal}"></label><button class="primary" data-action="savePlan">保存计划</button><div class="list-item"><b>第 1–4 周：建立基础</b><p>高频词汇、听力和阅读，建立每日学习节奏。</p></div><div class="list-item"><b>第 5–8 周：专项提升</b><p>写作、翻译与错题整理，把薄弱环节逐个补上。</p></div><div class="list-item"><b>第 9–12 周：模拟与复盘</b><p>完整模拟试卷，复习词汇，稳定作息。</p></div>`);
    if (action === 'savePlan') { const key = $('#projectStartInput').value, goal = number($('#wordGoalInput').value); if (!validDate(key) || goal < 1 || goal > 1000000) return toast('请填写有效的日期与词汇目标'); state.projectStart = key; state.wordGoal = goal; closeAll(); commit('项目计划已更新'); }
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.hasAttribute('data-close-overlay')) return closeAll();
    if (button.dataset.learningTab) { learningTab = button.dataset.learningTab; render(); }
    if (button.dataset.nav || button.dataset.openPage) return navigate(button.dataset.nav || button.dataset.openPage);
    if (button.dataset.record) return openRecord(button.dataset.record);
    if (button.dataset.tab) return setTab(button.dataset.tab);
    if (button.dataset.sleepStatus) return setSleepStatus(button.dataset.sleepStatus);
    if (button.dataset.focus !== undefined) return startFocus(button.dataset.focus);
    if (button.dataset.taskToggle !== undefined) return toggleTask(button.dataset.taskToggle);
    if (button.dataset.editTask !== undefined) return openTask(button.dataset.editTask);
    if (button.dataset.editNote !== undefined) return openNote(button.dataset.editNote);
    if (button.dataset.week) { state.projectWeek = number(button.dataset.week); return commit(`已切换到第 ${state.projectWeek} 周计划`); }
    if (button.dataset.action) return handleAction(button.dataset.action);
    if (button.dataset.priority !== undefined) { const i = number(button.dataset.priority), value = prompt('下周想优先做好什么？', state.priorities[i]); if (value?.trim()) { state.priorities[i] = value.trim().slice(0, 200); commit('下周计划已更新'); } return; }
    if (button.dataset.masterWord) { const word = button.dataset.masterWord; state.mastered = state.mastered.includes(word) ? state.mastered.filter(v => v !== word) : [...state.mastered, word]; persist(); showReview(); return; }
    if (button.dataset.deleteRecord) { const type = button.dataset.recordType; if (!['exerciseRecords', 'sleepRecords', 'finance', 'ideas'].includes(type) || !confirm('删除这条记录？')) return; state[type] = state[type].filter(r => r.id !== button.dataset.deleteRecord); if (type === 'sleepRecords') state.sleep = state.sleepRecords.filter(r => r.date === today()).at(-1)?.hours || 0; if (type === 'exerciseRecords') state.exercise = state.exerciseRecords.filter(r => r.date === today()).reduce((s, r) => s + number(r.minutes), 0); commit('记录已删除'); showRecords(); return; }
    if (button.dataset.profileAction) {
      const action = button.dataset.profileAction;
      if (action === 'theme') { const themes = ['warm', 'lavender', 'mint']; state.theme = themes[(themes.indexOf(state.theme) + 1) % 3]; commit('主题已切换'); }
      if (action === 'layout') { state.compactHome = !state.compactHome; commit(state.compactHome ? '首页已切换为精简布局' : '首页已恢复完整布局'); }
      if (action === 'reminders') { state.reminders = !state.reminders; commit(state.reminders ? '专注满 20 分钟时会在页面内提醒你' : '专注提醒已关闭'); }
      if (action === 'privacy') toast('数据仅保存在当前浏览器，可随时导出或清零');
      return;
    }
    switch (button.id) {
      case 'menuButton': return ['learning', 'project'].includes(pageName) ? navigate('branches') : openOverlay('menuOverlay');
      case 'saveDateButton': if (!validDate($('#dateInput').value)) return toast('请选择有效日期'); state.selectedDate = $('#dateInput').value; closeAll(); return commit('工作台日期已更新');
      case 'todayButton': state.selectedDate = today(); closeAll(); return commit('已回到今天');
      case 'focusPill': return openOverlay('focusOverlay');
      case 'pauseFocus': return pauseFocus();
      case 'finishFocus': return finishFocus();
      case 'deleteTask': { const id = number($('#taskForm').elements.id.value); if (!confirm('删除这个任务？')) return; state.tasks = state.tasks.filter(t => t.id !== id); for (const key of Object.keys(state.completedByDate)) state.completedByDate[key] = state.completedByDate[key].filter(v => v !== id); closeAll(); return commit('任务已删除'); }
      case 'deleteNote': if (!confirm('删除这篇笔记？')) return; state.notes = state.notes.filter(n => n.id !== $('#noteForm').elements.id.value); closeAll(); return commit('笔记已删除');
      case 'exportButton': { const blob = new Blob([JSON.stringify({ ...state, version: 2, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'life-workbench-backup.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); return; }
      case 'importButton': return $('#importFile').click();
      case 'confirmImport': if (!pendingImport || !confirm('用备份替换当前本地数据？')) return; state = normalize(pendingImport); pendingImport = null; closeAll(); return commit('备份已恢复');
      case 'resetButton': if (!confirm('确定清零全部本地数据吗？建议先导出备份。')) return; state = defaults(); closeAll(); return commit('全部数据已清零');
    }
    if (button.classList.contains('date')) { $('#dateInput').value = selected(); openOverlay('dateOverlay'); }
  });
  $$('.overlay').forEach(el => el.addEventListener('click', event => { if (event.target === el) closeAll(); }));
  document.addEventListener('keydown', event => {
    const overlay = $('.overlay.open');
    if (event.key === 'Escape') closeAll();
    if (event.key === 'Tab' && overlay) {
      const focusable = [...overlay.querySelectorAll('button,input,select,textarea')].filter(el => !el.disabled && el.getClientRects().length > 0), first = focusable[0], last = focusable.at(-1);
      if (!first) return;
      if (event.shiftKey && (document.activeElement === first || !focusable.includes(document.activeElement))) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && (document.activeElement === last || !focusable.includes(document.activeElement))) { event.preventDefault(); first.focus(); }
    }
  });
  $('#sleepQuality').addEventListener('input', event => $('#qualityValue').textContent = `${event.target.value}分`);
  $('#recordForm [name="note"]').addEventListener('input', event => $('#noteCount').textContent = `${event.target.value.length}/100`);
  $('#recordForm').addEventListener('submit', event => {
    event.preventDefault(); const form = event.currentTarget; if (!form.reportValidity()) return; const data = new FormData(form), key = selected(), note = String(data.get('note') || '').trim();
    const record = { id: uid(), date: key, note };
    if (activeTab === 'exercise') { const minutes = number(data.get('exercise')); if (minutes <= 0 || minutes > 600) return toast('运动时长请填写 1–600 分钟'); state.exerciseRecords.push({ ...record, minutes, type: data.get('exerciseType') }); if (key === today()) state.exercise = state.exerciseRecords.filter(r => r.date === key).reduce((s, r) => s + number(r.minutes), 0); }
    if (activeTab === 'sleep') { const start = String(data.get('sleepStart')), end = String(data.get('sleepEnd')), [sh, sm] = start.split(':').map(Number), [eh, em] = end.split(':').map(Number); const minutes = (eh * 60 + em - sh * 60 - sm + 1440) % 1440; if (!Number.isFinite(minutes) || minutes === 0) return toast('睡觉和起床时间需要不同'); const hours = minutes / 60; state.sleepRecords.push({ ...record, hours, start, end, quality: clamp(data.get('quality'), 0, 100), status: sleepStatus }); if (key === today()) state.sleep = hours; }
    if (activeTab === 'finance') { const amount = number(data.get('amount')); if (amount <= 0) return toast('请填写有效金额'); state.finance.push({ ...record, date: `${key}T12:00:00`, amount, type: data.get('financeType') }); }
    if (activeTab === 'idea') { const text = String(data.get('idea') || '').trim(); if (!text) return toast('先写下一点灵感吧'); state.ideas.push({ ...record, date: `${key}T12:00:00`, text }); }
    closeAll(); commit('记录已保存，圆环与曲线图已同步');
  });
  $('#taskForm').addEventListener('submit', event => {
    event.preventDefault(); const form = event.currentTarget; if (!form.reportValidity()) return; const title = form.elements.title.value.trim(); if (!title) return; const existing = form.elements.id.value !== '' ? state.tasks.find(t => t.id === number(form.elements.id.value)) : null;
    const task = { ...existing, id: existing?.id ?? state.nextTaskId++, title, minutes: clamp(form.elements.minutes.value, 1, 600), bucket: form.elements.bucket.value, category: form.elements.category.value, icon: existing?.icon || 'book' };
    if (existing) state.tasks = state.tasks.map(t => t.id === task.id ? task : t); else state.tasks.push(task); closeAll(); commit('任务已保存');
  });
  $('#noteForm').addEventListener('submit', event => {
    event.preventDefault(); const form = event.currentTarget; if (!form.reportValidity()) return; const title = form.elements.title.value.trim(), content = form.elements.content.value.trim(); if (!title || !content) return; const id = form.elements.id.value || uid(); const note = { id, title, content, date: selected() }; const index = state.notes.findIndex(n => n.id === id); if (index < 0) state.notes.push(note); else state.notes[index] = note; closeAll(); commit('笔记已保存');
  });
  $('#importFile').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      if (file.size > 10000000) throw new Error('备份文件过大，请使用 10MB 以内的 JSON 备份');
      const raw = JSON.parse(await file.text()); if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !Array.isArray(raw.completed) || !Array.isArray(raw.sleepRecords) || !Array.isArray(raw.exerciseRecords)) throw new Error('这不是工作台导出的备份文件');
      if (raw.version && ![1, 2].includes(raw.version)) throw new Error('备份版本暂不支持');
      pendingImport = normalize(raw); $('#importSummary').textContent = `备份包含 ${pendingImport.sleepRecords.length} 条睡眠、${pendingImport.exerciseRecords.length} 条运动、${pendingImport.notes.length} 篇笔记，累计专注 ${Math.floor(pendingImport.focus)} 分钟。`; openOverlay('importOverlay');
    } catch (error) { toast(error.message || '备份读取失败'); }
    event.target.value = '';
  });
  document.addEventListener('dragstart', event => { const task = event.target.closest('[data-drag-task]'); if (task) event.dataTransfer.setData('text/plain', task.dataset.dragTask); });
  document.addEventListener('dragover', event => { const bucket = event.target.closest('[data-bucket]'); if (bucket) { event.preventDefault(); bucket.classList.add('drag-over'); } });
  document.addEventListener('dragleave', event => event.target.closest('[data-bucket]')?.classList.remove('drag-over'));
  document.addEventListener('drop', event => { const bucket = event.target.closest('[data-bucket]'); if (!bucket) return; event.preventDefault(); const raw = event.dataTransfer.getData('text/plain'); if (!/^\d+$/.test(raw)) return; const task = state.tasks.find(t => t.id === number(raw)); if (task) { task.bucket = bucket.dataset.bucket; commit('任务分组已更新'); } });
  window.addEventListener('popstate', () => navigate(location.hash.slice(1), false));
  window.addEventListener('storage', event => { if (event.key !== KEY) return; try { state = normalize(JSON.parse(event.newValue || 'null')); render(); } catch {} });
  // All mutations save immediately. Avoid overwriting a newer backup or another
  // tab's state when this document is being unloaded.
  window.workbench = Object.freeze({ navigate, openRecord });
  setTab('sleep'); render(); if (!loadFailed) persist(); navigate(location.hash.slice(1) || 'home', false);
  if (loadFailed) toast('本地数据读取失败，原始内容已保留，请恢复备份');
  if (state.focusSession) openOverlay('focusOverlay');
  setInterval(updateFocus, 1000);
})();
