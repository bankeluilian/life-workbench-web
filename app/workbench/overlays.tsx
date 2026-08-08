"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "./store";
import type { RecordKind } from "./types";
import { Art, Card, Icon } from "./ui";

type Notify = (message: string) => void;

const kindMeta = {
  exercise: { label: "运动", icon: "shoe", tone: "green" as const },
  sleep: { label: "睡眠", icon: "moon", tone: "purple" as const },
  finance: { label: "收支", icon: "wallet", tone: "orange" as const },
  idea: { label: "想法", icon: "lightbulb", tone: "coral" as const },
};

export function QuickRecordSheet({ initialKind = "sleep", close, notify }: { initialKind?: RecordKind; close: () => void; notify: Notify }) {
  const { state, setState } = useAppStore();
  const [kind, setKind] = useState<RecordKind>(initialKind);
  const [dirty, setDirty] = useState(false);
  const [editId, setEditId] = useState<string>();
  const [date, setDate] = useState(state.selectedDate);
  const [sleepAt, setSleepAt] = useState("22:30");
  const [wakeAt, setWakeAt] = useState("06:30");
  const [quality, setQuality] = useState(0);
  const [sleepStatus, setSleepStatus] = useState<"fast" | "normal" | "light">("normal");
  const [exerciseType, setExerciseType] = useState("健走");
  const [duration, setDuration] = useState("");
  const [intensity, setIntensity] = useState<"low" | "medium" | "high">("medium");
  const [feeling, setFeeling] = useState("轻松");
  const [calories, setCalories] = useState("");
  const [financeType, setFinanceType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("日常");
  const [payment, setPayment] = useState("微信");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [pinned, setPinned] = useState(false);
  const [note, setNote] = useState("");
  const dragStart = useRef(0);

  const askClose = () => {
    if (dirty && !window.confirm("记录尚未保存，确定关闭吗？")) return;
    close();
  };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") askClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const sleepMinutes = useMemo(() => {
    const [sh, sm] = sleepAt.split(":").map(Number); const [wh, wm] = wakeAt.split(":").map(Number);
    let value = wh * 60 + wm - (sh * 60 + sm); if (value <= 0) value += 1440;
    return Number.isFinite(value) ? value : 0;
  }, [sleepAt, wakeAt]);
  const valid = kind === "sleep" ? sleepMinutes > 0 : kind === "exercise" ? Number(duration) > 0 : kind === "finance" ? Number(amount) > 0 : title.trim().length > 0 && content.trim().length > 0;
  const recordedAt = `${date}T12:00:00`;

  const clear = () => { setEditId(undefined); setDuration(""); setAmount(""); setTitle(""); setContent(""); setTags(""); setNote(""); setDirty(false); };
  const save = () => {
    if (!valid) return;
    setState((current) => {
      if (kind === "sleep") {
        const record = { id: editId ?? crypto.randomUUID(), sleepAt: `${date}T${sleepAt}:00`, wakeAt: `${date}T${wakeAt}:00`, durationMinutes: sleepMinutes, quality, status: sleepStatus, note, recordedAt };
        return { ...current, sleepRecords: editId ? current.sleepRecords.map((item) => item.id === editId ? record : item) : [...current.sleepRecords, record] };
      }
      if (kind === "exercise") {
        const record = { id: editId ?? crypto.randomUUID(), type: exerciseType, durationMinutes: Number(duration), intensity, feeling, calories: calories ? Number(calories) : undefined, note, recordedAt };
        return { ...current, exerciseRecords: editId ? current.exerciseRecords.map((item) => item.id === editId ? record : item) : [...current.exerciseRecords, record] };
      }
      if (kind === "finance") {
        const record = { id: editId ?? crypto.randomUUID(), type: financeType, amount: Number(amount), category, paymentMethod: payment, note, recordedAt };
        return { ...current, financeRecords: editId ? current.financeRecords.map((item) => item.id === editId ? record : item) : [...current.financeRecords, record] };
      }
      const record = { id: editId ?? crypto.randomUUID(), title: title.trim(), content: content.trim(), tags: tags.split(/[,，]/).map((item) => item.trim()).filter(Boolean), pinned, recordedAt };
      return { ...current, ideaRecords: editId ? current.ideaRecords.map((item) => item.id === editId ? record : item) : [...current.ideaRecords, record] };
    });
    notify(`${kindMeta[kind].label}记录已保存`);
    clear();
    close();
  };

  const switchKind = (next: RecordKind) => {
    if (dirty && !window.confirm("切换分类会清空当前未保存内容，确定继续吗？")) return;
    clear(); setKind(next);
  };

  const recent = kind === "sleep" ? state.sleepRecords : kind === "exercise" ? state.exerciseRecords : kind === "finance" ? state.financeRecords : state.ideaRecords;
  const deleteRecent = (id: string) => {
    if (!window.confirm("确定删除这条记录吗？")) return;
    setState((current) => ({ ...current, sleepRecords: current.sleepRecords.filter((item) => item.id !== id), exerciseRecords: current.exerciseRecords.filter((item) => item.id !== id), financeRecords: current.financeRecords.filter((item) => item.id !== id), ideaRecords: current.ideaRecords.filter((item) => item.id !== id) }));
    notify("记录已删除");
  };
  const loadRecent = (id: string) => {
    setEditId(id); setDirty(true);
    if (kind === "sleep") { const item = state.sleepRecords.find((record) => record.id === id); if (item) { setDate(item.recordedAt.slice(0, 10)); setSleepAt(item.sleepAt.slice(11, 16)); setWakeAt(item.wakeAt.slice(11, 16)); setQuality(item.quality); setSleepStatus(item.status); setNote(item.note); } }
    if (kind === "exercise") { const item = state.exerciseRecords.find((record) => record.id === id); if (item) { setDate(item.recordedAt.slice(0, 10)); setExerciseType(item.type); setDuration(String(item.durationMinutes)); setIntensity(item.intensity); setFeeling(item.feeling); setCalories(item.calories ? String(item.calories) : ""); setNote(item.note); } }
    if (kind === "finance") { const item = state.financeRecords.find((record) => record.id === id); if (item) { setDate(item.recordedAt.slice(0, 10)); setFinanceType(item.type); setAmount(String(item.amount)); setCategory(item.category); setPayment(item.paymentMethod); setNote(item.note); } }
    if (kind === "idea") { const item = state.ideaRecords.find((record) => record.id === id); if (item) { setDate(item.recordedAt.slice(0, 10)); setTitle(item.title); setContent(item.content); setTags(item.tags.join(", ")); setPinned(item.pinned); } }
  };

  return <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="record-title"><button className="modal-dismiss" type="button" onClick={askClose} aria-label="关闭快速记录" /><section className="record-sheet"><div className="sheet-handle" onPointerDown={(event) => { dragStart.current = event.clientY; }} onPointerUp={(event) => { if (event.clientY - dragStart.current > 60) askClose(); }} /><button className="sheet-close" type="button" onClick={askClose} aria-label="关闭">×</button><div className="record-title"><Art name="01-rabbit-writing.png" alt="记录中的兔子" /><div><h2 id="record-title">快速记录 ✦</h2><p>随手记下当下，为更好的自己打卡。</p></div></div><div className="record-tabs" role="tablist">{(Object.keys(kindMeta) as RecordKind[]).map((item) => <button role="tab" aria-selected={kind === item} className={kind === item ? "active" : ""} type="button" key={item} onClick={() => switchKind(item)}><Icon name={kindMeta[item].icon} tone={kindMeta[item].tone} />{kindMeta[item].label}</button>)}</div>
    <Card className="record-form" as="div"><label className="date-field">记录日期<input type="date" value={date} onChange={(event) => { setDate(event.target.value); setDirty(true); }} /></label>
      {kind === "sleep" && <><div className="time-grid"><label>睡觉时间<input type="time" value={sleepAt} onChange={(event) => { setSleepAt(event.target.value); setDirty(true); }} /></label><label>起床时间<input type="time" value={wakeAt} onChange={(event) => { setWakeAt(event.target.value); setDirty(true); }} /></label></div><div className="quality-field"><span>睡眠质量 <strong>{quality}分</strong></span><input type="range" min="0" max="100" value={quality} onChange={(event) => { setQuality(Number(event.target.value)); setDirty(true); }} /><div><small>很差</small><small>较差</small><small>一般</small><small>良好</small><small>很好</small></div></div><fieldset><legend>睡眠状态</legend><div className="choice-row">{(["fast", "normal", "light"] as const).map((value) => <button className={sleepStatus === value ? "active" : ""} type="button" key={value} onClick={() => { setSleepStatus(value); setDirty(true); }}>{value === "fast" ? "入睡快" : value === "normal" ? "一般" : "易醒"}</button>)}</div></fieldset><p className="calculated">自动计算：{Math.floor(sleepMinutes / 60)} 小时 {sleepMinutes % 60} 分钟</p></>}
      {kind === "exercise" && <><div className="two-fields"><label>运动类型<select value={exerciseType} onChange={(event) => { setExerciseType(event.target.value); setDirty(true); }}><option>健走</option><option>跑步</option><option>力量训练</option><option>瑜伽</option><option>游泳</option></select></label><label>运动时长（分钟）<input type="number" min="1" value={duration} onChange={(event) => { setDuration(event.target.value); setDirty(true); }} /></label></div><div className="two-fields"><label>强度<select value={intensity} onChange={(event) => { setIntensity(event.target.value as typeof intensity); setDirty(true); }}><option value="low">轻松</option><option value="medium">适中</option><option value="high">高强度</option></select></label><label>运动感受<input value={feeling} onChange={(event) => { setFeeling(event.target.value); setDirty(true); }} /></label></div><label>消耗热量（可选）<input type="number" min="0" value={calories} onChange={(event) => { setCalories(event.target.value); setDirty(true); }} /></label></>}
      {kind === "finance" && <><div className="choice-row"><button className={financeType === "expense" ? "active" : ""} type="button" onClick={() => { setFinanceType("expense"); setDirty(true); }}>支出</button><button className={financeType === "income" ? "active" : ""} type="button" onClick={() => { setFinanceType("income"); setDirty(true); }}>收入</button></div><label>金额<input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => { setAmount(event.target.value); setDirty(true); }} /></label><div className="two-fields"><label>分类<input value={category} onChange={(event) => { setCategory(event.target.value); setDirty(true); }} /></label><label>支付方式<input value={payment} onChange={(event) => { setPayment(event.target.value); setDirty(true); }} /></label></div></>}
      {kind === "idea" && <><label>标题<input value={title} onChange={(event) => { setTitle(event.target.value); setDirty(true); }} maxLength={40} /></label><label>内容<textarea value={content} onChange={(event) => { setContent(event.target.value); setDirty(true); }} rows={5} maxLength={500} /></label><label>标签<input value={tags} onChange={(event) => { setTags(event.target.value); setDirty(true); }} placeholder="用逗号分隔" /></label><label className="checkbox-row"><input type="checkbox" checked={pinned} onChange={(event) => { setPinned(event.target.checked); setDirty(true); }} />置顶这条想法</label></>}
      {kind !== "idea" && <label>备注（可选）<textarea value={note} onChange={(event) => { setNote(event.target.value); setDirty(true); }} rows={4} maxLength={200} /></label>}
    </Card><button className="primary-button save-record" type="button" disabled={!valid} onClick={save}>✦　{editId ? "更新记录" : "保存记录"}　✦</button>{recent.length > 0 && <div className="recent-records"><h3>最近记录</h3>{recent.slice(-3).reverse().map((item) => <div key={item.id}><button type="button" onClick={() => loadRecent(item.id)}>编辑 {item.recordedAt.slice(5, 10)}</button><button type="button" className="danger" onClick={() => deleteRecent(item.id)}>删除</button></div>)}</div>}</section></div>;
}

