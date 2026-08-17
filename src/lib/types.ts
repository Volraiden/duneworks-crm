import type { Role } from "@/lib/permissions";

export const CLIENT_STATUSES = ["Lead", "Active", "Paused", "Completed", "Denied"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const PROJECT_STATUSES = [
  "Inquiry",
  "Pre-production",
  "Production",
  "Editing",
  "Delivered",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PAYMENT_STATUSES = ["Paid", "Pending", "Overdue"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = [
  "Wire",
  "ACH",
  "Credit Card",
  "Check",
  "PayPal",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const EVENT_TYPES = ["deadline", "meeting", "shoot", "payment"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const CLIENT_TAGS = [
  "Music Video",
  "Brand Campaign",
  "Commercial",
  "Event",
  "Film",
] as const;
export type ClientTag = (typeof CLIENT_TAGS)[number];

export const CLIENT_SOURCES = [
  "Referral",
  "Website",
  "Instagram",
  "Cold outreach",
  "Repeat inquiry",
  "Festival",
] as const;
export type ClientSource = (typeof CLIENT_SOURCES)[number];

export const APPEARANCE_OPTIONS = ["dark", "light", "system"] as const;
export type Appearance = (typeof APPEARANCE_OPTIONS)[number];

export const STAGE_KINDS = [
  "possible",
  "contacted",
  "demo",
  "discussion",
  "trial",
  "paid",
  "denied",
  "custom",
] as const;
export type StageKind = (typeof STAGE_KINDS)[number];

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
}

export interface PipelineStage {
  id: string;
  name: string;
  slug: string;
  color: string;
  sortOrder: number;
  kind: StageKind;
}

export interface ClientNote {
  id: string;
  clientId: string;
  userId: string;
  body: string;
  createdAt: string;
}

export interface ClientActivity {
  id: string;
  clientId: string;
  userId: string | null;
  type: "created" | "stage_move" | "note" | "denied" | "updated";
  fromStage: string;
  toStage: string;
  reason: string;
  body: string;
  createdAt: string;
}

export interface Client {
  id: string;
  clientNumber: string;
  name: string;
  company: string;
  industry: string;
  email: string;
  phone: string;
  potentialValue: number;
  source: string;
  assignedUserId: string | null;
  stageId: string;
  status: ClientStatus;
  tags: string[];
  notes: string;
  sortOrder: number;
  createdAt: string;
  lastActivity: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  type: string;
  budget: number;
  deadline: string;
  status: ProjectStatus;
  progress: number;
  notes: string;
  checklist: ChecklistItem[];
  createdAt: string;
}

export interface Payment {
  id: string;
  date: string;
  clientId: string;
  projectId: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  invoiceNumber: string;
  notes: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: EventType;
  notes: string;
  clientId?: string;
  projectId?: string;
}

export interface NotificationPrefs {
  projectDeadlines: boolean;
  paymentReminders: boolean;
  newLeads: boolean;
  weeklyDigest: boolean;
}

export interface StudioSettings {
  studioName: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  notifications: NotificationPrefs;
  appearance: Appearance;
}

export interface CrmData {
  clients: Client[];
  projects: Project[];
  payments: Payment[];
  events: CalendarEvent[];
  stages: PipelineStage[];
  team: TeamMember[];
  notes: ClientNote[];
  activities: ClientActivity[];
  settings: StudioSettings;
}

export type DialogKind =
  | "client"
  | "project"
  | "payment"
  | "event"
  | "clientDetail"
  | "projectDetail"
  | "paymentDetail"
  | "stage"
  | "deny";

export interface DialogState {
  kind: DialogKind | null;
  id: string | null;
  preset?: Record<string, string>;
}

export function isPaidClient(client: Client, stages: PipelineStage[]) {
  const stage = stages.find((item) => item.id === client.stageId);
  return client.status === "Active" || stage?.kind === "paid";
}

export function isDeniedStage(stage: PipelineStage | undefined) {
  return stage?.kind === "denied";
}

export function isPaidStage(stage: PipelineStage | undefined) {
  return stage?.kind === "paid";
}
