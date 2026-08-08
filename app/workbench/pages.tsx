"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { toLocalDate } from "./defaults";
import { useAppStore } from "./store";
import type { Branch, BranchStatus, RecordKind, Task, TaskBucket, Tone } from "./types";
import { Art, Card, EmptyState, Heatmap, Icon, LineChart, ProgressBar, ProgressRing, SectionTitle, TaskRow } from "./ui";

export type PageActions = {
  navigate: (path: string) => void;
  openRecord: (kind?: RecordKind) => void;
  startFocus: (taskId?: string, minutes?: number) => void;
  notify: (message: string, undo?: () => void) => void;
};

const sameDay = (iso: string, day: string) => iso.slice(0, 10) === day;
const formatDay = (date: string) => {
  const parsed = new Date(`${date}T12:00:00`);
  return `${String(parsed.getMonth() + 1).padStart(2, "0")}/${String(parsed.getDate()).padStart(2, "0")} 周${"日一二三四五六"[parsed.getDay()]}`;
};
const lastSevenDays = () => Array.from({ length: 7 }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() - (6 - index));
  return toLocalDate(date);
});
const percent = (value: number, total: number) => total ? Math.round((value / total) * 100) : 0;
const taskTone = (task: Task): Tone => task.branchId === "health" ? "green" : task.branchId === "career" ? "orange" : "purple";

function useTaskActions(notify: PageActions["notify"]) {
  const { setState } = useAppStore();
  const toggleTask = (id: string) => setState((current) => ({
    ...current,
    tasks: current.tasks.map((task) => task.id === id ? {
      ...task,
      status: task.status === "done" ? "todo" : "done",
      completedAt: task.status === "done" ? undefined : new Date().toISOString(),
    } : task),
  }));
  const editTask = (task: Task) => {
    const title = window.prompt("编辑任务名称", task.title)?.trim();
    if (!title) return;
    const minutes = Number(window.prompt("预计分钟数", String(task.estimatedMinutes)));
    setState((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, title, estimatedMinutes: Number.isFinite(minutes) && minutes > 0 ? minutes : item.estimatedMinutes } : item) }));
    notify("任务已更新");
  };
  const deleteTask = (task: Task) => {
    if (!window.confirm(`确定删除“${task.title}”吗？`)) return;
    setState((current) => ({ ...current, tasks: current.tasks.filter((item) => item.id !== task.id) }));
    notify("任务已删除", () => setState((current) => ({ ...current, tasks: [...current.tasks, task] })));
  };
  return { toggleTask, editTask, deleteTask };
}

function InlineTaskCreator({ branchId, projectId, bucket = "today", onCreated }: { branchId: string; projectId?: string; bucket?: TaskBucket; onCreated?: () => void }) {
  const { state, setState } = useAppStore();
  const [title, setTitle] = useState("");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = title.trim();
    if (!value) return;
    const task: Task = {
      id: crypto.randomUUID(), projectId, branchId, title: value, description: "新任务", status: "todo", priority: bucket === "today" ? 1 : bucket === "week" ? 2 : 3, bucket, estimatedMinutes: 25, actualMinutes: 0, scheduledAt: `${state.selectedDate}T20:00:00`,
    };
    setState((current) => ({ ...current, tasks: [...current.tasks, task] }));
    setTitle("");
    onCreated?.();
  };
  return <form className="inline-task-creator" onSubmit={submit}><label><span className="sr-only">新任务名称</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="添加一项新任务…" maxLength={48} /></label><button type="submit"><Icon name="plus" size={18} />添加</button></form>;
}