export function FocusTimer({ notify }: { notify: Notify }) {
  const { state, pauseFocus, resumeFocus, endFocus } = useAppStore();
  const [expanded, setExpanded] = useState(true);
  if (state.activeFocus.status === "idle") return null;
  const minutes = Math.floor(state.activeFocus.remainingSeconds / 60);
  const seconds = state.activeFocus.remainingSeconds % 60;
  const task = state.tasks.find((item) => item.id === state.activeFocus.taskId);
  const end = () => {
    if (!window.confirm("确定提前结束本次专注吗？")) return;
    const completed = task ? window.confirm("是否同时将当前任务标记为完成？") : false;
    endFocus(completed); notify("本次专注已保存");
  };
  if (!expanded) return <button className="focus-pill" type="button" onClick={() => setExpanded(true)}><Icon name="clock" tone="purple" />{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</button>;
  return <div className="focus-overlay" role="dialog" aria-modal="true" aria-label="专注计时器"><section><button className="focus-minimize" type="button" onClick={() => setExpanded(false)} aria-label="最小化">—</button><Art name="07-rabbit-moon-mug.png" alt="专注陪伴兔子" /><span className="eyebrow">正在专注</span><h2>{task?.title ?? "自由专注"}</h2><strong className="focus-time">{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</strong><div className="focus-actions"><button className="primary-button" type="button" onClick={state.activeFocus.status === "running" ? pauseFocus : resumeFocus}><Icon name={state.activeFocus.status === "running" ? "clock" : "play"} />{state.activeFocus.status === "running" ? "暂停" : "继续"}</button><button className="secondary-button" type="button" onClick={end}>结束</button></div></section></div>;
}

export function DateDialog({ close, notify }: { close: () => void; notify: Notify }) {
  const { state, setState } = useAppStore();
  const [value, setValue] = useState(state.selectedDate);
  return <div className="modal-layer center" role="dialog" aria-modal="true" aria-label="选择日期"><button className="modal-dismiss" type="button" onClick={close} /><section className="small-dialog"><Icon name="calendar" tone="orange" size={42} /><h2>选择查看日期</h2><input type="date" value={value} onChange={(event) => setValue(event.target.value)} /><div><button className="secondary-button" type="button" onClick={close}>取消</button><button className="primary-button" type="button" onClick={() => { setState((current) => ({ ...current, selectedDate: value })); notify("日期已切换"); close(); }}>确定</button></div></section></div>;
}

export function MenuDrawer({ close, navigate }: { close: () => void; navigate: (path: string) => void }) {
  const items = [["/", "首页"], ["/branches", "我的支线"], ["/insights", "本周洞察"], ["/learning", "学习成长"], ["/projects/cet4", "项目计划"], ["/profile", "我的页面"], ["/settings", "设置"]];
  return <div className="modal-layer drawer-layer" role="dialog" aria-modal="true" aria-label="页面菜单"><button className="modal-dismiss" type="button" onClick={close} /><aside className="drawer"><Art name="03-rabbit-with-mug.png" alt="兔子" /><h2>人生支线工作台 ✦</h2>{items.map(([path, label]) => <button type="button" key={path} onClick={() => { navigate(path); close(); }}>{label}<span>›</span></button>)}<button className="drawer-close" type="button" onClick={close}>关闭菜单</button></aside></div>;
}

