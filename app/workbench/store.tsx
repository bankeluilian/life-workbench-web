"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createDefaultState } from "./defaults";
import type { AppState, FocusSession } from "./types";

const STORAGE_KEY = "life-workbench-state-v3";

type StoreValue = {
  state: AppState;
  hydrated: boolean;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  reset: () => void;
  exportData: () => void;
  importData: (file: File) => Promise<void>;
  startFocus: (taskId?: string, minutes?: number) => void;
  pauseFocus: () => void;
  resumeFocus: () => void;
  endFocus: (completed?: boolean) => void;
};

const StoreContext = createContext<StoreValue | null>(null);

function isState(value: unknown): value is AppState {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<AppState>;
  return data.version === 3 && Array.isArray(data.tasks) && Array.isArray(data.branches) && Boolean(data.user);
}

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => createDefaultState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let next = createDefaultState();
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (isState(parsed)) next = parsed;
      }
    } catch {}
    queueMicrotask(() => { setState(next); setHydrated(true); });
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated || state.activeFocus.status !== "running") return;
    const timer = window.setInterval(() => {
      setState((current) => {
        if (current.activeFocus.status !== "running") return current;
        const now = Date.now();
        const last = current.activeFocus.lastTickAt ? new Date(current.activeFocus.lastTickAt).getTime() : now;
        const elapsed = Math.max(1, Math.floor((now - last) / 1000));
        const remaining = Math.max(0, current.activeFocus.remainingSeconds - elapsed);
        if (remaining > 0) {
          return { ...current, activeFocus: { ...current.activeFocus, remainingSeconds: remaining, lastTickAt: new Date(now).toISOString() } };
        }
        const session: FocusSession = {
          id: crypto.randomUUID(),
          taskId: current.activeFocus.taskId,
          startedAt: current.activeFocus.startedAt ?? new Date(now - current.activeFocus.totalSeconds * 1000).toISOString(),
          endedAt: new Date(now).toISOString(),
          durationSeconds: current.activeFocus.totalSeconds,
          status: "completed",
        };
        return {
          ...current,
          focusSessions: [...current.focusSessions, session],
          tasks: current.tasks.map((task) => task.id === current.activeFocus.taskId ? { ...task, actualMinutes: task.actualMinutes + Math.round(session.durationSeconds / 60) } : task),
          activeFocus: { totalSeconds: 0, remainingSeconds: 0, status: "idle" },
        };
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [hydrated, state.activeFocus.status]);

  const reset = useCallback(() => {
    const next = createDefaultState();
    window.localStorage.removeItem(STORAGE_KEY);
    setState(next);
  }, []);

  const exportData = useCallback(() => {
    const payload = { version: 3, exportedAt: new Date().toISOString(), data: state };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `life-workbench-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const importData = useCallback(async (file: File) => {
    const text = await file.text();
    const parsed: unknown = JSON.parse(text);
    const candidate = parsed && typeof parsed === "object" && "data" in parsed ? (parsed as { data: unknown }).data : parsed;
    if (!isState(candidate)) throw new Error("备份格式无效或版本不兼容");
    setState(candidate);
  }, []);

  const startFocus = useCallback((taskId?: string, minutes = 25) => {
    setState((current) => {
      if (current.activeFocus.status !== "idle") return current;
      const totalSeconds = Math.max(60, minutes * 60);
      const now = new Date().toISOString();
      return { ...current, activeFocus: { taskId, totalSeconds, remainingSeconds: totalSeconds, status: "running", startedAt: now, lastTickAt: now } };
    });
  }, []);

  const pauseFocus = useCallback(() => setState((current) => ({ ...current, activeFocus: { ...current.activeFocus, status: current.activeFocus.status === "running" ? "paused" : current.activeFocus.status } })), []);
  const resumeFocus = useCallback(() => setState((current) => ({ ...current, activeFocus: { ...current.activeFocus, status: current.activeFocus.status === "paused" ? "running" : current.activeFocus.status, lastTickAt: new Date().toISOString() } })), []);
  const endFocus = useCallback((completed = false) => {
    setState((current) => {
      if (current.activeFocus.status === "idle") return current;
      const elapsed = Math.max(0, current.activeFocus.totalSeconds - current.activeFocus.remainingSeconds);
      const session: FocusSession = {
        id: crypto.randomUUID(),
        taskId: current.activeFocus.taskId,
        startedAt: current.activeFocus.startedAt ?? new Date().toISOString(),
        endedAt: new Date().toISOString(),
        durationSeconds: elapsed,
        status: "ended",
      };
      return {
        ...current,
        focusSessions: elapsed ? [...current.focusSessions, session] : current.focusSessions,
        tasks: current.tasks.map((task) => task.id === current.activeFocus.taskId ? { ...task, actualMinutes: task.actualMinutes + Math.round(elapsed / 60), status: completed ? "done" : task.status, completedAt: completed ? new Date().toISOString() : task.completedAt } : task),
        activeFocus: { totalSeconds: 0, remainingSeconds: 0, status: "idle" },
      };
    });
  }, []);

  const value = useMemo(() => ({ state, hydrated, setState, reset, exportData, importData, startFocus, pauseFocus, resumeFocus, endFocus }), [state, hydrated, reset, exportData, importData, startFocus, pauseFocus, resumeFocus, endFocus]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useAppStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useAppStore must be used inside AppStoreProvider");
  return value;
}