export function HomePage(actions: PageActions) {
  const { state } = useAppStore();
  const { toggleTask, editTask, deleteTask } = useTaskActions(actions.notify);
  const today = state.selectedDate;
  const todayTasks = state.tasks.filter((task) => sameDay(task.scheduledAt, today));
  const completed = todayTasks.filter((task) => task.status === "done").length;
  const exercise = state.exerciseRecords.filter((record) => sameDay(record.recordedAt, today)).reduce((sum, record) => sum + record.durationMinutes, 0);
  const sleep = state.sleepRecords.filter((record) => sameDay(record.recordedAt, today)).at(-1)?.durationMinutes ?? 0;
  const study = state.studyRecords.filter((record) => sameDay(record.recordedAt, today)).reduce((sum, record) => sum + record.durationMinutes, 0) + todayTasks.filter((task) => task.branchId === "learning").reduce((sum, task) => sum + task.actualMinutes, 0);
  const focus = state.focusSessions.filter((record) => sameDay(record.startedAt, today)).reduce((sum, record) => sum + record.durationSeconds, 0);
  const mainTask = todayTasks.find((task) => task.status === "todo") ?? todayTasks[0];
  const sleepTrend = lastSevenDays().map((day) => Math.round((state.sleepRecords.find((record) => sameDay(record.recordedAt, day))?.durationMinutes ?? 0) / 6) / 10);
  const modules = state.dashboard.order.filter((module) => !state.dashboard.hidden.includes(module));
  const renderModule = (name: string, content: React.ReactNode) => modules.includes(name) ? content : null;

  return <>
    <section className="home-greeting">
      <div><h2>早上好呀！ <span>☀</span></h2><p>愿你稳步向理想的自己靠近 ✦</p></div>
      <div className="weather"><Art name="12-sun-and-cloud.png" alt="晴间多云" /><strong>28°</strong><span>广州 多云</span></div>
      {state.theme.characterVisible && <Art name="03-rabbit-with-mug.png" alt="捧着杯子的兔子" className="greeting-rabbit" />}
    </section>

    {renderModule("quote", <Card className="quote-card"><span className="eyebrow">★ 今日一句</span><p>你未来的样子，<br />藏在你现在的选择里。</p>{state.theme.stickers && <Art name="09-tulip-daisy-cluster.png" alt="" />}</Card>)}

    {renderModule("overview", <section><SectionTitle icon="sparkles" title="今日概览" /><div className="overview-rings">
      <button type="button" onClick={() => actions.openRecord("exercise")}><ProgressRing value={exercise} goal={40} tone="green" label="运动" /><span>{exercise}/40 分钟</span></button>
      <button type="button" onClick={() => actions.openRecord("sleep")}><ProgressRing value={sleep} goal={480} tone="purple" label="睡眠" /><span>{(sleep / 60).toFixed(1)}/8 小时</span></button>
      <button type="button" onClick={() => actions.navigate("/learning")}><ProgressRing value={study} goal={60} tone="orange" label="学英语" /><span>{study}/60 分钟</span></button>
      <button type="button" onClick={() => document.getElementById("today-tasks")?.scrollIntoView({ behavior: "smooth" })}><ProgressRing value={completed} goal={Math.max(1, todayTasks.length)} tone="coral" label="习惯完成" /><span>{completed}/{todayTasks.length} 项</span></button>
    </div></section>)}

    {renderModule("main-task", <Card className="main-task-card"><SectionTitle icon="target" tone="coral" title="今日主任务" />
      {mainTask ? <><div className="main-task-copy"><div><h3>{mainTask.title} <small>{mainTask.estimatedMinutes}min</small></h3><p>{mainTask.description}</p><ProgressBar value={mainTask.actualMinutes} goal={mainTask.estimatedMinutes} tone="orange" /><span>{mainTask.actualMinutes}/{mainTask.estimatedMinutes} 分钟</span></div>{state.theme.characterVisible && <Art name="02-rabbit-reading.png" alt="读书的兔子" />}</div><button className="primary-button" type="button" onClick={() => actions.startFocus(mainTask.id, mainTask.estimatedMinutes)}><Icon name="play" size={20} />继续专注</button></> : <EmptyState icon="clipboard" title="今天还没有任务" text="添加第一项任务后就可以开始专注。" />}
    </Card>)}

    {renderModule("support", <section id="today-tasks"><SectionTitle icon="heart" tone="coral" title="今日支持任务" action="查看项目" onAction={() => actions.navigate("/projects/cet4")} />
      <Card className="task-list-card"><InlineTaskCreator branchId="learning" onCreated={() => actions.notify("任务已添加")} />{todayTasks.length ? todayTasks.map((task) => <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task.id)} onEdit={() => editTask(task)} onDelete={() => deleteTask(task)} />) : <EmptyState title="今天是一张白纸" text="添加一件想推进的小事吧。" />}</Card>
    </section>)}

    <div className="home-bottom-grid">
      {renderModule("trend", <Card className="trend-card"><SectionTitle icon="moon" tone="purple" title="本周睡眠趋势" action="洞察" onAction={() => actions.navigate("/insights")} /><LineChart values={sleepTrend} tone="purple" unit="h" /></Card>)}
      {renderModule("quick", <Card className="quick-card"><SectionTitle icon="lightbulb" title="快速记录" />
        <div className="quick-grid">{state.dashboard.quickRecords.map((kind) => {
          const meta: Record<RecordKind, [string, string, Tone]> = { exercise: ["运动", "shoe", "green"], sleep: ["睡眠", "moon", "purple"], finance: ["收支", "wallet", "orange"], idea: ["想法", "lightbulb", "coral"] };
          return <button type="button" key={kind} onClick={() => actions.openRecord(kind)}><Icon name={meta[kind][1]} tone={meta[kind][2]} />{meta[kind][0]}</button>;
        })}</div><p className="tiny-summary">今日专注 {Math.round(focus / 60)} 分钟</p>
      </Card>)}
    </div>
  </>;
}

const branchArt: Record<string, string> = { learning: "02-rabbit-reading.png", health: "06-rabbit-flower-notebook.png", career: "05-rabbit-heart-box.png" };
const statusLabel: Record<BranchStatus, string> = { priority: "重点推进", maintaining: "保持中的支线", slowed: "暂时放缓", archived: "已归档" };

export function BranchesPage(actions: PageActions) {
  const { state } = useAppStore();
  const [showSlowed, setShowSlowed] = useState(true);
  const progress = (branch: Branch) => {
    const tasks = state.tasks.filter((task) => task.branchId === branch.id);
    return { done: tasks.filter((task) => task.status === "done").length, total: tasks.length };
  };
  return <>
    <section className="branches-intro"><div><h2>我的支线 <span>✦</span></h2><label>当前阶段：<select value={state.user.currentStage} onChange={() => actions.navigate("/profile") }><option>{state.user.currentStage}</option></select></label></div><Art name="03-rabbit-with-mug.png" alt="喝咖啡的兔子" /></section>
    {(["priority", "maintaining"] as BranchStatus[]).map((status) => <section key={status}><SectionTitle icon={status === "priority" ? "target" : "heart"} tone={status === "priority" ? "orange" : "coral"} title={statusLabel[status]} action={status === "maintaining" ? "管理全部" : undefined} onAction={() => actions.notify("可以在支线详情中调整状态")} />
      <div className={status === "priority" ? "branch-stack" : "mini-branch-grid"}>{state.branches.filter((branch) => branch.status === status).map((branch) => {
        const stats = progress(branch); const value = percent(stats.done, stats.total);
        return status === "priority" ? <Card className="branch-card" key={branch.id}><button className="branch-card-main" type="button" onClick={() => actions.navigate(`/branches/${branch.id}`)}><span className={`branch-icon ${branch.tone}`}><Icon name={branch.icon} tone={branch.tone} size={42} /></span><span><strong>{branch.name}</strong><small>{branch.description}</small><em>Lv.{value ? Math.max(1, Math.ceil(value / 25)) : 0}　{value ? "推进中" : "待开始"}</em></span><ProgressRing value={stats.done} goal={Math.max(1, stats.total)} tone={branch.tone} label="本周进度" size={76} /></button><div className="branch-trend"><span>本周趋势</span><LineChart values={[0, 0, 0, 0, 0, 0, value]} tone={branch.tone} /></div><button className={`next-action ${branch.tone}`} type="button" onClick={() => branch.id === "learning" ? actions.navigate("/learning") : actions.openRecord(branch.id === "health" ? "exercise" : "finance")}>{branch.id === "learning" ? "背词汇 20min" : branch.id === "health" ? "记录一次运动" : "记录一笔收支"} ›</button>{branchArt[branch.id] && <Art name={branchArt[branch.id]} alt="" className="branch-watermark" />}</Card>
        : <button className="mini-branch" key={branch.id} type="button" onClick={() => actions.navigate(`/branches/${branch.id}`)}><Icon name={branch.icon} tone={branch.tone} /><strong>{branch.name}</strong><span>每周 {branch.weeklyFrequency} 天</span><ProgressBar value={stats.done} goal={Math.max(1, stats.total)} tone={branch.tone} /></button>;
      })}</div>
    </section>)}
    <section><div className="section-title"><h2><Icon name="neutral" tone="orange" />暂时放缓</h2><button type="button" onClick={() => setShowSlowed((value) => !value)}>{showSlowed ? "收起" : `查看全部（${state.branches.filter((branch) => branch.status === "slowed").length}）`}⌄</button></div>{showSlowed && <div className="slowed-list">{state.branches.filter((branch) => branch.status === "slowed").map((branch) => <button type="button" key={branch.id} onClick={() => actions.navigate(`/branches/${branch.id}`)}><Icon name={branch.icon} tone={branch.tone} />{branch.name}<span>待回归</span></button>)}</div>}</section>
  </>;
}

