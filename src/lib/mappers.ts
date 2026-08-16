import type {
  Appearance,
  CalendarEvent,
  ChecklistItem,
  Client,
  ClientStatus,
  EventType,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Project,
  ProjectStatus,
  StudioSettings,
} from "@/lib/types";
import type {
  CalendarEvent as DbEvent,
  Client as DbClient,
  Payment as DbPayment,
  Project as DbProject,
  StudioSettings as DbSettings,
} from "@/generated/prisma/client";

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function mapClient(row: DbClient): Client {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    email: row.email,
    phone: row.phone,
    status: row.status as ClientStatus,
    tags: parseJson<string[]>(row.tags, []),
    notes: row.notes,
    createdAt: toDateOnly(row.createdAt),
    lastActivity: toDateOnly(row.lastActivity),
  };
}

export function mapProject(row: DbProject): Project {
  return {
    id: row.id,
    name: row.name,
    clientId: row.clientId,
    type: row.type,
    budget: row.budget,
    deadline: toDateOnly(row.deadline),
    status: row.status as ProjectStatus,
    progress: row.progress,
    notes: row.notes,
    checklist: parseJson<ChecklistItem[]>(row.checklist, []),
    createdAt: toDateOnly(row.createdAt),
  };
}

export function mapPayment(row: DbPayment): Payment {
  return {
    id: row.id,
    date: toDateOnly(row.date),
    clientId: row.clientId,
    projectId: row.projectId,
    amount: row.amount,
    status: row.status as PaymentStatus,
    method: row.method as PaymentMethod,
    invoiceNumber: row.invoiceNumber,
    notes: row.notes,
  };
}

export function mapEvent(row: DbEvent): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    date: toDateOnly(row.date),
    type: row.type as EventType,
    notes: row.notes,
    clientId: row.clientId ?? undefined,
    projectId: row.projectId ?? undefined,
  };
}

export function mapSettings(row: DbSettings): StudioSettings {
  return {
    studioName: row.studioName,
    email: row.email,
    phone: row.phone,
    website: row.website,
    address: row.address,
    notifications: {
      projectDeadlines: row.projectDeadlines,
      paymentReminders: row.paymentReminders,
      newLeads: row.newLeads,
      weeklyDigest: row.weeklyDigest,
    },
    appearance: row.appearance as Appearance,
  };
}

export function fromDateOnly(value: string) {
  return new Date(`${value.slice(0, 10)}T12:00:00.000Z`);
}
