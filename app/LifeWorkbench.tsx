"use client";

import { useEffect, useMemo, useState } from "react";

type Screen = "home" | "branches" | "insight" | "profile" | "learning" | "project";
type Modal = null | "record" | "menu" | "detail" | "calendar";

const A = "/assets/illustrations/";
const I = "/assets/icons/";

function Icon({ name, tone = "coral", size = 24 }: { name: string; tone?: string; size?: number }) {
  const palette = ["coral", "green", "orange", "purple"];
  const previewTone = tone === "pink" ? "coral" : tone;
  const src = palette.includes(previewTone)
    ? `/assets/icon-preview/${name}_${previewTone}.png`
    : `${I}${name}.svg`;
  return <img className={`icon icon-${tone}`} src={src} width={size} height={size} alt="" />;
}

function StatusBar() {
  return (
    <div className="status-bar" aria-label="状态栏">
      <span>9:41</span>
      <span className="status-icons">▮▮▮　⌁　▰</span>
    </div>
  );
}

function Header({
  title = "人生支线工作台",
  back,
  onMenu,
  onBack,
  onCalendar,
  centered = false,
}: {
  title?: string;
  back?: boolean;
  onMenu?: () => void;
  onBack?: () => void;
  onCalendar?: () => void;
  centered?: boolean;
}) {
  return (
    <header className={`topbar ${centered ? "centered" : ""}`}>
      <button className="round-btn" onClick={back ? onBack : onMenu} aria-label={back ? "返回" : "打开菜单"}>
        <Icon name={back ? "back" : "menu"} tone="brown" size={25} />
      </button>
      <h1>{title} <span className="spark">✦</span></h1>
      {back ? (
        <button className="round-btn" aria-label="更多操作" onClick={() => onCalendar?.()}>
          <Icon name="more" tone="brown" size={23} />
        </button>
      ) : (
        <button className="date-pill" onClick={onCalendar} aria-label="选择日期">
          <Icon name="calendar" tone="brown" size={18} /> 07/27 周日
        </button>
      )}
    </header>
  );
}

function Card({ className = "", children, onClick }: { className?: string; children: React.ReactNode; onClick?: () => void }) {
  const body = <>{children}</>;
  return onClick ? (
    <button className={`card button-card ${className}`} onClick={onClick}>{body}</button>
  ) : (
    <section className={`card ${className}`}>{body}</section>
  );
}

function Progress({ value, tone = "coral" }: { value: number; tone?: string }) {
  return <div className="progress"><i className={`fill ${tone}`} style={{ width: `${value}%` }} /></div>;
}

function Ring({ value, tone = "coral", label }: { value: number; tone?: string; label?: string }) {
  return (
    <div className={`ring ring-${tone}`} style={{ "--p": `${value * 3.6}deg` } as React.CSSProperties}>
      <div><b>{value}%</b>{label && <small>{label}</small>}</div>
    </div>
  );
}

function MiniLine({ color = "#8d78d8", points = "8,36 42,29 76,29 110,18 144,24 178,8" }: { color?: string; points?: string }) {
  const coords = points.split(" ").map((p) => p.split(",").map(Number));
  return (
    <div className="mini-line" aria-label="本周趋势图">
      <div className="line-path" style={{ borderColor: color }} />
      {coords.map(([x, y], i) => <i key={i} style={{ left: x, top: y, borderColor: color }} />)}
    </div>
  );
}

const supportTasks = [
  { icon: "dumbbell", tone: "green", title: "健身训练", sub: "20 分钟力量训练", progress: "12/20 分钟", value: 60 },
  { icon: "book", tone: "purple", title: "阅读 30 分钟", sub: "持续输入，拓宽视野", progress: "18/30 分钟", value: 60 },
  { icon: "camera", tone: "orange", title: "自媒体更新", sub: "发布笔记 / 视频", progress: "0/1 次", value: 8 },
];