export function BranchDetailPage({ branchId, ...actions }: PageActions & { branchId: string }) {
  const { state, setState } = useAppStore();
  const branch = state.branches.find((item) => item.id === branchId) ?? state.branches[0];
  const tasks = state.tasks.filter((task) => task.branchId === branch.id);
  const { toggleTask, editTask, deleteTask } = useTaskActions(actions.notify);
  const updateStatus = (status: BranchStatus) => setState((current) => ({ ...current, branches: current.branches.map((item) => item.id === branch.id ? { ...item, status } : item) }));
  return <><Card className="detail-hero"><div><span className="eyebrow">{statusLabel[branch.status]}</span><h2>{branch.name}</h2><p>{branch.description}</p><label>支线状态<select value={branch.status} onChange={(event) => updateStatus(event.target.value as BranchStatus)}><option value="priority">重点推进</option><option value="maintaining">保持运行</option><option value="slowed">暂时放缓</option><option value="archived">归档</option></select></label></div><ProgressRing value={tasks.filter((task) => task.status === "done").length} goal={Math.max(1, tasks.length)} tone={branch.tone} label="任务进度" /><Art name={branchArt[branch.id] ?? "06-rabbit-flower-notebook.png"} alt="支线兔子" /></Card>
    <Card><SectionTitle icon="clipboard" tone={branch.tone} title="支线任务" /><InlineTaskCreator branchId={branch.id} onCreated={() => actions.notify("支线任务已添加")} />{tasks.length ? tasks.map((task) => <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task.id)} onEdit={() => editTask(task)} onDelete={() => deleteTask(task)} />) : <EmptyState title="这条支线还没有任务" text="添加一项可以在今天完成的小行动。" />}</Card>
    <button className="secondary-button full" type="button" onClick={() => updateStatus(branch.status === "archived" ? "maintaining" : "archived")}>{branch.status === "archived" ? "恢复支线" : "归档支线"}</button>
  </>;
}

function BucketColumn({ bucket, title, tone, tasks, actions }: { bucket: TaskBucket; title: string; tone: Tone; tasks: Task[]; actions: PageActions }) {
  const { setState } = useAppStore();
  const { toggleTask, editTask, deleteTask } = useTaskActions(actions.notify);
  const move = (task: Task, direction: -1 | 1) => {
    const buckets: TaskBucket[] = ["today", "week", "later"];
    const next = buckets[Math.max(0, Math.min(2, buckets.indexOf(task.bucket) + direction))];
    setState((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, bucket: next, priority: next === "today" ? 1 : next === "week" ? 2 : 3 } : item) }));
  };
  return <Card className={`bucket-column ${tone}`}><h3><Icon name={bucket === "today" ? "target" : bucket === "week" ? "trend" : "clock"} tone={tone} />{title}<span>{tasks.length}</span></h3><InlineTaskCreator branchId="learning" projectId="cet4" bucket={bucket} />{tasks.map((task) => <div className="bucket-task" key={task.id} draggable onDragStart={(event) => event.dataTransfer.setData("text/task", task.id)}><TaskRow task={task} compact onToggle={() => toggleTask(task.id)} onEdit={() => editTask(task)} /><div><button type="button" onClick={() => move(task, -1)} disabled={bucket === "today"} aria-label="向前移动">‹</button><button type="button" onClick={() => deleteTask(task)} aria-label="删除">×</button><button type="button" onClick={() => move(task, 1)} disabled={bucket === "later"} aria-label="向后移动">›</button></div></div>)}</Card>;
}

