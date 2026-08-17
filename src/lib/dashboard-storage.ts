"use client";

import { useCallback, useSyncExternalStore } from "react";
import { createId } from "@/lib/ids";

const KEYS = {
  read: "duneworks-dashboard-read",
  tasks: "duneworks-dashboard-tasks",
  audit: "duneworks-dashboard-audit",
  done: "duneworks-dashboard-done",
} as const;

export interface DashboardTask {
  id: string;
  title: string;
  dueAt: string;
  relatedKind: "company" | "project" | "payment" | "none";
  relatedId: string | null;
  relatedLabel: string;
  done: boolean;
  createdAt: string;
}

export interface StudioAuditEntry {
  id: string;
  type: "team_added" | "permission_changed";
  userId: string;
  userName: string;
  actorId: string;
  actorName: string;
  detail: string;
  timestamp: string;
}

const EMPTY_IDS: string[] = [];
const EMPTY_TASKS: DashboardTask[] = [];
const EMPTY_AUDIT: StudioAuditEntry[] = [];

const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: unknown }>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.value as T;
  let value = fallback;
  if (raw) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }
  cache.set(key, { raw, value });
  return value;
}

function writeJson(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
  cache.set(key, { raw: JSON.stringify(value), value });
  emit();
}

export function appendStudioAudit(entry: Omit<StudioAuditEntry, "id" | "timestamp">) {
  const next: StudioAuditEntry = {
    ...entry,
    id: createId("audit"),
    timestamp: new Date().toISOString(),
  };
  const current = readJson<StudioAuditEntry[]>(KEYS.audit, EMPTY_AUDIT);
  writeJson(KEYS.audit, [next, ...current].slice(0, 200));
  return next;
}

export function useDashboardLocal() {
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const readIds = useSyncExternalStore(
    subscribe,
    () => readJson<string[]>(KEYS.read, EMPTY_IDS),
    () => EMPTY_IDS
  );
  const tasks = useSyncExternalStore(
    subscribe,
    () => readJson<DashboardTask[]>(KEYS.tasks, EMPTY_TASKS),
    () => EMPTY_TASKS
  );
  const audit = useSyncExternalStore(
    subscribe,
    () => readJson<StudioAuditEntry[]>(KEYS.audit, EMPTY_AUDIT),
    () => EMPTY_AUDIT
  );
  const completedDerived = useSyncExternalStore(
    subscribe,
    () => readJson<string[]>(KEYS.done, EMPTY_IDS),
    () => EMPTY_IDS
  );

  const markRead = useCallback((id: string) => {
    const current = readJson<string[]>(KEYS.read, EMPTY_IDS);
    if (current.includes(id)) return;
    writeJson(KEYS.read, [...current, id]);
  }, []);

  const markAllRead = useCallback((ids: string[]) => {
    const current = readJson<string[]>(KEYS.read, EMPTY_IDS);
    writeJson(KEYS.read, [...new Set([...current, ...ids])]);
  }, []);

  const addTask = useCallback(
    (input: Omit<DashboardTask, "id" | "createdAt" | "done">) => {
      const next: DashboardTask = {
        ...input,
        id: createId("task"),
        done: false,
        createdAt: new Date().toISOString(),
      };
      const current = readJson<DashboardTask[]>(KEYS.tasks, EMPTY_TASKS);
      writeJson(KEYS.tasks, [next, ...current]);
      return next;
    },
    []
  );

  const toggleTask = useCallback((id: string, done: boolean) => {
    const current = readJson<DashboardTask[]>(KEYS.tasks, EMPTY_TASKS);
    writeJson(
      KEYS.tasks,
      current.map((task) => (task.id === id ? { ...task, done } : task))
    );
  }, []);

  const toggleDerived = useCallback((id: string, done: boolean) => {
    const current = readJson<string[]>(KEYS.done, EMPTY_IDS);
    const next = done
      ? [...new Set([...current, id])]
      : current.filter((item) => item !== id);
    writeJson(KEYS.done, next);
  }, []);

  const reloadAudit = useCallback(() => {
    cache.delete(KEYS.audit);
    emit();
  }, []);

  return {
    hydrated,
    readIds,
    tasks,
    audit,
    completedDerived,
    markRead,
    markAllRead,
    addTask,
    toggleTask,
    toggleDerived,
    reloadAudit,
  };
}
