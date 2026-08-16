"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { DEFAULT_SETTINGS, EMPTY_CRM_DATA } from "@/lib/empty-data";
import {
  fromDateOnly,
  mapClient,
  mapEvent,
  mapPayment,
  mapProject,
  mapSettings,
} from "@/lib/mappers";
import type {
  CalendarEvent,
  Client,
  CrmData,
  Payment,
  Project,
  StudioSettings,
} from "@/lib/types";

async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

async function ensureSettings() {
  const existing = await prisma.studioSettings.findUnique({
    where: { id: "studio" },
  });
  if (existing) return existing;
  return prisma.studioSettings.create({
    data: {
      id: "studio",
      studioName: DEFAULT_SETTINGS.studioName,
      email: DEFAULT_SETTINGS.email,
      phone: DEFAULT_SETTINGS.phone,
      website: DEFAULT_SETTINGS.website,
      address: DEFAULT_SETTINGS.address,
    },
  });
}

export async function getCrmData(): Promise<CrmData> {
  const session = await getSession();
  if (!session) return EMPTY_CRM_DATA;

  const [clients, projects, payments, events, settings] = await Promise.all([
    prisma.client.findMany({ orderBy: { lastActivity: "desc" } }),
    prisma.project.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.payment.findMany({ orderBy: { date: "desc" } }),
    prisma.calendarEvent.findMany({ orderBy: { date: "asc" } }),
    ensureSettings(),
  ]);

  return {
    clients: clients.map(mapClient),
    projects: projects.map(mapProject),
    payments: payments.map(mapPayment),
    events: events.map(mapEvent),
    settings: mapSettings(settings),
  };
}

export async function saveClient(
  input: Omit<Client, "id" | "createdAt" | "lastActivity"> & { id?: string }
) {
  await requireSession();
  const now = new Date();
  const data = {
    name: input.name,
    company: input.company,
    email: input.email,
    phone: input.phone,
    status: input.status,
    tags: JSON.stringify(input.tags),
    notes: input.notes,
    lastActivity: now,
  };

  const row = input.id
    ? await prisma.client.update({ where: { id: input.id }, data })
    : await prisma.client.create({ data });

  return row.id;
}

export async function removeClient(id: string) {
  await requireSession();
  await prisma.client.delete({ where: { id } });
}

export async function saveProject(
  input: Omit<Project, "id" | "createdAt"> & { id?: string }
) {
  await requireSession();
  const data = {
    name: input.name,
    clientId: input.clientId,
    type: input.type,
    budget: input.budget,
    deadline: fromDateOnly(input.deadline),
    status: input.status,
    progress: input.progress,
    notes: input.notes,
    checklist: JSON.stringify(input.checklist),
  };

  const row = input.id
    ? await prisma.project.update({ where: { id: input.id }, data })
    : await prisma.project.create({ data });

  await prisma.client.update({
    where: { id: input.clientId },
    data: { lastActivity: new Date() },
  });

  return row.id;
}

export async function removeProject(id: string) {
  await requireSession();
  await prisma.project.delete({ where: { id } });
}

export async function savePayment(
  input: Omit<Payment, "id"> & { id?: string }
) {
  await requireSession();
  const data = {
    date: fromDateOnly(input.date),
    clientId: input.clientId,
    projectId: input.projectId,
    amount: input.amount,
    status: input.status,
    method: input.method,
    invoiceNumber: input.invoiceNumber,
    notes: input.notes,
  };

  const row = input.id
    ? await prisma.payment.update({ where: { id: input.id }, data })
    : await prisma.payment.create({ data });

  await prisma.client.update({
    where: { id: input.clientId },
    data: { lastActivity: new Date() },
  });

  return row.id;
}

export async function removePayment(id: string) {
  await requireSession();
  await prisma.payment.delete({ where: { id } });
}

export async function saveEvent(
  input: Omit<CalendarEvent, "id"> & { id?: string }
) {
  await requireSession();
  const data = {
    title: input.title,
    date: fromDateOnly(input.date),
    type: input.type,
    notes: input.notes,
    clientId: input.clientId || null,
    projectId: input.projectId || null,
  };

  const row = input.id
    ? await prisma.calendarEvent.update({ where: { id: input.id }, data })
    : await prisma.calendarEvent.create({ data });

  return row.id;
}

export async function removeEvent(id: string) {
  await requireSession();
  await prisma.calendarEvent.delete({ where: { id } });
}

export async function saveSettings(patch: Partial<StudioSettings>) {
  await requireSession();
  const current = mapSettings(await ensureSettings());
  const next: StudioSettings = {
    ...current,
    ...patch,
    notifications: {
      ...current.notifications,
      ...patch.notifications,
    },
  };

  await prisma.studioSettings.update({
    where: { id: "studio" },
    data: {
      studioName: next.studioName,
      email: next.email,
      phone: next.phone,
      website: next.website,
      address: next.address,
      projectDeadlines: next.notifications.projectDeadlines,
      paymentReminders: next.notifications.paymentReminders,
      newLeads: next.notifications.newLeads,
      weeklyDigest: next.notifications.weeklyDigest,
      appearance: next.appearance,
    },
  });
}