export function ProjectPage({ projectId, ...actions }: PageActions & { projectId: string }) {
  const { state, setState } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const project = state.projects.find((item) => item.id === projectId) ?? state.projects[0];
  const tasks = state.tasks.filter((task) => task.projectId === project.id);
  const done = tasks.filter((task) => task.status === "done").length;
  const daysLeft = Math.max(0, Math.ceil((new Date(`${project.deadline}T23:59:59`).getTime() - new Date(`${state.selectedDate}T00:00:00`).getTime()) / 86_400_000));
  const setProjectStatus = (status: "active" | "paused" | "archived") => setState((current) => ({ ...current, projects: current.projects.map((item) => item.id === project.id ? { ...item, status } : item) }));
  const editProject = () => {
    const title = window.prompt("项目名称", project.title)?.trim();
    if (!title) return;
    const deadline = window.prompt("截止日期（YYYY-MM-DD）", project.deadline) ?? project.deadline;
    setState((current) => ({ ...current, projects: current.projects.map((item) => item.id === project.id ? { ...item, title, deadline } : item) }));
    actions.notify("项目已更新");
  };
  const dropInto = (bucket: TaskBucket, event: React.DragEvent) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/task");
    setState((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === id ? { ...task, bucket } : task) }));
  };
  return <>
    <Card className="project-overview"><div><span className="eyebrow"><Icon name="book" tone="orange" size={18} /> {project.status === "active" ? "目标进行中" : project.status === "paused" ? "已暂停" : "已归档"}</span><h2>{project.title} ✦</h2><p>{project.description}</p></div><Art name="01-rabbit-writing.png" alt="写计划的兔子" /><div className="project-stats"><span><strong>{percent(done, tasks.length)}%</strong>总体进度</span><span><strong>{project.deadline}</strong>截止日期<br />还有 {daysLeft} 天</span><span><strong>{project.stage}</strong>当前阶段</span></div></Card>
    <Card className="week-roadmap"><SectionTitle icon="calendar" tone="coral" title="12 周计划进度" action="编辑项目" onAction={editProject} /><div>{Array.from({ length: 12 }, (_, index) => <span key={index} className={index === 0 ? "current" : ""}><i>{index === 0 && done ? "✓" : index + 1}</i>W{index + 1}</span>)}</div></Card>
    <div className="project-board">{(["today", "week", "later"] as TaskBucket[]).map((bucket) => <div key={bucket} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropInto(bucket, event)}><BucketColumn bucket={bucket} title={bucket === "today" ? "今日必须" : bucket === "week" ? "本周推进" : "可延后"} tone={bucket === "today" ? "coral" : bucket === "week" ? "purple" : "orange"} tasks={tasks.filter((task) => task.bucket === bucket)} actions={actions} /></div>)}</div>
    <Card><SectionTitle icon="clock" tone="orange" title="今日时间安排" /><div className="schedule-list">{tasks.filter((task) => sameDay(task.scheduledAt, state.selectedDate)).map((task) => <button key={task.id} type="button" onClick={() => actions.startFocus(task.id, task.estimatedMinutes)}><span>{task.scheduledAt.slice(11, 16)}</span><Icon name={task.branchId === "learning" ? "book" : "clipboard"} tone={taskTone(task)} /><strong>{task.title}</strong><em>{task.estimatedMinutes} 分钟</em>›</button>)}</div></Card>
    <Card className="key-result"><SectionTitle icon="star" tone="orange" title="本周关键结果" /><p>{done ? `已完成 ${done} 项任务，继续保持。` : "所有指标已清零，从完成第一项任务开始。"}</p><Art name="05-rabbit-heart-box.png" alt="抱着成果箱的兔子" /></Card>
    <div className="project-actions"><button className="primary-button" type="button" onClick={() => actions.startFocus(tasks.find((task) => task.status === "todo")?.id, tasks.find((task) => task.status === "todo")?.estimatedMinutes ?? 25)}><Icon name="play" size={20} />开始专注</button><button className="secondary-button" type="button" onClick={() => setMenuOpen((value) => !value)}><Icon name="more" size={20} />更多</button>{menuOpen && <div className="context-menu"><button type="button" onClick={editProject}>编辑项目</button><button type="button" onClick={() => setProjectStatus(project.status === "paused" ? "active" : "paused")}>{project.status === "paused" ? "恢复项目" : "暂停项目"}</button><button type="button" onClick={() => setProjectStatus("archived")}>归档项目</button><button type="button" className="danger" onClick={() => { if (window.confirm("删除项目将同时删除项目内任务，确定继续吗？")) { actions.notify("为保护数据，项目已改为归档状态"); setProjectStatus("archived"); } }}>删除项目</button></div>}</div>
  </>;
}

export function LearningPage(actions: PageActions) {
  const { state, setState } = useAppStore();
  const [category, setCategory] = useState<"english" | "reading" | "major">("english");
  const learningTasks = state.tasks.filter((task) => task.branchId === "learning");
  const shownTasks = category === "english" ? learningTasks : [];
  const done = learningTasks.filter((task) => task.status === "done").length;
  const todayStudy = state.studyRecords.filter((record) => sameDay(record.recordedAt, state.selectedDate) && record.category === category).reduce((sum, record) => sum + record.durationMinutes, 0);
  const days = lastSevenDays();
  const trend = days.map((day) => state.studyRecords.filter((record) => sameDay(record.recordedAt, day) && record.category === category).reduce((sum, record) => sum + record.durationMinutes, 0));
  const streak = (() => { let value = 0; for (let i = days.length - 1; i >= 0; i -= 1) { if (state.studyRecords.some((record) => sameDay(record.recordedAt, days[i]))) value += 1; else break; } return value; })();
  const { toggleTask, editTask, deleteTask } = useTaskActions(actions.notify);
  const addMinutes = () => setState((current) => ({ ...current, studyRecords: [...current.studyRecords, { id: crypto.randomUUID(), category, title: "自主学习", durationMinutes: 5, completed: true, mastery: 0, recordedAt: new Date().toISOString() }] }));
  const addNote = () => {
    const title = window.prompt("笔记标题")?.trim(); if (!title) return;
    const content = window.prompt("笔记内容")?.trim() ?? "";
    setState((current) => ({ ...current, notes: [{ id: crypto.randomUUID(), title, content, tags: [category], updatedAt: new Date().toISOString() }, ...current.notes] }));
    actions.notify("笔记已保存");
  };
  const advice = trend.every((value) => value === 0) ? "完成第一条学习记录后，我会根据你的真实节奏给出建议。" : trend.slice(-3).reduce((a, b) => a + b, 0) < 30 ? "最近三天学习时长较少，建议先完成一项 20 分钟的小任务。" : "最近学习节奏稳定，可以把重点任务安排在高效时段。";
  return <>
    <Card className="learning-goal"><span className="eyebrow">目标进行中</span><ProgressRing value={done} goal={Math.max(1, learningTasks.length)} tone="orange" label="完成进度" size={116} /><div><h2><Icon name="book" tone="purple" size={30} />四级核心词汇</h2><p>目标：掌握 2000 个高频词汇</p><button className="streak-button" type="button" onClick={() => actions.navigate("/learning/review")}>🔥 连续学习 {streak} 天 ›</button></div><button className="primary-button" type="button" onClick={() => actions.startFocus(shownTasks.find((task) => task.status === "todo")?.id, 25)}>继续学习</button><div className="learning-stats"><span>已学单词<strong>0 词</strong></span><span>掌握率<strong>{percent(done, learningTasks.length)}%</strong></span><span>距离考试<strong>还有 {Math.max(0, Math.ceil((new Date(state.projects[0].deadline).getTime() - new Date(`${state.selectedDate}T00:00:00`).getTime()) / 86_400_000))} 天</strong></span></div><Art name="02-rabbit-reading.png" alt="读书的兔子" /></Card>
    <div className="segmented-tabs" role="tablist">{(["english", "reading", "major"] as const).map((key) => <button role="tab" aria-selected={category === key} className={category === key ? "active" : ""} type="button" key={key} onClick={() => setCategory(key)}>{key === "english" ? "英语" : key === "reading" ? "阅读" : "专业"}</button>)}</div>
    <Card><SectionTitle icon="clipboard" tone="orange" title="今日学习计划" action="项目计划" onAction={() => actions.navigate("/projects/cet4")} />{shownTasks.length ? shownTasks.slice(0, 5).map((task) => <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task.id)} onEdit={() => editTask(task)} onDelete={() => deleteTask(task)} />) : <EmptyState icon="book" title="这个分类还没有计划" text="切换到英语，或添加一项新的学习任务。" />}</Card>
    <div className="learning-grid"><Card><SectionTitle icon="clock" tone="purple" title="本周学习时长" /><strong className="study-total">{todayStudy}<small> 分钟</small></strong><LineChart values={trend} tone="purple" unit="m" /><button className="secondary-button full" type="button" onClick={() => { addMinutes(); actions.notify("学习时长 +5 分钟"); }}>记录 5 分钟学习</button></Card><Card><SectionTitle icon="clipboard" tone="purple" title="最近笔记" action="新建" onAction={addNote} />{state.notes.length ? state.notes.slice(0, 3).map((note) => <button type="button" className="note-preview" key={note.id} onClick={() => actions.navigate(`/learning/notes/${note.id}`)}><strong>{note.title}</strong><span>{note.content || "点击补充内容"}</span></button>) : <EmptyState icon="pencil" title="还没有笔记" text="复习内容会出现在这里。" />}<button className="secondary-button full" type="button" onClick={() => actions.navigate("/learning/review")}>去复习</button></Card></div>
    <Card className="ai-advice"><div><SectionTitle icon="robot" tone="purple" title="AI 学习建议" /><p>{advice}</p></div><Art name="07-rabbit-moon-mug.png" alt="夜间学习的兔子" /></Card>
  </>;
}

