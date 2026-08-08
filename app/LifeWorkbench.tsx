"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "./workbench/store";
import type { RecordKind } from "./workbench/types";
import { BottomNavigation, PageHeader } from "./workbench/ui";
import { DateDialog, FocusTimer, MenuDrawer, QuickRecordSheet } from "./workbench/overlays";
import {
  BranchDetailPage,
  BranchesPage,
  CustomizePage,
  HomePage,
  InsightsPage,
  LayoutEditorPage,
  LearningPage,
  LearningReviewPage,
  NotePage,
  PrivacySettingsPage,
  ProfilePage,
  ProjectPage,
  ReminderSettingsPage,
  ReviewPage,
  SettingsPage,
  type PageActions,
} from "./workbench/pages";

type ToastState = { message: string; undo?: () => void } | null;

const titles: Record<string, string> = {
  "/": "人生支线工作台",
  "/branches": "我的支线",
  "/insights": "人生支线工作台",
  "/profile": "我的",
  "/learning": "学习成长",
  "/learning/review": "学习复习",
  "/customize": "主题外观",
  "/layout-editor": "首页布局",
  "/settings": "设置",
  "/settings/privacy": "数据与隐私",
  "/settings/reminders": "提醒与专注",
  "/reviews/daily": "每日复盘",
  "/reviews/weekly": "每周复盘",
};

export function LifeWorkbench() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const store = useAppStore();
  const { state, hydrated, startFocus } = store;
  const activeFocus = state.activeFocus;
  const [menuOpen, setMenuOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [recordKind, setRecordKind] = useState<RecordKind>();
  const [recordOpen, setRecordOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const toastTimer = useRef<number>();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  useEffect(() => () => { if (toastTimer.current) window.clearTimeout(toastTimer.current); }, []);

  const notify = (message: string, undo?: () => void) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ message, undo });
    toastTimer.current = window.setTimeout(() => setToast(null), undo ? 5000 : 2200);
  };
  const navigate = (path: string) => router.push(path);
  const openRecord = (kind: RecordKind = "sleep") => { setRecordKind(kind); setRecordOpen(true); };
  const beginFocus = (taskId?: string, minutes = 25) => {
    if (activeFocus.status !== "idle") return notify("已有一项专注正在进行");
    startFocus(taskId, minutes);
    notify("专注计时已开始");
  };
  const actions: PageActions = { navigate, openRecord, startFocus: beginFocus, notify };

  const content = (() => {
    if (pathname === "/") return <HomePage {...actions} />;
    if (pathname === "/branches") return <BranchesPage {...actions} />;
    if (pathname.startsWith("/branches/")) return <BranchDetailPage branchId={decodeURIComponent(pathname.split("/")[2] || "learning")} {...actions} />;
    if (pathname.startsWith("/projects/")) return <ProjectPage projectId={decodeURIComponent(pathname.split("/")[2] || "cet4")} {...actions} />;
    if (pathname === "/learning/review") return <LearningReviewPage {...actions} />;
    if (pathname.startsWith("/learning/notes/")) return <NotePage noteId={decodeURIComponent(pathname.split("/")[3] || "")} {...actions} />;
    if (pathname === "/learning") return <LearningPage {...actions} />;
    if (pathname === "/insights") return <InsightsPage {...actions} />;
    if (pathname === "/profile") return <ProfilePage {...actions} />;
    if (pathname === "/customize") return <CustomizePage {...actions} />;
    if (pathname === "/layout-editor") return <LayoutEditorPage {...actions} />;
    if (pathname === "/settings/privacy") return <PrivacySettingsPage {...actions} />;
    if (pathname === "/settings/reminders") return <ReminderSettingsPage {...actions} />;
    if (pathname === "/settings") return <SettingsPage {...actions} />;
    if (pathname === "/reviews/daily") return <ReviewPage kind="daily" {...actions} />;
    if (pathname === "/reviews/weekly") return <ReviewPage kind="weekly" {...actions} />;
    return <SettingsPage {...actions} />;
  })();

  const isMain = ["/", "/branches", "/insights", "/profile"].includes(pathname);
  const title = pathname.startsWith("/projects/") ? "项目计划" : pathname.startsWith("/branches/") ? "支线详情" : pathname.startsWith("/learning/notes/") ? "学习笔记" : titles[pathname] ?? "人生支线工作台";
  const dateLabel = (() => { const date = new Date(`${state.selectedDate}T12:00:00`); return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} 周${"日一二三四五六"[date.getDay()]}`; })();

  return <main className={`app-shell theme-${state.theme.theme} ${state.settings.reducedMotion ? "reduced-motion" : ""}`} style={{ "--atmosphere": `${state.theme.intensity}%` } as CSSProperties}>
    <PageHeader title={title} dateLabel={dateLabel} onMenu={isMain ? () => setMenuOpen(true) : undefined} onBack={isMain ? undefined : () => router.back()} onDate={() => setDateOpen(true)} />
    <div className="page">{hydrated ? content : <div className="loading-state" role="status">正在打开工作台…</div>}</div>
    {isMain && hydrated && <BottomNavigation path={pathname} navigate={navigate} openRecord={() => openRecord("sleep")} />}
    {menuOpen && <MenuDrawer close={() => setMenuOpen(false)} navigate={navigate} />}
    {dateOpen && <DateDialog close={() => setDateOpen(false)} notify={notify} />}
    {recordOpen && <QuickRecordSheet initialKind={recordKind} close={() => setRecordOpen(false)} notify={notify} />}
    <FocusTimer notify={notify} />
    {toast && <div className="toast" role="status"><span>{toast.message}</span>{toast.undo && <button type="button" onClick={() => { toast.undo?.(); setToast(null); }}>撤销</button>}</div>}
  </main>;
}
