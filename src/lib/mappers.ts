import type {
  Appearance,
  CalendarEvent,
  ChecklistItem,
  Client,
  ClientActivity,
  ClientNote,
  ClientStatus,
  EventType,
  Payment,
  PaymentMethod,
  PaymentStatus,
  PipelineStage,
  Project,
  ProjectStatus,
  StageKind,
  StudioSettings,
  TeamMember,
} from "@/lib/types";
import { normalizeRole } from "@/lib/permissions";
import type {
  CalendarEvent as DbEvent,
  Client as DbClient,
  ClientActivity as DbActivity,
  ClientNote as DbNote,
  Payment as DbPayment,
  PipelineStage as DbStage,
  Project as DbProject,
  StudioSettings as DbSettings,
  User as DbUser,
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

export function mapTeamMember(row: DbUser): TeamMember {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: normalizeRole(row.role),
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapStage(row: DbStage): PipelineStage {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    color: row.color,
    sortOrder: row.sortOrder,
    kind: row.kind as StageKind,
  };
}

export function mapClient(row: DbClient): Client {
  return {
    id: row.id,
    clientNumber: row.clientNumber,
    name: row.name,
    company: row.company,
    industry: row.industry,
    email: row.email,
    phone: row.phone,
    potentialValue: row.potentialValue,
    source: row.source,
    assignedUserId: row.assignedUserId,
    stageId: row.stageId,
    status: row.status as ClientStatus,
    tags: parseJson<string[]>(row.tags, []),
    notes: row.notes,
    sortOrder: row.sortOrder,
    createdAt: toDateOnly(row.createdAt),
    lastActivity: toDateOnly(row.lastActivity),
  };
}

export function mapNote(row: DbNote): ClientNote {
  return {
    id: row.id,
    clientId: row.clientId,
    userId: row.userId,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}

const ACTIVITY_TYPES: ClientActivity["type"][] = [
  "created",
  "stage_move",
  "note",
  "denied",
  "updated",
  "payment_received",
  "project_created",
  "project_completed",
];

export function mapActivity(row: DbActivity): ClientActivity {
  const type = row.type as ClientActivity["type"];
  return {
    id: row.id,
    clientId: row.clientId,
    userId: row.userId,
    type: ACTIVITY_TYPES.includes(type) ? type : "updated",
    fromStage: row.fromStage,
    toStage: row.toStage,
    reason: row.reason,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
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
    updatedAt: toDateOnly(row.updatedAt),
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
    createdAt: toDateOnly(row.createdAt),
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

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}