export function LearningReviewPage(actions: PageActions) {
  const { state, setState } = useAppStore();
  const items = state.tasks.filter((task) => task.branchId === "learning");
  return <><Card><SectionTitle icon="refresh" tone="purple" title="学习复习列表" /><p className="muted-copy">掌握率从 0 开始，完成复习后会实时更新。</p>{items.map((task) => <div className="review-item" key={task.id}><Icon name="book" tone="purple" /><span><strong>{task.title}</strong><small>当前掌握率 {task.status === "done" ? 100 : 0}%</small></span><button type="button" onClick={() => { setState((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, status: "done", completedAt: new Date().toISOString() } : item) })); actions.notify("已标记为掌握"); }}>复习完成</button></div>)}</Card></>;
}

export function NotePage({ noteId, ...actions }: PageActions & { noteId: string }) {
  const { state, setState } = useAppStore();
  const note = state.notes.find((item) => item.id === noteId);
  const [title, setTitle] = useState(note?.title ?? "新笔记");
  const [content, setContent] = useState(note?.content ?? "");
  if (!note) return <Card><EmptyState icon="pencil" title="笔记不存在" text="返回学习页创建一条新笔记。" /><button className="primary-button full" type="button" onClick={() => actions.navigate("/learning")}>返回学习页</button></Card>;
  return <Card className="note-editor"><label>标题<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={60} /></label><label>内容<textarea value={content} onChange={(event) => setContent(event.target.value)} rows={12} /></label><div><button className="primary-button" type="button" onClick={() => { setState((current) => ({ ...current, notes: current.notes.map((item) => item.id === note.id ? { ...item, title: title.trim() || item.title, content, updatedAt: new Date().toISOString() } : item) })); actions.notify("笔记已保存"); }}>保存笔记</button><button className="secondary-button danger" type="button" onClick={() => { if (!window.confirm("确定删除这条笔记吗？")) return; setState((current) => ({ ...current, notes: current.notes.filter((item) => item.id !== note.id) })); actions.navigate("/learning"); }}>删除</button></div></Card>;
}

