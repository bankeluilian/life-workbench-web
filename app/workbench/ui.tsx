"use client";

import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import type { Task, Tone } from "./types";

export const palette: Record<Tone, string> = {
  coral: "#ff8069",
  orange: "#f6a84c",
  green: "#8db45d",
  purple: "#8d78d8",
  pink: "#ef8489",
};

export function Icon({ name, tone = "coral", size = 24, alt = "" }: { name: string; tone?: Tone; size?: number; alt?: string }) {
  const resolved = tone === "pink" ? "coral" : tone;
  return <Image className="ui-icon" src={`/assets/icon-preview/${name}_${resolved}.png`} width={size} height={size} alt={alt} unoptimized />;
}

export function Art({ name, alt, className = "" }: { name: string; alt: string; className?: string }) {
  return <Image className={`clean-art ${className}`} src={`/assets/clean/illustrations/${name}`} width={360} height={260} alt={alt} unoptimized />;
}

export function Card({ children, className = "", as = "section" }: { children: ReactNode; className?: string; as?: "section" | "article" | "div" }) {
  const Component = as;
  return <Component className={`card ${className}`}>{children}</Component>;
}

export function SectionTitle({ icon, tone = "orange", title, action, onAction }: { icon?: string; tone?: Tone; title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="section-title">
      <h2>{icon && <Icon name={icon} tone={tone} size={22} />}{title}<span aria-hidden="true">✦</span></h2>
      {action && <button type="button" onClick={onAction}>{action} ›</button>}
    </div>
  );
}

export function ProgressRing({ value, goal, tone, label, size = 82 }: { value: number; goal: number; tone: Tone; label: string; size?: number }) {
  const percent = goal > 0 ? Math.max(0, Math.min(100, Math.round((value / goal) * 100))) : 0;
  const style = {
    width: size,
    height: size,
    "--ring-color": palette[tone],
    "--ring-value": `${percent * 3.6}deg`,
  } as CSSProperties;
  return (
    <div className="progress-ring" style={style} aria-label={`${label} ${percent}%`}>
      <div><strong>{percent}%</strong><span>{label}</span></div>
    </div>
  );
}

export function ProgressBar({ value, goal, tone = "coral" }: { value: number; goal: number; tone?: Tone }) {
  const percent = goal > 0 ? Math.max(0, Math.min(100, (value / goal) * 100)) : 0;
  return <div className="progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={value}><i style={{ width: `${percent}%`, background: palette[tone] }} /></div>;
}

export function EmptyState({ icon = "sparkles", title, text }: { icon?: string; title: string; text: string }) {
  return <div className="empty-state"><Icon name={icon} tone="orange" size={38} /><strong>{title}</strong><p>{text}</p></div>;
}

export function TaskRow({ task, onToggle, onEdit, onDelete, compact = false }: { task: Task; onToggle: () => void; onEdit?: () => void; onDelete?: () => void; compact?: boolean }) {
  return (
    <div className={`task-row ${task.status === "done" ? "done" : ""} ${compact ? "compact" : ""}`}>
      <button className="task-check" type="button" onClick={onToggle} aria-label={`${task.status === "done" ? "取消完成" : "完成"}${task.title}`}>
        {task.status === "done" ? "✓" : ""}
      </button>
      <button className="task-copy" type="button" onClick={onEdit ?? onToggle}>
        <strong>{task.title}</strong><span>{task.description || `${task.estimatedMinutes} 分钟`}</span>
      </button>
      {!compact && <small>{task.actualMinutes}/{task.estimatedMinutes} 分钟</small>}
      {onDelete && <button className="icon-action danger" type="button" onClick={onDelete} aria-label={`删除${task.title}`}>×</button>}
    </div>
  );
}

