"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getCrmData,
  removeClient,
  removeEvent,
  removePayment,
  removePossibleClient,
  removeProject,
  saveClient,
  saveEvent,
  savePayment,
  savePossibleClient,
  saveProject,
  saveSettings,
} from "@/app/actions/crm";
import { EMPTY_CRM_DATA } from "@/lib/empty-data";
import type {
  CalendarEvent,
  Client,
  CrmData,
  DialogState,
  Payment,
  PossibleClient,
  Project,
  StudioSettings,
} from "@/lib/types";

interface CrmContextValue {
  ready: boolean;
  data: CrmData;
  dialog: DialogState;
  openDialog: (
    kind: DialogState["kind"],
    id?: string | null,
    preset?: Record<string, string>
  ) => void;
  closeDialog: () => void;
  upsertClient: (
    input: Omit<Client, "id" | "createdAt" | "lastActivity"> & { id?: string }
  ) => Promise<string>;
  deleteClient: (id: string) => Promise<void>;
  upsertProject: (
    input: Omit<Project, "id" | "createdAt"> & { id?: string }
  ) => Promise<string>;
  deleteProject: (id: string) => Promise<void>;
  upsertPayment: (input: Omit<Payment, "id"> & { id?: string }) => Promise<string>;
  deletePayment: (id: string) => Promise<void>;
  upsertEvent: (
    input: Omit<CalendarEvent, "id"> & { id?: string }
  ) => Promise<string>;
  deleteEvent: (id: string) => Promise<void>;
  upsertPossibleClient: (
    input: Omit<PossibleClient, "id" | "createdAt"> & { id?: string }
  ) => Promise<string>;
  deletePossibleClient: (id: string) => Promise<void>;
  updateSettings: (patch: Partial<StudioSettings>) => Promise<void>;
}

const CrmContext = createContext<CrmContextValue | null>(null);

export function CrmProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<CrmData>(EMPTY_CRM_DATA);
  const [dialog, setDialog] = useState<DialogState>({ kind: null, id: null });

  const refresh = useCallback(async () => {
    const next = await getCrmData();
    setData(next);
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openDialog = useCallback(
    (
      kind: DialogState["kind"],
      id: string | null = null,
      preset?: Record<string, string>
    ) => {
      setDialog({ kind, id, preset });
    },
    []
  );

  const closeDialog = useCallback(() => {
    setDialog({ kind: null, id: null });
  }, []);

  const upsertClient: CrmContextValue["upsertClient"] = useCallback(
    async (input) => {
      const id = await saveClient(input);
      await refresh();
      return id;
    },
    [refresh]
  );

  const deleteClient = useCallback(
    async (id: string) => {
      await removeClient(id);
      await refresh();
    },
    [refresh]
  );

  const upsertProject: CrmContextValue["upsertProject"] = useCallback(
    async (input) => {
      const id = await saveProject(input);
      await refresh();
      return id;
    },
    [refresh]
  );

  const deleteProject = useCallback(
    async (id: string) => {
      await removeProject(id);
      await refresh();
    },
    [refresh]
  );

  const upsertPayment: CrmContextValue["upsertPayment"] = useCallback(
    async (input) => {
      const id = await savePayment(input);
      await refresh();
      return id;
    },
    [refresh]
  );

  const deletePayment = useCallback(
    async (id: string) => {
      await removePayment(id);
      await refresh();
    },
    [refresh]
  );

  const upsertEvent: CrmContextValue["upsertEvent"] = useCallback(
    async (input) => {
      const id = await saveEvent(input);
      await refresh();
      return id;
    },
    [refresh]
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      await removeEvent(id);
      await refresh();
    },
    [refresh]
  );

  const upsertPossibleClient: CrmContextValue["upsertPossibleClient"] = useCallback(
    async (input) => {
      const id = await savePossibleClient(input);
      await refresh();
      return id;
    },
    [refresh]
  );

  const deletePossibleClient = useCallback(
    async (id: string) => {
      await removePossibleClient(id);
      await refresh();
    },
    [refresh]
  );

  const updateSettings = useCallback(
    async (patch: Partial<StudioSettings>) => {
      await saveSettings(patch);
      await refresh();
    },
    [refresh]
  );

  const value = useMemo<CrmContextValue>(
    () => ({
      ready,
      data,
      dialog,
      openDialog,
      closeDialog,
      upsertClient,
      deleteClient,
      upsertProject,
      deleteProject,
      upsertPayment,
      deletePayment,
      upsertEvent,
      deleteEvent,
      upsertPossibleClient,
      deletePossibleClient,
      updateSettings,
    }),
    [
      closeDialog,
      data,
      deleteClient,
      deleteEvent,
      deletePayment,
      deletePossibleClient,
      deleteProject,
      dialog,
      openDialog,
      ready,
      updateSettings,
      upsertClient,
      upsertEvent,
      upsertPayment,
      upsertPossibleClient,
      upsertProject,
    ]
  );

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm must be used within CrmProvider");
  return ctx;
}