export function InsightsPage(actions: PageActions) {
  const { state, setState } = useAppStore();
  const [range, setRange] = useState<"week" | "month">("week");
  const days = lastSevenDays();
  const completed = state.tasks.filter((task) => task.status === "done" && task.completedAt && days.some((day) => sameDay(task.completedAt!, day))).length;
  const focusHours = state.focusSessions.filter((record) => days.some((day) => sameDay(record.startedAt, day))).reduce((sum, record) => sum + record.durationSeconds, 0) / 3600;
  const sleepValues = days.map((day) => Math.round((state.sleepRecords.find((record) => sameDay(record.recordedAt, day))?.durationMinutes ?? 0) / 6) / 10);
  const studyValues = days.map((day) => state.studyRecords.filter((record) => sameDay(record.recordedAt, day)).reduce((sum, record) => sum + record.durationMinutes, 0));
  const averageSleep = sleepValues.some(Boolean) ? sleepValues.reduce((a, b) => a + b, 0) / sleepValues.filter(Boolean).length : 0;
  const hasData = completed > 0 || focusHours > 0 || sleepValues.some(Boolean) || studyValues.some(Boolean);
  const heatRows = [
    { label: "运动", tone: "green" as Tone, values: days.map((day) => state.exerciseRecords.some((record) => sameDay(record.recordedAt, day)) ? 100 : 0) },
    { label: "早睡", tone: "purple" as Tone, values: days.map((day) => state.sleepRecords.some((record) => sameDay(record.recordedAt, day)) ? 100 : 0) },
    { label: "学英语", tone: "orange" as Tone, values: studyValues.map((value) => Math.min(100, Math.round((value / 60) * 100))) },
    { label: "习惯打卡", tone: "coral" as Tone, values: days.map((day) => state.tasks.some((task) => task.completedAt && sameDay(task.completedAt, day)) ? 100 : 0) },
  ];
  const insight = !hasData ? "还没有足够数据。完成任务、记录睡眠或开始专注后，这里会生成真实洞察。" : averageSleep < 7 && state.sleepRecords.length ? "最近的平均睡眠不足 7 小时，建议降低次日任务强度并优先恢复。" : studyValues.slice(-3).reduce((a, b) => a + b, 0) < 60 ? "最近三天学习时长较少，适合从一项短任务重新启动。" : "本周节奏稳定，继续保持当前任务量。";
  const updatePriority = (index: number, value: string) => setState((current) => ({ ...current, nextPriorities: current.nextPriorities.map((item, itemIndex) => itemIndex === index ? value : item) }));
  return <>
    <section className="insights-header"><div><h2>本周洞察 <span>✦</span></h2><p>{formatDay(days[0])} – {formatDay(days[6])}</p></div><Art name="04-rabbit-magnifying-flowers.png" alt="用放大镜观察的兔子" /><div className="range-switch"><button type="button" className={range === "week" ? "active" : ""} onClick={() => setRange("week")}>按周</button><button type="button" className={range === "month" ? "active" : ""} onClick={() => setRange("month")}>按月</button></div></section>
    <div className="stat-cards"><Card><Icon name="check_circle" tone="green" size={40} /><span>完成任务</span><strong>{completed}<small> 项</small></strong><p>较上周 +0</p></Card><Card><Icon name="clock" tone="orange" size={40} /><span>专注时长</span><strong>{focusHours.toFixed(1)}<small> h</small></strong><p>较上周 +0 h</p></Card><Card><Icon name="moon" tone="purple" size={40} /><span>睡眠平均</span><strong>{averageSleep.toFixed(1)}<small> h</small></strong><p>较上周 +0 h</p></Card></div>
    <Card><SectionTitle icon="sparkles" title="睡眠与学习趋势" /><div className="chart-legend"><span className="purple">睡眠时长（小时）</span><span className="orange">学习时长（分钟）</span></div><LineChart values={sleepValues} tone="purple" unit="h" onPoint={(index) => actions.notify(`${days[index]}：睡眠 ${sleepValues[index]} 小时`)} /><LineChart values={studyValues} tone="orange" unit="m" onPoint={(index) => actions.notify(`${days[index]}：学习 ${studyValues[index]} 分钟`)} /></Card>
    <Card><SectionTitle icon="heart" tone="coral" title="习惯完成热力图" /><Heatmap rows={heatRows} /></Card>
    <Card><SectionTitle icon="lightbulb" tone="orange" title="本周洞察" /><div className="insight-panels"><article><Art name="11-crescent-moon-sparkles.png" alt="月亮" /><p>{insight}</p></article><article><Art name="15-heart-medal-icon.png" alt="奖牌" /><p>{hasData ? "继续记录，高效时间段会逐渐清晰。" : "曲线和热力图已经清零，等待你的第一条记录。"}</p></article></div></Card>
    <Card className="priorities-card"><SectionTitle icon="sparkles" title="下周优先 3 件事" />{state.nextPriorities.map((item, index) => <label key={index}><span>{index + 1}</span><input value={item} onChange={(event) => updatePriority(index, event.target.value)} maxLength={42} /></label>)}<Art name="08-rabbit-plan-card-flowers.png" alt="拿着计划卡的兔子" /></Card>
  </>;
}

export function ProfilePage(actions: PageActions) {
  const { state, setState, exportData, importData, reset } = useAppStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const completed = state.tasks.filter((task) => task.status === "done").length;
  const editName = () => {
    const name = window.prompt("编辑用户名（2–12 个字符）", state.user.name)?.trim();
    if (!name) return;
    if (name.length < 2 || name.length > 12) return actions.notify("用户名需要 2–12 个字符");
    setState((current) => ({ ...current, user: { ...current.user, name } }));
    actions.notify("用户名已更新");
  };
  const uploadAvatar = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setState((current) => ({ ...current, user: { ...current.user, avatar: String(reader.result) } }));
    reader.readAsDataURL(file);
  };
  const importBackup = async (file?: File) => {
    if (!file || !window.confirm("导入备份将覆盖当前数据，确定继续吗？")) return;
    try { await importData(file); actions.notify("备份已恢复"); } catch (error) { actions.notify(error instanceof Error ? error.message : "导入失败"); }
    if (fileRef.current) fileRef.current.value = "";
  };
  const settings = [
    ["flower", "主题外观", "角色、色彩与背景", "/customize", "orange"],
    ["chart", "首页布局", "排序、隐藏与快速入口", "/layout-editor", "purple"],
    ["bell", "提醒与专注", state.settings.reminderEnabled ? `每天 ${state.settings.reminderTime}` : "尚未开启", "/settings/reminders", "orange"],
    ["shield", "数据与隐私", "本机保存，可随时导出", "/settings/privacy", "green"],
    ["clipboard", "每日复盘", "记录今天与明天", "/reviews/daily", "coral"],
    ["calendar", "每周复盘", "回顾本周节奏", "/reviews/weekly", "purple"],
  ] as const;
  return <>
    <Card className="profile-hero"><button className="avatar-button" type="button" onClick={() => avatarRef.current?.click()}><Image src={state.user.avatar} alt={`${state.user.name}的头像`} width={76} height={76} unoptimized /><span>更换头像</span></button><input ref={avatarRef} className="sr-only" type="file" accept="image/*" onChange={(event) => uploadAvatar(event.target.files?.[0])} /><div><span className="eyebrow">Lv.{state.user.level}</span><button className="name-button" type="button" onClick={editName}>{state.user.name} <Icon name="pencil" size={16} /></button><label>当前人生阶段<select value={state.user.currentStage} onChange={(event) => setState((current) => ({ ...current, user: { ...current.user, currentStage: event.target.value } }))}><option>备考期</option><option>成长探索期</option><option>事业冲刺期</option><option>休整恢复期</option></select></label></div><Art name="03-rabbit-with-mug.png" alt="兔子伙伴" /></Card>
    <Card className="milestone-card"><SectionTitle icon="star" tone="orange" title="本月里程碑" /><div><ProgressRing value={completed} goal={Math.max(1, state.tasks.length)} tone="coral" label="任务" /><p>已完成 {completed} 项任务<br />累计专注 {Math.round(state.focusSessions.reduce((sum, item) => sum + item.durationSeconds, 0) / 60)} 分钟</p></div><Art name="15-heart-medal-icon.png" alt="里程碑奖牌" /></Card>
    <div className="settings-list">{settings.map(([icon, title, description, href, tone]) => <button type="button" key={href} onClick={() => actions.navigate(href)}><Icon name={icon} tone={tone} /><span><strong>{title}</strong><small>{description}</small></span>›</button>)}</div>
    <Card><SectionTitle icon="download" tone="purple" title="数据备份" /><div className="backup-actions"><button className="secondary-button" type="button" onClick={() => { exportData(); actions.notify("数据已导出"); }}><Icon name="download" tone="purple" />导出 JSON</button><button className="secondary-button" type="button" onClick={() => fileRef.current?.click()}><Icon name="cloud_upload" tone="green" />恢复备份</button><input ref={fileRef} className="sr-only" type="file" accept="application/json" onChange={(event) => importBackup(event.target.files?.[0])} /></div></Card>
    <button className="danger-button full" type="button" onClick={() => { if (window.confirm("确定将所有进度、曲线和记录清零吗？此操作不可撤销。")) { reset(); actions.notify("所有数据已清零"); } }}><Icon name="refresh" tone="coral" />全部数据清零</button>
  </>;
}