export function LineChart({ values, tone = "purple", unit = "", labels = ["一", "二", "三", "四", "五", "六", "日"], onPoint }: { values: number[]; tone?: Tone; unit?: string; labels?: string[]; onPoint?: (index: number) => void }) {
  const width = 330;
  const height = 150;
  const max = Math.max(1, ...values);
  const points = values.map((value, index) => ({ x: 25 + index * ((width - 48) / Math.max(1, values.length - 1)), y: height - 28 - (value / max) * 94 }));
  const path = points.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
  const area = points.length ? `${path} L${points.at(-1)?.x},${height - 28} L${points[0].x},${height - 28} Z` : "";
  return (
    <div className="svg-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="动态趋势图">
        {[28, 59, 90, 121].map((y) => <line key={y} x1="24" y1={y} x2={width - 12} y2={y} stroke="#eee5dc" strokeWidth="1" />)}
        {area && <path d={area} fill={`${palette[tone]}18`} />}
        {path && <path d={path} fill="none" stroke={palette[tone]} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
        {points.map((point, index) => (
          <g key={`${point.x}-${index}`} onClick={() => onPoint?.(index)} className={onPoint ? "chart-point clickable" : "chart-point"}>
            <circle cx={point.x} cy={point.y} r="6" fill="#fffdf9" stroke={palette[tone]} strokeWidth="3" />
            {values[index] > 0 && <text x={point.x} y={point.y - 10} textAnchor="middle" fontSize="9" fill="#725f57">{values[index]}{unit}</text>}
            <text x={point.x} y={height - 8} textAnchor="middle" fontSize="10" fill="#887a74">{labels[index] ?? index + 1}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function Heatmap({ rows }: { rows: { label: string; tone: Tone; values: number[] }[] }) {
  return (
    <div className="heatmap" role="table" aria-label="习惯完成热力图">
      <div className="heatmap-head"><span />{["一", "二", "三", "四", "五", "六", "日"].map((day) => <span key={day}>周{day}</span>)}</div>
      {rows.map((row) => <div className="heatmap-row" key={row.label}><strong>{row.label}</strong>{row.values.map((value, index) => <i key={index} title={`${row.label} 周${index + 1}：${value}%`} style={{ background: `${palette[row.tone]}${value === 0 ? "18" : value < 50 ? "55" : value < 80 ? "99" : "dd"}` }} />)}</div>)}
    </div>
  );
}

export function PageHeader({ title = "人生支线工作台", dateLabel, onBack, onMenu, onDate, onMore }: { title?: string; dateLabel?: string; onBack?: () => void; onMenu?: () => void; onDate?: () => void; onMore?: () => void }) {
  return (
    <>
      <div className="status-row"><span>9:41</span><span>▮▮▮　⌁　▰</span></div>
      <header className="app-header">
        <button className="round-button" type="button" onClick={onBack ?? onMenu} aria-label={onBack ? "返回" : "打开菜单"}><Icon name={onBack ? "back" : "menu"} size={24} /></button>
        <h1>{title} <em>✦</em></h1>
        {onMore ? <button className="round-button" type="button" onClick={onMore} aria-label="更多操作"><Icon name="more" size={24} /></button> : <button className="date-button" type="button" onClick={onDate}><Icon name="calendar" size={18} />{dateLabel ?? "今天"}</button>}
      </header>
    </>
  );
}

export function BottomNavigation({ path, navigate, openRecord }: { path: string; navigate: (path: string) => void; openRecord: () => void }) {
  const items = [
    ["/", "home", "首页"],
    ["/branches", "puzzle", "支线"],
    ["/insights", "chart", "洞察"],
    ["/profile", "user", "我的"],
  ] as const;
  return (
    <nav className="bottom-nav" aria-label="底部导航">
      {items.slice(0, 2).map(([href, icon, label]) => <button key={href} className={path === href || (href !== "/" && path.startsWith(href)) ? "active" : ""} type="button" onClick={() => navigate(href)}><Icon name={icon} /><span>{label}</span></button>)}
      <button className="nav-add" type="button" onClick={openRecord} aria-label="打开快速记录"><Icon name="plus" size={34} /></button>
      {items.slice(2).map(([href, icon, label]) => <button key={href} className={path === href || path.startsWith(href) ? "active" : ""} type="button" onClick={() => navigate(href)}><Icon name={icon} /><span>{label}</span></button>)}
    </nav>
  );
}