function HomePage({ go, action }: { go: (s: Screen) => void; action: (s: string) => void }) {
  return (
    <>
      <div className="morning">
        <div>
          <h2>早上好呀！ <span>☀️</span></h2>
          <p>愿你稳步向理想的自己靠近 ✨</p>
        </div>
        <div className="weather"><span>🌤️</span><b>28°</b><small>广州 多云</small></div>
        <img src={`${A}rabbit_morning_cup_scene.png`} alt="小兔端着咖啡" />
      </div>

      <Card className="quote-card" onClick={() => action("今日寄语已收藏")}>
        <span className="tag">★ 今日一句</span>
        <blockquote>你未来的样子，<br />藏在你现在的选择里。</blockquote>
        <img src={`${A}flower_quote_garden.png`} alt="花园" />
      </Card>

      <section>
        <h3 className="section-title">✦ 今日概览</h3>
        <div className="overview">
          {[
            ["shoe", "green", "运动", 75, "30/40 分钟"],
            ["moon", "purple", "睡眠", 82, "6.6/8 小时"],
            ["book", "orange", "学英语", 60, "36/60 分钟"],
            ["check_circle", "pink", "习惯完成", 78, "7/9 项完成"],
          ].map(([icon, tone, label, val, sub]) => (
            <button key={String(label)} className="overview-item" onClick={() => action(`${label}详情已展开`)}>
              <Ring value={Number(val)} tone={String(tone)} />
              <span className="overview-center"><Icon name={String(icon)} tone={String(tone)} size={29} /><b>{label}</b></span>
              <small>{sub}</small>
            </button>
          ))}
        </div>
      </section>

      <Card className="main-task">
        <h3><Icon name="target" size={26} /> 今日主任务</h3>
        <h4>完成英语核心词汇 30min 📖</h4>
        <p>积累词汇量，稳步提升英语能力</p>
        <Progress value={60} tone="orange" />
        <span className="time-progress">18/30 分钟</span>
        <img src={`${A}rabbit_reading_task.png`} alt="小兔阅读" />
        <button className="primary small" onClick={() => go("learning")}><Icon name="play" tone="white" /> 继续专注</button>
      </Card>

      <section>
        <div className="section-head">
          <h3 className="section-title heart">♥ 今日支持任务</h3>
          <button onClick={() => action("已展示全部任务")}>查看全部 ›</button>
        </div>
        <div className="support-grid">
          {supportTasks.map((t) => (
            <button className={`support-card tone-${t.tone}`} key={t.title} onClick={() => action(`${t.title}已打开`)}>
              <Icon name={t.icon} tone={t.tone} size={31} />
              <b>{t.title}</b><small>{t.sub}</small>
              <span>{t.progress}</span><Progress value={t.value} tone={t.tone} /><i>›</i>
            </button>
          ))}
        </div>
      </section>

      <div className="home-bottom-grid">
        <Card className="sleep-chart" onClick={() => action("睡眠趋势已切换为详细模式")}>
          <div className="card-head"><h3><Icon name="moon" tone="purple" /> 本周睡眠趋势</h3><span>平均 <b>7.2</b> 小时</span></div>
          <div className="chart-area"><MiniLine /><div className="chart-labels"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div></div>
        </Card>
        <Card className="quick-card">
          <h3><span>⚡</span> 快速记录</h3>
          <div className="quick-grid">
            <button onClick={() => action("运动记录面板已打开")}><Icon name="shoe" tone="green" />记运动</button>
            <button onClick={() => action("睡眠记录面板已打开")}><Icon name="moon" tone="purple" />记睡眠</button>
            <button onClick={() => action("收支记录面板已打开")}><span className="coin">¥</span>记收入</button>
            <button onClick={() => action("灵感记录面板已打开")}><Icon name="lightbulb" tone="pink" />记想法</button>
          </div>
        </Card>
      </div>
    </>
  );
}

const branchData = [
  { tone: "purple", icon: "book", title: "学习成长", sub: "英天进步一点点，未来更自由 ✨", level: "Lv.4 进阶中", days: "每周 6 天", value: 82, action: "背词汇 20min", screen: "learning" as Screen },
  { tone: "green", icon: "shoe", title: "身体健康", sub: "健康是所有热爱的底气 ✨", level: "Lv.3 稳定中", days: "每周 5 天", value: 75, action: "今晚 23:30 前睡" },
  { tone: "orange", icon: "wallet", title: "事业赚钱", sub: "把热爱变现，创造更多可能 ✨", level: "Lv.2 起步中", days: "每周 3 天", value: 60, action: "发布 1 篇笔记" },
];