export function CustomizePage(actions: PageActions) {
  const { state, setState } = useAppStore();
  const characters = ["rabbit", "cat", "bear", "frog"] as const;
  const update = <K extends keyof typeof state.theme>(key: K, value: typeof state.theme[K]) => setState((current) => ({ ...current, theme: { ...current.theme, [key]: value } }));
  return <><Card className="theme-preview" data-theme={state.theme.theme}><div><span className="eyebrow">实时预览</span><h2>{state.theme.theme === "warm" ? "暖橙花园" : state.theme.theme === "lavender" ? "薰衣草夜色" : "薄荷清晨"}</h2><p>装饰强度 {state.theme.intensity}%</p></div>{state.theme.characterVisible && <Image src={`/assets/illustrations/theme_${state.theme.character}.png`} alt="陪伴角色预览" width={125} height={130} unoptimized />}</Card>
    <Card className="control-card"><SectionTitle icon="flower" title="主题外观" /><label>主题<select value={state.theme.theme} onChange={(event) => update("theme", event.target.value as typeof state.theme.theme)}><option value="warm">暖橙花园</option><option value="lavender">薰衣草夜色</option><option value="mint">薄荷清晨</option></select></label><label>背景氛围强度<input type="range" min="0" max="100" value={state.theme.intensity} onChange={(event) => update("intensity", Number(event.target.value))} /></label><Toggle label="装饰贴纸" checked={state.theme.stickers} onChange={(value) => update("stickers", value)} /><Toggle label="背景纹理" checked={state.theme.texture} onChange={(value) => update("texture", value)} /><Toggle label="显示陪伴角色" checked={state.theme.characterVisible} onChange={(value) => update("characterVisible", value)} /></Card>
    <Card><SectionTitle icon="heart" tone="coral" title="陪伴角色" /><div className="character-grid">{characters.map((character) => <button className={state.theme.character === character ? "active" : ""} type="button" key={character} onClick={() => update("character", character)}><Image src={`/assets/illustrations/theme_${character}.png`} alt={character} width={70} height={70} unoptimized /><span>{character === "rabbit" ? "兔兔" : character === "cat" ? "小猫" : character === "bear" ? "小熊" : "青蛙"}</span></button>)}</div><label>出现频率<select value={state.theme.characterFrequency} onChange={(event) => update("characterFrequency", event.target.value as typeof state.theme.characterFrequency)}><option value="low">偶尔</option><option value="normal">适中</option><option value="high">经常</option></select></label></Card>
    <div className="form-actions"><button className="primary-button" type="button" onClick={() => actions.notify("主题设置已保存")}>保存主题</button><button className="secondary-button" type="button" onClick={() => setState((current) => ({ ...current, theme: { theme: "warm", intensity: 60, stickers: true, texture: true, character: "rabbit", characterVisible: true, characterFrequency: "normal" } }))}>恢复默认</button></div>
  </>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="toggle-row"><span>{label}</span><button className={checked ? "switch on" : "switch"} type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}><i /></button></label>;
}

export function LayoutEditorPage(actions: PageActions) {
  const { state, setState } = useAppStore();
  const names: Record<string, string> = { quote: "今日一句", overview: "今日概览", "main-task": "今日主任务", support: "支持任务", trend: "睡眠趋势", quick: "快速记录" };
  const move = (index: number, direction: -1 | 1) => setState((current) => {
    const order = [...current.dashboard.order]; const target = index + direction;
    if (target < 0 || target >= order.length) return current;
    [order[index], order[target]] = [order[target], order[index]];
    return { ...current, dashboard: { ...current.dashboard, order } };
  });
  const toggleHidden = (module: string) => setState((current) => ({ ...current, dashboard: { ...current.dashboard, hidden: current.dashboard.hidden.includes(module) ? current.dashboard.hidden.filter((item) => item !== module) : [...current.dashboard.hidden, module] } }));
  const togglePinned = (module: string) => setState((current) => ({ ...current, dashboard: { ...current.dashboard, pinned: current.dashboard.pinned.includes(module) ? current.dashboard.pinned.filter((item) => item !== module) : [...current.dashboard.pinned, module] } }));
  return <><Card><SectionTitle icon="chart" tone="purple" title="首页布局编辑" /><p className="muted-copy">调整顺序、显示状态和重点模块，首页会立即同步。</p><div className="layout-list">{state.dashboard.order.map((module, index) => <div key={module}><span className="drag-handle">☷</span><strong>{names[module]}</strong><button type="button" onClick={() => move(index, -1)} disabled={index === 0}>↑</button><button type="button" onClick={() => move(index, 1)} disabled={index === state.dashboard.order.length - 1}>↓</button><button type="button" className={state.dashboard.pinned.includes(module) ? "active" : ""} onClick={() => togglePinned(module)}>固定</button><button type="button" className={!state.dashboard.hidden.includes(module) ? "active" : ""} onClick={() => toggleHidden(module)}>{state.dashboard.hidden.includes(module) ? "显示" : "隐藏"}</button></div>)}</div></Card><Card><SectionTitle icon="plus" title="快速记录入口" /><div className="record-choice">{(["exercise", "sleep", "finance", "idea"] as RecordKind[]).map((kind) => <Toggle key={kind} label={kind === "exercise" ? "运动" : kind === "sleep" ? "睡眠" : kind === "finance" ? "收支" : "想法"} checked={state.dashboard.quickRecords.includes(kind)} onChange={(checked) => setState((current) => ({ ...current, dashboard: { ...current.dashboard, quickRecords: checked ? [...new Set([...current.dashboard.quickRecords, kind])] : current.dashboard.quickRecords.filter((item) => item !== kind) } }))} />)}</div></Card><div className="form-actions"><button className="primary-button" type="button" onClick={() => actions.notify("首页布局已保存")}>保存布局</button><button className="secondary-button" type="button" onClick={() => setState((current) => ({ ...current, dashboard: { order: ["quote", "overview", "main-task", "support", "trend", "quick"], hidden: [], pinned: ["main-task"], quickRecords: ["exercise", "sleep", "finance", "idea"] } }))}>恢复默认</button></div></>;
}

