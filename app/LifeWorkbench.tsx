"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Screen = "home" | "branches" | "insight" | "profile" | "learning" | "project";
type RecordType = "exercise" | "sleep" | "income" | "thought";

type Todo = {
  id: string;
  title: string;
  done: boolean;
};

type AppData = {
  exerciseMinutes: number;
  sleepHours: number;
  studyMinutes: number;
  habitDone: number;
  income: number;
  thoughts: number;
  focusMinutes: number;
  weeklySleep: number[];
  weeklyStudy: number[];
  todos: Todo[];
  learningTasks: Todo[];
  projectTasks: Todo[];
  reminder: boolean;
};

const STORAGE_KEY = "life-workbench-functional-v1";
const A = "/assets/illustrations/";

const emptyData: AppData = {
  exerciseMinutes: 0,
  sleepHours: 0,
  studyMinutes: 0,
  habitDone: 0,
  income: 0,
  thoughts: 0,
  focusMinutes: 0,
  weeklySleep: [0, 0, 0, 0, 0, 0, 0],
  weeklyStudy: [0, 0, 0, 0, 0, 0, 0],
  todos: [],
  learningTasks: [],
  projectTasks: [],
  reminder: false,
};

const palette = {
  coral: "#ff8069",
  orange: "#f6a84c",
  green: "#8db45d",
  purple: "#8d78d8",
  pink: "#ef8489",
};

function iconSrc(name: string, tone: keyof typeof palette = "coral") {
  const resolved = tone === "pink" ? "coral" : tone;
  return `/assets/icon-preview/${name}_${resolved}.png`;
}

function Icon({ name, tone = "coral", size = 26 }: { name: string; tone?: keyof typeof palette; size?: number }) {
  return <img className="ui-icon" src={iconSrc(name, tone)} width={size} height={size} alt="" />;
}

function clampPercent(value: number, goal: number) {
  if (!goal) return 0;
  return Math.max(0, Math.min(100, Math.round((value / goal) * 100)));
}

function Ring({
  value,
  goal,
  tone,
  label,
}: {
  value: number;
  goal: number;
  tone: keyof typeof palette;
  label: string;
}) {
  const percent = clampPercent(value, goal);
  return (
    <div
      className="progress-ring"
      style={{
        background: `conic-gradient(${palette[tone]} ${percent * 3.6}deg, #f1ebe5 0deg)`,
      }}
      aria-label={`${label} ${percent}%`}
    >
      <div><strong>{percent}%</strong><span>{label}</span></div>
    </div>
  );
}

function ProgressBar({ value, goal, tone }: { value: number; goal: number; tone: keyof typeof palette }) {
  const percent = clampPercent(value, goal);
  return (
    <div className="progress-bar" aria-label={`进度 ${percent}%`}>
      <i style={{ width: `${percent}%`, background: palette[tone] }} />
    </div>
  );
}

