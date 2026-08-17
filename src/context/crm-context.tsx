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
  addClientNote,
  getCrmData,
  moveClient,
  removeClient,
  removeEvent,
  removePayment,
  removeProject,
  saveClient,
  saveEvent,
  savePayment,
  saveProject,
  saveSettings,
} from "@/app/actions/crm";
import { deleteStage, reorderStages, saveStage } from "@/app/actions/pipeline";
import { EMPTY_CRM_DATA } from "@/lib/empty-data";
import type {
  CalendarEvent,
  Client,
  CrmData,
  DialogState,
  Payment,
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
  refresh: () => Promise<void>;
  upsertClient: (
    input: Omit<Client, "id" | "createdAt" | "lastActivity" | "clientNumber" | "sortOrder"> & {
      id?: string;
    }
  ) => Promise<string>;
  deleteClient: (id: string) => Promise<void>;
  moveCompany: (input: {
    id: string;
    stageId: string;
    reason?: string;
    notes?: string;
    beforeId?: string | null;
  }) => Promise<void>;
  addNote: (clientId: string, body: string) => Promise<void>;
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
  updateSettings: (patch: Partial<StudioSettings>) => Promise<void>;
  upsertStage: (input: { id?: string; name: string; color: string }) => Promise<string>;
  removeStage: (id: string) => Promise<{ ok: boolean; error?: string }>;
  sortStages: (ids: string[]) => Promise<void>;
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

  const moveCompany: CrmContextValue["moveCompany"] = useCallback(
    async (input) => {
      await moveClient(input);
      await refresh();
    },
    [refresh]
  );

  const addNote = useCallback(
    async (clientId: string, body: string) => {
      await addClientNote(clientId, body);
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

  const updateSettings = useCallback(
    async (patch: Partial<StudioSettings>) => {
      await saveSettings(patch);
      await refresh();
    },
    [refresh]
  );

  const upsertStage = useCallback(
    async (input: { id?: string; name: string; color: string }) => {
      const result = await saveStage(input);
      if (!result.ok) throw new Error(result.error);
      await refresh();
      return result.id;
    },
    [refresh]
  );

  const removeStage = useCallback(
    async (id: string) => {
      const result = await deleteStage(id);
      if (result.ok) await refresh();
      return result;
    },
    [refresh]
  );

  const sortStages = useCallback(
    async (ids: string[]) => {
      await reorderStages(ids);
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
      refresh,
      upsertClient,
      deleteClient,
      moveCompany,
      addNote,
      upsertProject,
      deleteProject,
      upsertPayment,
      deletePayment,
      upsertEvent,
      deleteEvent,
      updateSettings,
      upsertStage,
      removeStage,
      sortStages,
    }),
    [
      addNote,
      closeDialog,
      data,
      deleteClient,
      deleteEvent,
      deletePayment,
      deleteProject,
      dialog,
      moveCompany,
      openDialog,
      ready,
      refresh,
      removeStage,
      sortStages,
      updateSettings,
      upsertClient,
      upsertEvent,
      upsertPayment,
      upsertProject,
      upsertStage,
    ]
  );

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm must be used within CrmProvider");
  return ctx;
}
