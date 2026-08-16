export const CLIENT_STATUSES = ["Lead", "Active", "Paused", "Completed"] as const;
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

export const APPEARANCE_OPTIONS = ["dark", "light", "system"] as const;
export type Appearance = (typeof APPEARANCE_OPTIONS)[number];

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: ClientStatus;
  tags: string[];
  notes: string;
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
  settings: StudioSettings;
}

export type DialogKind =
  | "client"
  | "project"
  | "payment"
  | "event"
  | "clientDetail"
  | "projectDetail"
  | "paymentDetail";

export interface DialogState {
  kind: DialogKind | null;
  id: string | null;
  preset?: Record<string, string>;
}