function BranchesPage({ go, action }: { go: (s: Screen) => void; action: (s: string) => void }) {
  return (
    <>
      <div className="branches-hero">
        <div><h2>我的支线<span>✦</span></h2><p>当前阶段：备考期　⌄</p></div>
        <div className="hero-pills"><button onClick={() => action("已打开日历")}>▣ 07/27 周日</button><button onClick={() => action("连续推进日历已打开")}>🔥 持续推进 <b>23</b> 天</button></div>
        <Card className="focus-card" onClick={() => action("本月重点可编辑")}>
          <h3>🎯　本月重点</h3><b>英语、睡眠、自媒体</b><img src={`${A}milestone_flowers.png`} alt="花朵" />
        </Card>
        <img className="branches-rabbit" src={`${A}rabbit_branches_cup.png`} alt="小兔与咖啡" />
      </div>
      <div className="branch-list">
        {branchData.map((b) => (
          <Card key={b.title} className={`branch-card branch-${b.tone}`}>
            <div className="branch-top">
              <div className="branch-icon"><Icon name={b.icon} tone={b.tone} size={51} /></div>
              <div><h3>{b.title}</h3><p>{b.sub}</p><span className="level">{b.level}</span><span>{b.days}</span></div>
              <Ring value={b.value} tone={b.tone} label="本周进度" />
            </div>
            <div className="branch-bottom">
              <div><small>本周趋势</small><MiniLine color={b.tone === "green" ? "#91b65d" : b.tone === "orange" ? "#f5a63d" : "#8d78d8"} /></div>
              <div><small>下一步行动</small><button className={`branch-action ${b.tone}`} onClick={() => b.screen ? go(b.screen) : action(b.action)}>{b.action}　›</button></div>
            </div>
          </Card>
        ))}
      </div>
      <div className="section-head"><h3 className="section-title heart">♥ 保持中的支线</h3><button onClick={() => action("管理页已打开")}>管理全部 ›</button></div>
      <div className="holding-grid">
        {[
          ["wallet", "财务管理", "每周 2 天", "58%"],
          ["clipboard", "生活秩序", "每周 3 天", "66%"],
          ["plant", "内在成长", "每周 2 天", "48%"],
          ["book", "阅读积累", "每周 4 天", "70%"],
        ].map(([ic, title, sub, value], i) => (
          <button key={title} onClick={() => action(`${title}已打开`)}>
            <Icon name={ic} tone={["orange", "green", "green", "purple"][i]} /><b>{title}</b><small>{sub}</small><span>━ ◔ {value}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function TrendChart() {
  return (
    <div className="trend-chart" aria-label="睡眠与学习趋势折线图">
      <div className="chart-grid-lines" />
      <div className="series purple-series">{[6.6, 7.1, 6.8, 7.6, 7.3, 7.8, 7.2].map((n, i) => <i key={i} style={{ left: `${7 + i * 14.4}%`, bottom: `${27 + (n - 6) * 17}%` }}><em>{n}</em></i>)}</div>
      <div className="series orange-series">{[60, 62, 55, 72, 68, 80, 78].map((n, i) => <i key={i} style={{ left: `${7 + i * 14.4}%`, bottom: `${12 + (n - 50) * .75}%` }}><em>{n}%</em></i>)}</div>
      <div className="week-labels">{["周一","周二","周三","周四","周五","周六","周日"].map(d => <span key={d}>{d}</span>)}</div>
    </div>
  );
}

function InsightPage({ action }: { action: (s: string) => void }) {
  const [mode, setMode] = useState("按天查看");
  return (
    <>
      <div className="insight-hero">
        <div><h2>本周洞察 <span>✦</span></h2><button onClick={() => action("已切换统计周期")}>07/21（周一）- 07/27（周日）⌄</button></div>
        <img src={`${A}rabbit_magnifier_flowers.png`} alt="小兔用放大镜观察" />
      </div>
      <div className="stat-grid">
        {[["clipboard","完成任务","18","项","较上周 +4 ↑","green"],["clock","专注时长","9.6","h","较上周 +1.2 h ↑","orange"],["moon","睡眠平均","7.2","h","较上周 +0.4 h ↑","purple"]].map(s => (
          <button key={s[1]} onClick={() => action(`${s[1]}详情已展开`)}><Icon name={s[0]} tone={s[5]} size={41}/><div><b>{s[1]}</b><strong>{s[2]}<small>{s[3]}</small></strong><span>{s[4]}</span></div></button>
        ))}
      </div>
      <Card className="trend-card">
        <div className="card-head"><h3>✦ 睡眠与学习趋势</h3><button className="filter-pill" onClick={() => setMode(mode === "按天查看" ? "按周查看" : "按天查看")}>{mode}⌄</button></div>
        <div className="legend"><span className="purple-dot"/>睡眠时长（小时）<span className="orange-dot"/>学习完成率（%）</div>
        <TrendChart />
      </Card>
      <Card className="heat-card">
        <div className="card-head"><h3>♥ 习惯完成热力图</h3><span>完成率　● ● ● ●　高</span></div>
        <div className="heat-grid">
          <div />
          {["周一","周二","周三","周四","周五","周六","周日"].map(d=><b key={d}>{d}</b>)}
          {[["shoe","运动"],["moon","早睡"],["book","学英语"],["check_circle","习惯打卡"]].flatMap((row,r)=>[
            <button className="heat-label" key={`${r}l`} onClick={()=>action(`${row[1]}习惯详情`)}><Icon name={row[0]} tone={r===1?"purple":r>1?"orange":"green"} size={22}/>{row[1]}</button>,
            ...[0,1,2,3,4,5,6].map((c)=><button key={`${r}-${c}`} className={`heat-dot h${(r*3+c*2)%5}`} onClick={()=>action(`${row[1]} · 周${c+1} 已切换`)}/>)
          ])}
        </div>
      </Card>
      <h3 className="section-title">💡 本周洞察</h3>
      <div className="insight-cards">
        <button onClick={()=>action("睡眠洞察已收藏")}><img src={`${A}moon_insight.png`} alt="月亮"/><div><b>睡眠超过 7 小时的日子，<br/>学习完成率更高</b><p>本周 5 天睡眠 ≥7h，完成率平均提升 <em>18%</em></p></div></button>
        <button onClick={()=>action("专注洞察已收藏")}><img src={`${A}medal_insight.png`} alt="奖牌"/><div><b>周四晚上的专注效率最高</b><p>周四 20:00–22:00 的平均完成量最高</p></div></button>
      </div>
      <Card className="next-week">
        <img src={`${A}rabbit_plan_flowers.png`} alt="小兔计划下周"/>
        <div><h3>✦ 下周优先 3 件事</h3>
          {["坚持每晚 7 小时以上睡眠，保持早睡节奏","每天完成 30 分钟英语学习，巩固积累","安排 2 次运动，提升能量与专注力"].map((t,i)=><button key={t} onClick={()=>action(`第 ${i+1} 项已标记`)}><i>{i+1}</i>{t}</button>)}
        </div>
      </Card>
    </>
  );
}

function ProfilePage({ go, action }: { go: (s: Screen) => void; action: (s: string) => void }) {
  const [theme, setTheme] = useState("花园兔兔");
  const [reminders, setReminders] = useState([true, true, true]);
  return (
    <>
      <Card className="profile-hero">
        <button className="avatar" onClick={()=>action("头像选择器已打开")}><img src={`${A}profile_avatar.png`} alt="头像"/><span><Icon name="camera" tone="white" size={15}/></span></button>
        <div><h2>小兔软糖 <button onClick={()=>action("昵称编辑已打开")}><Icon name="pencil" tone="brown" size={19}/></button> <small>☆ Lv.18</small></h2><p>当前阶段：备考成长季</p></div>
        <img className="profile-scene" src={`${A}rabbit_profile_cup.png`} alt="小兔喝咖啡"/>
        <p className="profile-wish">愿你在每一个支线里，遇见更好的自己 ✨</p>
      </Card>
      <div className="settings-grid">
        <Card className="setting-card">
          <h3><Icon name="plant" tone="green"/>人生阶段 <button onClick={()=>action("人生阶段设置已打开")}>›</button></h3><b>备考成长季</b><p>专注积累，向理想进发</p><Progress value={38} tone="green"/>
        </Card>
        <Card className="setting-card layout-setting">
          <h3><Icon name="chart" tone="coral"/>首页布局 <button onClick={()=>action("布局选择器已打开")}>›</button></h3><b>标准布局</b><p>固定模块，清晰高效</p><button className="mini-preview" onClick={()=>go("home")} aria-label="预览首页"><img src={`${A}rabbit_morning_cup_scene.png`} alt=""/></button>
        </Card>
        <Card className="setting-card theme-setting">
          <h3><span>🎨</span>主题外观 <button onClick={()=>action("主题已应用")}>›</button></h3><b>{theme}</b><p>温柔治愈，陪你每一天</p>
          <div className="theme-row">{[["theme_rabbit.png","花园兔兔"],["theme_bear.png","奶油暖阳"],["theme_frog.png","薄荷清风"],["theme_cat.png","星夜静谧"]].map(([img,t])=><button className={theme===t?"active":""} key={t} onClick={()=>{setTheme(t);action(`已切换为${t}`)}}><img src={`${A}${img}`} alt={t}/><small>{t}</small></button>)}</div>
        </Card>
        <Card className="setting-card reminder-setting">
          <h3><Icon name="bell" tone="orange"/>提醒与专注 <button onClick={()=>action("提醒设置已保存")}>›</button></h3>
          {["专注提醒","每日复盘提醒","习惯打卡提醒"].map((t,i)=><button key={t} onClick={()=>setReminders(v=>v.map((x,j)=>j===i?!x:x))}><span>{t}</span><b>{i===1?"21:00":reminders[i]?"已开启":"已关闭"}</b></button>)}
          <img src={`${A}rabbit_alarm_flowers.png`} alt="小兔闹钟"/>
        </Card>
        {[
          ["shield","purple","数据与隐私",[["数据统计","clock"],["隐私设置","lock"],["账号安全","shield"]]],
          ["cloud_upload","purple","导出备份",[["导出数据","download"],["备份到云端","cloud_upload"],["恢复数据","refresh"]]]
        ].map(([ic,tone,title,rows])=><Card className="setting-card list-setting" key={String(title)}><h3><Icon name={String(ic)} tone={String(tone)}/>{String(title)} <button onClick={()=>action(`${title}设置已打开`)}>›</button></h3>{(rows as string[][]).map(([r,ri])=><button key={r} onClick={()=>action(`${r}已打开`)}><span>{r}</span><Icon name={ri} tone="brown" size={17}/></button>)}</Card>)}
      </div>
      <div className="section-head"><h3 className="section-title">☆ 本月里程碑</h3><button onClick={()=>action("里程碑详情已打开")}>查看全部 ›</button></div>
      <Card className="milestone-card">
        {[["fire","连续记录","23","天","再接再厉呀！"],["book","阅读","4","本","知识在积累 🌱"],["flag","副业项目","1","个","项目测试已完成！🎉"]].map(x=><button key={x[1]} onClick={()=>action(`${x[1]}里程碑已打开`)}><Icon name={x[0]} tone="orange"/><b>{x[1]}</b><strong>{x[2]}<small>{x[3]}</small></strong><span>{x[4]}</span></button>)}
        <img src={`${A}milestone_flowers.png`} alt="花朵"/>
      </Card>
    </>
  );
}

const learningTasks = [
  { icon: "book", tone: "coral", title: "背单词 30 个", sub: "学习新词 + 复习巩固", value: 60, label: "18/30" },
  { icon: "headphones", tone: "purple", title: "听力 20 分钟", sub: "真题听力练习", value: 40, label: "8/20 分钟" },
  { icon: "book", tone: "green", title: "阅读 1 篇短文", sub: "四级阅读真题", value: 0, label: "0/1 篇" },
];

function LearningPage({ go, action }: { go: (s: Screen) => void; action: (s: string) => void }) {
  const [tab, setTab] = useState("英语");
  const [done, setDone] = useState([false,false,false]);
  return (
    <>
      <Card className="learning-hero">
        <span className="tag">目标进行中</span><Ring value={72} tone="orange"/>
        <div><h2><Icon name="book" tone="purple" size={31}/> 四级核心词汇</h2><p>目标：掌握 2000 个高频词汇</p><button onClick={()=>action("连续学习日历已打开")}>🔥 连续学习 <b>12</b> 天　›</button></div>
        <button className="primary" onClick={()=>action("专注计时已开始")}>继续学习</button>
        <img src={`${A}rabbit_learning_header.png`} alt="学习的小兔"/>
        <div className="learning-metrics">{[["☆","已学单词","1,436 词"],["♨","掌握率","72%"],["▣","距离考试","还有 45 天"]].map(x=><button key={x[1]} onClick={()=>action(`${x[1]}详情已打开`)}><span>{x[0]}</span><b>{x[1]}</b><strong>{x[2]}</strong></button>)}</div>
      </Card>
      <div className="segmented">{["英语","阅读","专业"].map(t=><button className={tab===t?"active":""} key={t} onClick={()=>setTab(t)}>{t}</button>)}</div>
      <Card className="study-plan">
        <div className="card-head"><h3><Icon name="clipboard" tone="orange"/> 今日学习计划 ✦</h3><button onClick={()=>action("计划编辑模式已打开")}>编辑计划 ›</button></div>
        {learningTasks.map((t,i)=><button className="study-row" key={t.title} onClick={()=>setDone(v=>v.map((x,j)=>j===i?!x:x))}><span className={`study-icon ${t.tone}`}><Icon name={t.icon} tone={t.tone}/></span><span><b>{t.title}</b><small>{t.sub}</small></span><span><em>{done[i]?"已完成":t.label}</em><Progress value={done[i]?100:t.value} tone={t.tone}/></span><i className={done[i]?"checked":""}>✓</i></button>)}
        <img src={`${A}rabbit_reading_corner.png`} alt="角落阅读的小兔"/>
      </Card>
      <div className="learning-bottom">
        <Card className="study-chart" onClick={()=>action("学习时长图表已展开")}><div className="card-head"><h3>◷ 本周学习时长</h3><span>平均 <b>6.2</b> 小时</span></div><MiniLine/><div className="chart-labels"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div></Card>
        <Card className="notes-card"><div className="card-head"><h3>▤ 最近笔记</h3><button onClick={()=>action("全部笔记已打开")}>全部 ›</button></div><span className="tag">今日复习</span><b>四级高频词组 ✦</b>{[["acquire","获得；获取"],["appropriate","适当的；恰当的"],["contribute","贡献；捐助"]].map(x=><button key={x[0]} onClick={()=>action(`${x[0]} 已加入复习`)}><strong>{x[0]}</strong><span>{x[1]}</span></button>)}<div><small>共 28 个词组</small><button className="outline" onClick={()=>action("复习模式已开始")}>去复习</button></div></Card>
      </div>
      <Card className="ai-card" onClick={()=>action("AI 学习建议已收藏")}><h3><Icon name="robot" tone="purple"/> AI 学习建议 ✦</h3><p>你最近晚上学习效率更高，建议把听力<br/>安排在 20:00 后，专注度会更好哦！</p><img src={`${A}rabbit_ai_night.png`} alt="夜晚学习的小兔"/></Card>
      <p className="tip">💡 小贴士：坚持每天完成计划，进步看得见，梦想更近一步！</p>
      <button className="project-link" onClick={()=>go("project")}>查看「英语四级备考」项目计划　›</button>
    </>
  );
}

function ProjectPage({ action }: { action: (s: string) => void }) {
  const [checks,setChecks]=useState([false,false,true,false,false,false,false,false]);
  const [focus,setFocus]=useState(false);
  const toggle=(i:number)=>setChecks(v=>v.map((x,j)=>j===i?!x:x));
  return (
    <>
      <Card className="project-hero">
        <div><h2>📖 英语四级备考 ✦</h2><p>每天进步一点点，四级一次过！ ✨</p><div className="project-stats"><span><small>总体进度</small><b>28%</b><Progress value={28} tone="green"/></span><span><small>截止日期</small><b>2025.09.30</b><em>还有 65 天</em></span><span><small>当前阶段</small><b>第 <strong>4</strong> 周 / 共 12 周</b></span></div></div>
        <img src={`${A}rabbit_project_study.png`} alt="小兔学习项目"/>
      </Card>
      <Card className="weeks">
        <div className="card-head"><h3>🗓 12 周计划进度</h3><button onClick={()=>action("计划详情已展开")}>查看计划详情 ›</button></div>
        <div className="week-track">{Array.from({length:12},(_,i)=><button key={i} className={i<4?"done":""} onClick={()=>action(`已选择第 ${i+1} 周`)}><i>{i<4?"✓":"•"}</i><span>W{i+1}</span></button>)}</div>
      </Card>
      <div className="task-columns">
        {[
          {title:"🎯 今日必须",tone:"coral",count:3,tasks:[["词汇学习 80 个","30 分钟"],["长篇阅读 1 篇","25 分钟"],["听力真题 1 套","20 分钟"]],foot:"全部完成可得 ⭐ 30",offset:0},
          {title:"↗ 本周推进",tone:"purple",count:3,tasks:[["写作模板背诵","2 篇"],["翻译每日一句","5 句"],["模拟卷练习","1 套"]],foot:"本周目标进度 45%",offset:3},
          {title:"◷ 可延后",tone:"orange",count:2,tasks:[["语法专项练习","20 分钟"],["词根词缀整理","15 分钟"]],foot:"灵活安排时间 🌱",offset:6},
        ].map(c=><Card className={`task-column ${c.tone}`} key={c.title}><h3>{c.title}<span>{c.count}</span></h3>{c.tasks.map((t,i)=><button key={t[0]} onClick={()=>toggle(c.offset+i)}><i className={checks[c.offset+i]?"checked":""}>✓</i><span><b>{t[0]}</b><small>{t[1]}</small></span></button>)}<p>{c.foot}</p></Card>)}
      </div>
      <Card className="schedule">
        <div className="card-head"><h3>◷ 今日时间安排</h3><span>总计 2.5 小时</span></div>
        {[["09:00 – 09:50","词汇学习 80 个","50 分钟","book"],["14:00 – 14:40","听力真题 1 套","40 分钟","headphones"],["19:30 – 20:20","长篇阅读 1 篇","50 分钟","clipboard"]].map(x=><button key={x[0]} onClick={()=>action(`${x[1]}已打开`)}><Icon name={x[3]} tone="purple"/><span>{x[0]}</span><b>{x[1]} <em>专注</em></b><small>{x[2]}</small><i>›</i></button>)}
      </Card>
      <Card className="project-result" onClick={()=>action("本周关键结果已收藏")}><div><h3>⭐ 本周关键结果</h3><b>词汇完成 300 个，完成 2 次听力练习</b><p>继续保持，稳步向前！✨</p></div><img src={`${A}rabbit_suitcase_flowers.png`} alt="小兔成果"/></Card>
      <button className={`primary focus-button ${focus?"running":""}`} onClick={()=>{setFocus(!focus);action(focus?"专注已暂停":"25 分钟专注已开始")}}><Icon name={focus?"clock":"play"} tone="white"/>{focus?"专注中 · 24:59":"开始专注"}</button>
    </>
  );
}

function QuickRecord({ close, action }: { close: () => void; action: (s: string) => void }) {
  const [tab,setTab]=useState("睡眠");
  const [quality,setQuality]=useState(82);
  const [mood,setMood]=useState("入睡快");
  const [note,setNote]=useState("");
  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label="快速记录">
      <button className="modal-scrim" onClick={close} aria-label="关闭弹窗"/>
      <div className="record-sheet">
        <div className="handle"/><button className="close-btn" onClick={close}>×</button>
        <div className="record-head"><img src={`${A}rabbit_quick_note.png`} alt="记录的小兔"/><div><h2>快速记录 ✦</h2><p>随手记下当下，为更好的自己打卡 ✨</p></div></div>
        <div className="record-tabs">{[["运动","shoe"],["睡眠","moon"],["收支","wallet"],["想法","lightbulb"]].map(([t,ic])=><button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}><Icon name={ic} tone={t==="睡眠"?"purple":t==="运动"?"green":t==="收支"?"orange":"pink"}/>{t}</button>)}</div>
        {tab==="睡眠" ? <div className="sleep-form">
          <div className="time-grid"><button onClick={()=>action("睡觉时间选择器已打开")}><span>🌙 睡觉时间</span><b>22:30</b><i>›</i></button><button onClick={()=>action("起床时间选择器已打开")}><span>☀️ 起床时间</span><b>06:30</b><i>›</i></button></div>
          <label className="range-card"><span>🌙 睡眠质量 <b>{quality}分</b></span><input type="range" min="0" max="100" value={quality} onChange={e=>setQuality(Number(e.target.value))}/><small><i>很差</i><i>较差</i><i>一般</i><i>良好</i><i>很好</i></small></label>
          <div className="mood-card"><b>🌙 睡眠状态</b><div>{[["入睡快","smile","purple"],["一般","neutral","orange"],["易醒","sad","pink"]].map(([m,ic,tone])=><button key={m} className={mood===m?"active":""} onClick={()=>setMood(m)}><Icon name={ic} tone={tone} size={34}/>{m}</button>)}</div></div>
          <label className="note-card"><b>▣ 睡眠备注 <small>（可选）</small></b><textarea value={note} maxLength={100} onChange={e=>setNote(e.target.value)} placeholder="记录一下昨晚的睡眠感受吧～"/><span>{note.length}/100</span><img src={`${A}rabbit_note_peek.png`} alt="偷看的小兔"/></label>
        </div> : <div className="empty-record"><Icon name={tab==="运动"?"shoe":tab==="收支"?"wallet":"lightbulb"} tone={tab==="运动"?"green":tab==="收支"?"orange":"pink"} size={62}/><h3>记录{tab}</h3><p>点击下方按钮完成今天的{tab}记录</p></div>}
        <h3 className="shortcuts-title">✦ 常用快捷记录</h3><div className="shortcut-grid">{[["shoe","记录运动","打卡运动时长","green"],["wallet","记收入","记录一笔收入","orange"],["lightbulb","记录感","闪现一个想法","pink"]].map(x=><button key={x[1]} onClick={()=>action(`${x[1]}快捷项已选择`)}><Icon name={x[0]} tone={x[3]} size={31}/><span><b>{x[1]}</b><small>{x[2]}</small></span><i>›</i></button>)}</div>
        <button className="primary save-record" onClick={()=>{action(`${tab}记录保存成功`);close()}}>✦　保存记录　✦</button>
      </div>
    </div>
  );
}

function BottomNav({ screen, go, openRecord }: { screen: Screen; go: (s: Screen) => void; openRecord: () => void }) {
  const items: [Screen,string,string][] = [["home","home","首页"],["branches","puzzle","支线"],["insight","chart","洞察"],["profile","user","我的"]];
  return (
    <nav className="bottom-nav">
      {items.slice(0,2).map(([s,ic,l])=><button key={s} className={screen===s?"active":""} onClick={()=>go(s)}><Icon name={ic} tone={screen===s?"coral":"brown"} size={28}/><span>{l}</span></button>)}
      <button className="add-btn" onClick={openRecord} aria-label="快速记录"><Icon name="plus" tone="white" size={38}/></button>
      {items.slice(2).map(([s,ic,l])=><button key={s} className={screen===s?"active":""} onClick={()=>go(s)}><Icon name={ic} tone={screen===s?"coral":"brown"} size={28}/><span>{l}</span></button>)}
    </nav>
  );
}

export function LifeWorkbench() {
  const [screen,setScreen]=useState<Screen>("home");
  const [modal,setModal]=useState<Modal>(null);
  const [toast,setToast]=useState("");
  const history = useMemo(()=>["home","branches","insight","profile"] as Screen[],[]);
  useEffect(()=>{ if(!toast)return; const t=setTimeout(()=>setToast(""),1800); return()=>clearTimeout(t)},[toast]);
  const go=(s:Screen)=>{setScreen(s);window.scrollTo({top:0})};
  const back=()=>go(screen==="project"?"learning":"home");
  return (
    <main className={`app app-${screen}`}>
      <StatusBar/>
      <Header title={screen==="learning"?"学习成长":screen==="project"?"项目计划":"人生支线工作台"} centered={screen==="learning"||screen==="project"} back={screen==="learning"||screen==="project"} onBack={back} onMenu={()=>setModal("menu")} onCalendar={()=>setModal("calendar")}/>
      <div className="page-content">
        {screen==="home"&&<HomePage go={go} action={setToast}/>}
        {screen==="branches"&&<BranchesPage go={go} action={setToast}/>}
        {screen==="insight"&&<InsightPage action={setToast}/>}
        {screen==="profile"&&<ProfilePage go={go} action={setToast}/>}
        {screen==="learning"&&<LearningPage go={go} action={setToast}/>}
        {screen==="project"&&<ProjectPage action={setToast}/>}
      </div>
      {history.includes(screen)&&<BottomNav screen={screen} go={go} openRecord={()=>setModal("record")}/>}
      {modal==="record"&&<QuickRecord close={()=>setModal(null)} action={setToast}/>}
      {modal==="menu"&&<div className="modal-layer side-layer"><button className="modal-scrim" onClick={()=>setModal(null)}/><aside><h2>人生支线工作台 ✦</h2>{[["home","首页"],["branches","我的支线"],["insight","本周洞察"],["learning","学习成长"],["project","项目计划"],["profile","我的设置"]].map(([s,l])=><button key={s} onClick={()=>{go(s as Screen);setModal(null)}}>{l}<span>›</span></button>)}<button className="menu-close" onClick={()=>setModal(null)}>关闭菜单</button></aside></div>}
      {modal==="calendar"&&<div className="modal-layer center-layer"><button className="modal-scrim" onClick={()=>setModal(null)}/><div className="dialog"><h2>选择日期</h2><div className="calendar-grid">{["一","二","三","四","五","六","日",...Array.from({length:31},(_,i)=>String(i+1))].map((d,i)=><button key={i} className={d==="27"?"active":""} onClick={()=>{setToast(`已选择 07/${d.padStart?.(2,"0")||d}`);setModal(null)}}>{d}</button>)}</div><button className="outline" onClick={()=>setModal(null)}>取消</button></div></div>}
      {toast&&<div className="toast" role="status">{toast}</div>}
    </main>
  );
}