function Header({
  title = "人生支线工作台",
  onMenu,
  onBack,
  onCalendar,
}: {
  title?: string;
  onMenu?: () => void;
  onBack?: () => void;
  onCalendar?: () => void;
}) {
  return (
    <>
      <div className="status-row"><span>9:41</span><span>▮▮▮　⌁　▰</span></div>
      <header className="app-header">
        <button className="round-button" onClick={onBack ?? onMenu} aria-label={onBack ? "返回" : "打开菜单"}>
          <Icon name={onBack ? "back" : "menu"} />
        </button>
        <h1>{title} <em>✦</em></h1>
        {onBack ? (
          <button className="round-button" onClick={() => window.scrollTo({ top: 0 })} aria-label="回到顶部">
            <Icon name="more" />
          </button>
        ) : (
          <button className="date-button" onClick={onCalendar}><Icon name="calendar" size={19} /> 今天</button>
        )}
      </header>
    </>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

function EmptyState({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="empty-state">
      <Icon name={icon} tone="purple" size={42} />
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function TodoList({
  items,
  onToggle,
  onDelete,
  emptyText,
}: {
  items: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  emptyText: string;
}) {
  if (!items.length) return <EmptyState icon="clipboard" title="还没有待办" text={emptyText} />;
  return (
    <div className="todo-list">
      {items.map((todo) => (
        <div className={`todo-row ${todo.done ? "done" : ""}`} key={todo.id}>
          <button className="todo-check" onClick={() => onToggle(todo.id)} aria-label={`${todo.done ? "取消完成" : "完成"} ${todo.title}`}>
            {todo.done ? "✓" : ""}
          </button>
          <span>{todo.title}</span>
          <button className="todo-delete" onClick={() => onDelete(todo.id)} aria-label={`删除 ${todo.title}`}>×</button>
        </div>
      ))}
    </div>
  );
}

function AddTodo({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (title: string) => void;
}) {
  const [title, setTitle] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const clean = title.trim();
    if (!clean) return;
    onAdd(clean);
    setTitle("");
  };
  return (
    <form className="add-todo" onSubmit={submit}>
      <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={placeholder} maxLength={40} />
      <button type="submit"><Icon name="plus" size={20} />添加</button>
    </form>
  );
}

function LineChart({
  values,
  max,
  tone,
  unit,
  editable = false,
  onChange,
}: {
  values: number[];
  max: number;
  tone: keyof typeof palette;
  unit: string;
  editable?: boolean;
  onChange?: (values: number[]) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const days = ["一", "二", "三", "四", "五", "六", "日"];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => {
      const width = canvas.clientWidth || 320;
      const height = 165;
      const ratio = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(ratio, ratio);
      ctx.clearRect(0, 0, width, height);
      const left = 25;
      const right = width - 12;
      const top = 14;
      const bottom = 136;
      ctx.font = "10px sans-serif";
      ctx.fillStyle = "#968983";
      ctx.strokeStyle = "#ece5df";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i += 1) {
        const y = top + ((bottom - top) / 4) * i;
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.stroke();
        ctx.fillText(`${Math.round(max - (max / 4) * i)}${unit}`, 0, y + 3);
      }
      const xStep = (right - left) / 6;
      const points = values.map((value, index) => ({
        x: left + xStep * index,
        y: bottom - (Math.min(max, value) / max) * (bottom - top),
      }));
      ctx.strokeStyle = palette[tone];
      ctx.lineWidth = 3;
      ctx.beginPath();
      points.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
      points.forEach((point) => {
        ctx.beginPath();
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = palette[tone];
        ctx.lineWidth = 3;
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      days.forEach((day, index) => {
        ctx.fillStyle = "#84766f";
        ctx.fillText(day, left + xStep * index - 3, 158);
      });
    };
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [values, max, tone, unit]);

  return (
    <div className="line-chart">
      <canvas ref={canvasRef} aria-label="可交互折线图" />
      {editable && onChange && (
        <div className="chart-controls">
          {values.map((value, index) => (
            <label key={days[index]}>
              <span>周{days[index]} {value}{unit}</span>
              <input
                type="range"
                min="0"
                max={max}
                step={unit === "h" ? "0.5" : "5"}
                value={value}
                onChange={(event) => {
                  const next = [...values];
                  next[index] = Number(event.target.value);
                  onChange(next);
                }}
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function HomePage({
  data,
  setData,
  go,
  openRecord,
  action,
}: {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  go: (screen: Screen) => void;
  openRecord: () => void;
  action: (message: string) => void;
}) {
  const completed = data.todos.filter((todo) => todo.done).length;
  const addTodo = (title: string) => {
    setData((current) => ({ ...current, todos: [...current.todos, { id: crypto.randomUUID(), title, done: false }] }));
    action("待办已添加");
  };
  const toggleTodo = (id: string) => setData((current) => ({
    ...current,
    todos: current.todos.map((todo) => todo.id === id ? { ...todo, done: !todo.done } : todo),
  }));
  const deleteTodo = (id: string) => setData((current) => ({ ...current, todos: current.todos.filter((todo) => todo.id !== id) }));
  return (
    <>
      <section className="hero home-hero">
        <div><span className="eyebrow">今天，从 0 开始</span><h2>早上好呀！☀️</h2><p>每一次真实记录，都会让理想更近一点。</p></div>
        <img src={`${A}rabbit_morning_cup_scene.png`} alt="小兔端着咖啡" />
      </section>

      <div className="section-heading"><h2>今日概览</h2><button onClick={openRecord}>快速记录 ›</button></div>
      <div className="metrics-grid">
        <button className="metric-card" onClick={openRecord}><Ring value={data.exerciseMinutes} goal={40} tone="green" label="运动" /><span>{data.exerciseMinutes}/40 分钟</span></button>
        <button className="metric-card" onClick={openRecord}><Ring value={data.sleepHours} goal={8} tone="purple" label="睡眠" /><span>{data.sleepHours}/8 小时</span></button>
        <button className="metric-card" onClick={() => go("learning")}><Ring value={data.studyMinutes} goal={60} tone="orange" label="学习" /><span>{data.studyMinutes}/60 分钟</span></button>
        <button className="metric-card" onClick={() => action("习惯列表已打开")}><Ring value={completed} goal={Math.max(1, data.todos.length)} tone="pink" label="待办" /><span>{completed}/{data.todos.length} 已完成</span></button>
      </div>

      <Card className="todo-card">
        <div className="card-title"><h2><Icon name="clipboard" tone="orange" />今日待办</h2><span>{completed}/{data.todos.length}</span></div>
        <AddTodo placeholder="添加一件要做的事…" onAdd={addTodo} />
        <TodoList items={data.todos} onToggle={toggleTodo} onDelete={deleteTodo} emptyText="在上方输入内容，就可以添加第一条待办。" />
      </Card>

      <Card className="focus-card">
        <div><span className="eyebrow coral">今日主任务</span><h2>{data.todos.find((todo) => !todo.done)?.title ?? "还没有主任务"}</h2><p>先添加待办，再开始一次专注。</p><ProgressBar value={data.focusMinutes} goal={30} tone="orange" /></div>
        <img src={`${A}rabbit_reading_task.png`} alt="阅读的小兔" />
        <button onClick={() => {
          if (!data.todos.length) return action("请先添加一条待办");
          setData((current) => ({ ...current, focusMinutes: current.focusMinutes + 5 }));
          action("专注 +5 分钟");
        }}><Icon name="play" size={20} />开始专注</button>
      </Card>

      <div className="two-column">
        <Card>
          <div className="card-title"><h2><Icon name="moon" tone="purple" />睡眠趋势</h2><button onClick={() => go("insight")}>编辑 ›</button></div>
          <LineChart values={data.weeklySleep} max={10} tone="purple" unit="h" />
        </Card>
        <Card className="quick-actions">
          <div className="card-title"><h2>快速记录</h2></div>
          <button onClick={openRecord}><Icon name="shoe" tone="green" />运动</button>
          <button onClick={openRecord}><Icon name="moon" tone="purple" />睡眠</button>
          <button onClick={openRecord}><Icon name="wallet" tone="orange" />收支</button>
          <button onClick={openRecord}><Icon name="lightbulb" tone="pink" />想法</button>
        </Card>
      </div>
    </>
  );
}

function BranchesPage({ data, go, action }: { data: AppData; go: (screen: Screen) => void; action: (message: string) => void }) {
  const branches = [
    { title: "学习成长", text: "从第一分钟学习开始", icon: "book", tone: "purple" as const, value: data.studyMinutes, goal: 60, next: "去学习", click: () => go("learning"), image: "rabbit_learning_header.png" },
    { title: "身体健康", text: "从第一分钟运动开始", icon: "shoe", tone: "green" as const, value: data.exerciseMinutes, goal: 40, next: "记录运动", click: () => action("请使用中间的快速记录按钮"), image: "rabbit_alarm_flowers.png" },
    { title: "事业与收入", text: "从第一笔记录开始", icon: "wallet", tone: "orange" as const, value: data.income, goal: 1000, next: "记录收入", click: () => action("请使用中间的快速记录按钮"), image: "rabbit_suitcase_flowers.png" },
  ];
  return (
    <>
      <section className="hero compact-hero">
        <div><span className="eyebrow">我的支线</span><h2>所有进度都是 0</h2><p>记录后，支线会自动生长。</p></div>
        <img src={`${A}rabbit_branches_cup.png`} alt="支线小兔" />
      </section>
      <div className="branch-stack">
        {branches.map((branch) => (
          <Card className="branch-card" key={branch.title}>
            <div className="branch-main">
              <div className={`large-icon ${branch.tone}`}><Icon name={branch.icon} tone={branch.tone} size={48} /></div>
              <div><h2>{branch.title}</h2><p>{branch.text}</p><strong>{branch.value} / {branch.goal}</strong></div>
              <Ring value={branch.value} goal={branch.goal} tone={branch.tone} label="进度" />
            </div>
            <ProgressBar value={branch.value} goal={branch.goal} tone={branch.tone} />
            <div className="branch-footer"><span>本周从 0 开始</span><button onClick={branch.click}>{branch.next} ›</button></div>
          </Card>
        ))}
      </div>
    </>
  );
}

function InsightPage({ data, setData }: { data: AppData; setData: React.Dispatch<React.SetStateAction<AppData>> }) {
  const completed = data.todos.filter((todo) => todo.done).length;
  return (
    <>
      <section className="hero compact-hero">
        <div><span className="eyebrow">本周洞察</span><h2>数据会从这里长出来</h2><p>拖动下方滑杆，折线图会实时变化。</p></div>
        <img src={`${A}rabbit_magnifier_flowers.png`} alt="观察数据的小兔" />
      </section>
      <div className="stat-grid">
        <Card><Icon name="check_circle" tone="green" /><span>完成待办</span><strong>{completed}</strong></Card>
        <Card><Icon name="clock" tone="orange" /><span>专注时长</span><strong>{data.focusMinutes}<small>min</small></strong></Card>
        <Card><Icon name="moon" tone="purple" /><span>睡眠记录</span><strong>{data.sleepHours}<small>h</small></strong></Card>
      </div>
      <Card>
        <div className="card-title"><h2>睡眠折线</h2><span>可调节</span></div>
        <LineChart values={data.weeklySleep} max={10} tone="purple" unit="h" editable onChange={(values) => setData((current) => ({ ...current, weeklySleep: values }))} />
      </Card>
      <Card>
        <div className="card-title"><h2>学习折线</h2><span>可调节</span></div>
        <LineChart values={data.weeklyStudy} max={120} tone="orange" unit="m" editable onChange={(values) => setData((current) => ({ ...current, weeklyStudy: values }))} />
      </Card>
      <Card>
        <div className="card-title"><h2>实时洞察</h2></div>
        {data.weeklySleep.every((value) => value === 0) && data.weeklyStudy.every((value) => value === 0) ? (
          <EmptyState icon="lightbulb" title="还没有足够数据" text="记录睡眠或学习后，这里会生成洞察。" />
        ) : (
          <p className="insight-copy">当前平均睡眠 {(data.weeklySleep.reduce((a, b) => a + b, 0) / 7).toFixed(1)} 小时，平均学习 {Math.round(data.weeklyStudy.reduce((a, b) => a + b, 0) / 7)} 分钟。</p>
        )}
      </Card>
    </>
  );
}

function LearningPage({ data, setData, action, go }: { data: AppData; setData: React.Dispatch<React.SetStateAction<AppData>>; action: (message: string) => void; go: (screen: Screen) => void }) {
  const addTask = (title: string) => setData((current) => ({ ...current, learningTasks: [...current.learningTasks, { id: crypto.randomUUID(), title, done: false }] }));
  const toggle = (id: string) => setData((current) => ({ ...current, learningTasks: current.learningTasks.map((task) => task.id === id ? { ...task, done: !task.done } : task) }));
  const remove = (id: string) => setData((current) => ({ ...current, learningTasks: current.learningTasks.filter((task) => task.id !== id) }));
  const done = data.learningTasks.filter((task) => task.done).length;
  return (
    <>
      <Card className="learning-hero">
        <Ring value={done} goal={Math.max(1, data.learningTasks.length)} tone="orange" label="学习计划" />
        <div><span className="eyebrow">学习成长</span><h2>从 0 项计划开始</h2><p>添加你真正想完成的学习任务。</p><button onClick={() => go("project")}>打开项目计划 ›</button></div>
        <img src={`${A}rabbit_learning_header.png`} alt="学习的小兔" />
      </Card>
      <Card>
        <div className="card-title"><h2><Icon name="clipboard" tone="orange" />学习待办</h2><span>{done}/{data.learningTasks.length}</span></div>
        <AddTodo placeholder="例如：背单词 20 个" onAdd={(title) => { addTask(title); action("学习任务已添加"); }} />
        <TodoList items={data.learningTasks} onToggle={toggle} onDelete={remove} emptyText="添加第一项学习任务，进度会自动计算。" />
      </Card>
      <Card className="study-counter">
        <div><h2>今日学习时长</h2><strong>{data.studyMinutes}<small>分钟</small></strong><ProgressBar value={data.studyMinutes} goal={60} tone="purple" /></div>
        <button onClick={() => { setData((current) => ({ ...current, studyMinutes: current.studyMinutes + 5 })); action("学习 +5 分钟"); }}>+5 分钟</button>
      </Card>
      <Card>
        <div className="card-title"><h2>本周学习折线</h2></div>
        <LineChart values={data.weeklyStudy} max={120} tone="purple" unit="m" editable onChange={(values) => setData((current) => ({ ...current, weeklyStudy: values }))} />
      </Card>
    </>
  );
}

function ProjectPage({ data, setData, action }: { data: AppData; setData: React.Dispatch<React.SetStateAction<AppData>>; action: (message: string) => void }) {
  const addTask = (title: string) => setData((current) => ({ ...current, projectTasks: [...current.projectTasks, { id: crypto.randomUUID(), title, done: false }] }));
  const toggle = (id: string) => setData((current) => ({ ...current, projectTasks: current.projectTasks.map((task) => task.id === id ? { ...task, done: !task.done } : task) }));
  const remove = (id: string) => setData((current) => ({ ...current, projectTasks: current.projectTasks.filter((task) => task.id !== id) }));
  const done = data.projectTasks.filter((task) => task.done).length;
  return (
    <>
      <section className="hero project-hero">
        <div><span className="eyebrow">项目计划</span><h2>新项目，从 0 开始</h2><p>添加任务后自动生成项目进度。</p></div>
        <Ring value={done} goal={Math.max(1, data.projectTasks.length)} tone="orange" label="项目进度" />
        <img src={`${A}rabbit_project_study.png`} alt="项目学习小兔" />
      </section>
      <Card>
        <div className="card-title"><h2><Icon name="target" tone="coral" />项目待办</h2><span>{done}/{data.projectTasks.length}</span></div>
        <AddTodo placeholder="添加项目任务…" onAdd={(title) => { addTask(title); action("项目任务已添加"); }} />
        <TodoList items={data.projectTasks} onToggle={toggle} onDelete={remove} emptyText="添加第一项项目任务，就可以开始推进。" />
      </Card>
      <Card className="focus-session">
        <img src={`${A}rabbit_suitcase_flowers.png`} alt="成果小兔" />
        <div><h2>专注推进</h2><strong>{data.focusMinutes} 分钟</strong><p>每次点击增加 5 分钟。</p></div>
        <button onClick={() => { setData((current) => ({ ...current, focusMinutes: current.focusMinutes + 5 })); action("专注 +5 分钟"); }}><Icon name="play" size={20} />开始</button>
      </Card>
    </>
  );
}

function ProfilePage({ data, setData, action, onReset }: { data: AppData; setData: React.Dispatch<React.SetStateAction<AppData>>; action: (message: string) => void; onReset: () => void }) {
  return (
    <>
      <Card className="profile-card">
        <img src={`${A}profile_avatar.png`} alt="小兔头像" />
        <div><span className="eyebrow">Lv.0</span><h2>小兔软糖</h2><p>一切数据都从 0 开始记录。</p></div>
        <img className="profile-scene" src={`${A}rabbit_profile_cup.png`} alt="小兔喝咖啡" />
      </Card>
      <div className="settings-list">
        <Card>
          <div className="setting-row"><Icon name="bell" tone="orange" /><div><h2>每日提醒</h2><p>{data.reminder ? "已开启" : "已关闭"}</p></div><button className={`switch ${data.reminder ? "on" : ""}`} onClick={() => setData((current) => ({ ...current, reminder: !current.reminder }))}><i /></button></div>
        </Card>
        <Card>
          <div className="setting-row"><Icon name="flower" tone="orange" /><div><h2>主题外观</h2><p>花园兔兔</p></div><button onClick={() => action("主题选择器已打开")}>›</button></div>
        </Card>
        <Card>
          <div className="setting-row"><Icon name="download" tone="purple" /><div><h2>导出数据</h2><p>当前数据保存在本机</p></div><button onClick={() => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "life-workbench-data.json";
            link.click();
            URL.revokeObjectURL(url);
            action("数据已导出");
          }}>导出</button></div>
        </Card>
        <Card className="danger-card">
          <div className="setting-row"><Icon name="refresh" tone="coral" /><div><h2>全部数据清零</h2><p>待办、进度和折线图都会归零</p></div><button onClick={onReset}>清零</button></div>
        </Card>
      </div>
    </>
  );
}

function BottomNav({ screen, go, openRecord }: { screen: Screen; go: (screen: Screen) => void; openRecord: () => void }) {
  const items: [Screen, string, string][] = [["home", "home", "首页"], ["branches", "puzzle", "支线"], ["insight", "chart", "洞察"], ["profile", "user", "我的"]];
  return (
    <nav className="bottom-nav">
      {items.slice(0, 2).map(([target, icon, label]) => <button className={screen === target ? "active" : ""} key={target} onClick={() => go(target)}><Icon name={icon} /><span>{label}</span></button>)}
      <button className="nav-add" onClick={openRecord} aria-label="快速记录"><Icon name="plus" size={36} /></button>
      {items.slice(2).map(([target, icon, label]) => <button className={screen === target ? "active" : ""} key={target} onClick={() => go(target)}><Icon name={icon} /><span>{label}</span></button>)}
    </nav>
  );
}

function QuickRecord({
  close,
  data,
  setData,
  action,
}: {
  close: () => void;
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  action: (message: string) => void;
}) {
  const [type, setType] = useState<RecordType>("exercise");
  const [number, setNumber] = useState("");
  const [text, setText] = useState("");
  const config = {
    exercise: { label: "运动", icon: "shoe", unit: "分钟", tone: "green" as const },
    sleep: { label: "睡眠", icon: "moon", unit: "小时", tone: "purple" as const },
    income: { label: "收入", icon: "wallet", unit: "元", tone: "orange" as const },
    thought: { label: "想法", icon: "lightbulb", unit: "", tone: "pink" as const },
  };
  const save = () => {
    if (type === "thought") {
      if (!text.trim()) return action("请写下一条想法");
      setData((current) => ({ ...current, thoughts: current.thoughts + 1 }));
    } else {
      const value = Number(number);
      if (!Number.isFinite(value) || value <= 0) return action("请输入大于 0 的数值");
      setData((current) => ({
        ...current,
        exerciseMinutes: type === "exercise" ? current.exerciseMinutes + value : current.exerciseMinutes,
        sleepHours: type === "sleep" ? value : current.sleepHours,
        income: type === "income" ? current.income + value : current.income,
      }));
    }
    action(`${config[type].label}记录已保存`);
    close();
  };
  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label="快速记录">
      <button className="modal-dismiss" onClick={close} aria-label="关闭快速记录" />
      <section className="record-sheet">
        <div className="sheet-handle" />
        <button className="sheet-close" onClick={close}>×</button>
        <div className="record-title"><img src={`${A}rabbit_quick_note.png`} alt="记录的小兔" /><div><h2>快速记录</h2><p>所有数据会真实更新到首页和图表。</p></div></div>
        <div className="record-tabs">
          {(Object.keys(config) as RecordType[]).map((key) => <button className={type === key ? "active" : ""} key={key} onClick={() => { setType(key); setNumber(""); setText(""); }}><Icon name={config[key].icon} tone={config[key].tone} />{config[key].label}</button>)}
        </div>
        <Card className="record-form">
          <Icon name={config[type].icon} tone={config[type].tone} size={52} />
          <h2>记录{config[type].label}</h2>
          {type === "thought" ? (
            <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="写下此刻的想法…" maxLength={200} />
          ) : (
            <label><span>{config[type].label}数值</span><div><input type="number" min="0" step={type === "sleep" ? "0.5" : "1"} value={number} onChange={(event) => setNumber(event.target.value)} placeholder="0" /><em>{config[type].unit}</em></div></label>
          )}
        </Card>
        <button className="save-button" onClick={save}>保存记录</button>
        <p className="current-value">当前：运动 {data.exerciseMinutes} 分钟 · 睡眠 {data.sleepHours} 小时 · 收入 ¥{data.income}</p>
      </section>
    </div>
  );
}

export function LifeWorkbench() {
  const [screen, setScreen] = useState<Screen>("home");
  const [data, setData] = useState<AppData>(emptyData);
  const [hydrated, setHydrated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setData({ ...emptyData, ...JSON.parse(saved) });
    } catch {
      setData(emptyData);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, hydrated]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const go = (next: Screen) => {
    setScreen(next);
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  };
  const resetAll = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(emptyData);
    setToast("全部数据已清零");
  };
  const mainScreen = ["home", "branches", "insight", "profile"].includes(screen);
  const title = screen === "learning" ? "学习成长" : screen === "project" ? "项目计划" : "人生支线工作台";

  const content = useMemo(() => {
    if (screen === "home") return <HomePage data={data} setData={setData} go={go} openRecord={() => setRecordOpen(true)} action={setToast} />;
    if (screen === "branches") return <BranchesPage data={data} go={go} action={setToast} />;
    if (screen === "insight") return <InsightPage data={data} setData={setData} />;
    if (screen === "profile") return <ProfilePage data={data} setData={setData} action={setToast} onReset={resetAll} />;
    if (screen === "learning") return <LearningPage data={data} setData={setData} action={setToast} go={go} />;
    return <ProjectPage data={data} setData={setData} action={setToast} />;
  }, [screen, data]);

  return (
    <main className="app-shell">
      <Header title={title} onMenu={() => setMenuOpen(true)} onBack={mainScreen ? undefined : () => go(screen === "project" ? "learning" : "home")} onCalendar={() => setCalendarOpen(true)} />
      <div className="page">{content}</div>
      {mainScreen && <BottomNav screen={screen} go={go} openRecord={() => setRecordOpen(true)} />}
      {recordOpen && <QuickRecord close={() => setRecordOpen(false)} data={data} setData={setData} action={setToast} />}

      {menuOpen && (
        <div className="modal-layer menu-layer" role="dialog" aria-modal="true" aria-label="页面菜单">
          <button className="modal-dismiss" onClick={() => setMenuOpen(false)} />
          <aside className="drawer">
            <h2>人生支线工作台 ✦</h2>
            {[["home", "首页"], ["branches", "我的支线"], ["insight", "数据洞察"], ["learning", "学习成长"], ["project", "项目计划"], ["profile", "我的设置"]].map(([target, label]) => <button key={target} onClick={() => go(target as Screen)}>{label}<span>›</span></button>)}
            <button className="drawer-close" onClick={() => setMenuOpen(false)}>关闭</button>
          </aside>
        </div>
      )}

      {calendarOpen && (
        <div className="modal-layer calendar-layer" role="dialog" aria-modal="true" aria-label="选择日期">
          <button className="modal-dismiss" onClick={() => setCalendarOpen(false)} />
          <section className="calendar-dialog">
            <h2>选择日期</h2>
            <div>{["一", "二", "三", "四", "五", "六", "日", ...Array.from({ length: 31 }, (_, i) => `${i + 1}`)].map((day, index) => <button className={day === "27" ? "selected" : ""} key={`${day}-${index}`} onClick={() => { setCalendarOpen(false); setToast(`已选择 07/${day}`); }}>{day}</button>)}</div>
            <button className="calendar-cancel" onClick={() => setCalendarOpen(false)}>取消</button>
          </section>
        </div>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