export function SettingsPage(actions: PageActions) {
  const entries = [["bell", "提醒与专注", "/settings/reminders", "orange"], ["shield", "数据与隐私", "/settings/privacy", "green"], ["flower", "主题外观", "/customize", "coral"], ["chart", "首页布局", "/layout-editor", "purple"]] as const;
  return <Card><SectionTitle icon="menu" title="设置" /><div className="settings-list">{entries.map(([icon, title, path, tone]) => <button type="button" key={path} onClick={() => actions.navigate(path)}><Icon name={icon} tone={tone} /><span><strong>{title}</strong><small>查看并编辑设置</small></span>›</button>)}</div></Card>;
}

export function ReminderSettingsPage(actions: PageActions) {
  const { state, setState } = useAppStore();
  return <Card className="control-card"><SectionTitle icon="bell" tone="orange" title="提醒与专注" /><Toggle label="开启每日提醒" checked={state.settings.reminderEnabled} onChange={(value) => setState((current) => ({ ...current, settings: { ...current.settings, reminderEnabled: value } }))} /><label>提醒时间<input type="time" value={state.settings.reminderTime} onChange={(event) => setState((current) => ({ ...current, settings: { ...current.settings, reminderTime: event.target.value } }))} /></label><label>提醒语气<select value={state.settings.reminderLevel} onChange={(event) => setState((current) => ({ ...current, settings: { ...current.settings, reminderLevel: event.target.value as typeof state.settings.reminderLevel } }))}><option value="gentle">轻柔</option><option value="normal">普通</option><option value="strong">强提醒</option></select></label><Toggle label="减少动画" checked={state.settings.reducedMotion} onChange={(value) => setState((current) => ({ ...current, settings: { ...current.settings, reducedMotion: value } }))} /><button className="primary-button full" type="button" onClick={() => actions.notify("提醒设置已保存")}>保存设置</button></Card>;
}

export function PrivacySettingsPage(actions: PageActions) {
  const { state, setState } = useAppStore();
  const update = (key: keyof typeof state.settings.privacy, value: boolean) => setState((current) => ({ ...current, settings: { ...current.settings, privacy: { ...current.settings.privacy, [key]: value } } }));
  return <><Card className="control-card"><SectionTitle icon="shield" tone="green" title="数据与隐私" /><p className="muted-copy">关闭后，相应数据会在首页隐藏，但本机记录不会删除。</p><Toggle label="显示收支数据" checked={state.settings.privacy.finance} onChange={(value) => update("finance", value)} /><Toggle label="显示睡眠数据" checked={state.settings.privacy.sleep} onChange={(value) => update("sleep", value)} /><Toggle label="显示学习数据" checked={state.settings.privacy.study} onChange={(value) => update("study", value)} /><button className="primary-button full" type="button" onClick={() => actions.notify("隐私设置已保存")}>保存设置</button></Card><Card><SectionTitle icon="lock" tone="purple" title="保存位置" /><p className="muted-copy">数据仅保存在当前浏览器的 localStorage 中。导出 JSON 后可在其他设备恢复。</p></Card></>;
}

export function ReviewPage({ kind, ...actions }: PageActions & { kind: "daily" | "weekly" }) {
  const { state, setState } = useAppStore();
  const existing = state.reviews.find((review) => review.kind === kind && review.date === state.selectedDate);
  const [good, setGood] = useState(existing?.good ?? "");
  const [problem, setProblem] = useState(existing?.problem ?? "");
  const [next, setNext] = useState(existing?.next ?? "");
  const done = state.tasks.filter((task) => task.status === "done").length;
  const focus = Math.round(state.focusSessions.reduce((sum, item) => sum + item.durationSeconds, 0) / 60);
  const save = () => {
    const review = { id: existing?.id ?? crypto.randomUUID(), kind, date: state.selectedDate, good, problem, next, updatedAt: new Date().toISOString() };
    setState((current) => ({ ...current, reviews: existing ? current.reviews.map((item) => item.id === existing.id ? review : item) : [...current.reviews, review] }));
    actions.notify(kind === "daily" ? "每日复盘已保存" : "每周复盘已保存");
  };
  return <><Card className="review-summary"><SectionTitle icon={kind === "daily" ? "sun_cloud" : "calendar"} tone="orange" title={kind === "daily" ? "每日复盘" : "每周复盘"} /><div><span>完成任务<strong>{done}</strong></span><span>专注时长<strong>{focus} 分钟</strong></span><span>学习记录<strong>{state.studyRecords.length}</strong></span><span>睡眠记录<strong>{state.sleepRecords.length}</strong></span></div></Card><Card className="review-form"><label>{kind === "daily" ? "今天做得好的事情" : "本周重点进展"}<textarea value={good} onChange={(event) => setGood(event.target.value)} rows={4} /></label><label>{kind === "daily" ? "今天遇到的问题" : "本周未完成事项"}<textarea value={problem} onChange={(event) => setProblem(event.target.value)} rows={4} /></label><label>{kind === "daily" ? "明天最重要的事情" : "下周重点"}<textarea value={next} onChange={(event) => setNext(event.target.value)} rows={4} /></label><div className="local-summary"><Icon name="robot" tone="purple" /><p>{done || focus ? `自动摘要：已完成 ${done} 项任务，累计专注 ${focus} 分钟。` : "自动摘要：当前数据已清零，完成第一项行动后会生成摘要。"}</p></div><button className="primary-button full" type="button" onClick={save}>保存复盘</button></Card></>;
}
