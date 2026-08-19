"use server";

import { getPrisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { EMPTY_CRM_DATA } from "@/lib/empty-data";
import { assertCan, requireUser } from "@/lib/guard";
import {
  fromDateOnly,
  mapActivity,
  mapClient,
  mapEvent,
  mapNote,
  mapPayment,
  mapProject,
  mapSettings,
  mapStage,
  mapTeamMember,
} from "@/lib/mappers";
import type {
  CalendarEvent,
  Client,
  CrmData,
  Payment,
  Project,
  StudioSettings,
} from "@/lib/types";

async function nextClientNumber(prisma: Awaited<ReturnType<typeof getPrisma>>) {
  const rows = await prisma.client.findMany({ select: { clientNumber: true } });
  const max = rows.reduce((highest, row) => {
    const value = Number.parseInt(row.clientNumber.replace(/\D/g, ""), 10);
    return Number.isFinite(value) ? Math.max(highest, value) : highest;
  }, 1023);
  return `DW-${max + 1}`;
}

function statusFromKind(kind: string) {
  if (kind === "paid") return "Active";
  if (kind === "denied") return "Denied";
  return "Lead";
}

async function resolveCreateStage(
  prisma: Awaited<ReturnType<typeof getPrisma>>,
  stageId?: string
) {
  if (stageId) {
    const stage = await prisma.pipelineStage.findUnique({ where: { id: stageId } });
    if (stage) return stage;
  }
  return prisma.pipelineStage.findFirst({
    where: { kind: { not: "denied" } },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getCrmData(): Promise<CrmData> {
  const session = await getSession();
  if (!session) return EMPTY_CRM_DATA;

  const prisma = await getPrisma();
  const [
    clients,
    projects,
    payments,
    events,
    stages,
    team,
    notes,
    activities,
    settings,
  ] = await Promise.all([
    prisma.client.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }),
    prisma.project.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.payment.findMany({ orderBy: { date: "desc" } }),
    prisma.calendarEvent.findMany({ orderBy: { date: "asc" } }),
    prisma.pipelineStage.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.clientNote.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.clientActivity.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.studioSettings.findUnique({ where: { id: "studio" } }),
  ]);

  return {
    clients: clients.map(mapClient),
    projects: projects.map(mapProject),
    payments: payments.map(mapPayment),
    events: events.map(mapEvent),
    stages: stages.map(mapStage),
    team: team.map(mapTeamMember),
    notes: notes.map(mapNote),
    activities: activities.map(mapActivity),
    settings: settings ? mapSettings(settings) : EMPTY_CRM_DATA.settings,
  };
}

export async function saveClient(
  input: Omit<Client, "id" | "createdAt" | "lastActivity" | "clientNumber" | "sortOrder"> & {
    id?: string;
    clientNumber?: string;
    sortOrder?: number;
  }
) {
  const { prisma, actor, role } = await requireUser();
  assertCan(role, input.id ? "editRecords" : "createRecords");
  const stage = input.id
    ? await prisma.pipelineStage.findUnique({ where: { id: input.stageId } })
    : await resolveCreateStage(prisma, input.stageId);
  if (!stage) throw new Error("Choose a pipeline stage.");

  const data = {
    name: input.name,
    company: input.company,
    industry: input.industry,
    email: input.email,
    phone: input.phone,
    potentialValue: input.potentialValue,
    source: input.source,
    assignedUserId: input.assignedUserId,
    stageId: stage.id,
    status: statusFromKind(stage.kind),
    tags: JSON.stringify(input.tags),
    notes: input.notes,
    lastActivity: new Date(),
  };

  if (input.id) {
    const previous = await prisma.client.findUnique({ where: { id: input.id } });
    const row = await prisma.client.update({ where: { id: input.id }, data });
    if (previous && previous.stageId !== stage.id) {
      await prisma.clientActivity.create({
        data: {
          clientId: row.id,
          userId: actor.id,
          type: stage.kind === "denied" ? "denied" : "stage_move",
          fromStage: previous.stageId,
          toStage: stage.id,
          body: `Moved to ${stage.name}.`,
        },
      });
    } else {
      await prisma.clientActivity.create({
        data: {
          clientId: row.id,
          userId: actor.id,
          type: "updated",
          body: "Company details updated.",
        },
      });
    }
    return row.id;
  }

  const countInStage = await prisma.client.count({ where: { stageId: stage.id } });
  const row = await prisma.client.create({
    data: {
      ...data,
      clientNumber: await nextClientNumber(prisma),
      sortOrder: countInStage,
    },
  });
  await prisma.clientActivity.create({
    data: {
      clientId: row.id,
      userId: actor.id,
      type: "created",
      toStage: stage.name,
      body: `Added ${row.company} to ${stage.name}.`,
    },
  });
  return row.id;
}

export async function removeClient(id: string) {
  const { prisma, role } = await requireUser();
  assertCan(role, "deleteRecords");
  await prisma.client.delete({ where: { id } });
}

export async function moveClient(input: {
  id: string;
  stageId: string;
  reason?: string;
  notes?: string;
  beforeId?: string | null;
}) {
  const { prisma, actor, role } = await requireUser();
  assertCan(role, "movePipeline");

  const client = await prisma.client.findUnique({ where: { id: input.id } });
  const stage = await prisma.pipelineStage.findUnique({ where: { id: input.stageId } });
  if (!client || !stage) throw new Error("Company or stage not found.");

  if (stage.kind === "denied" && !input.reason?.trim()) {
    throw new Error("A denial reason is required.");
  }

  const siblings = await prisma.client.findMany({
    where: { stageId: input.stageId, id: { not: input.id } },
    orderBy: { sortOrder: "asc" },
  });
  const orderedIds = siblings.map((row) => row.id);
  const insertAt = input.beforeId
    ? Math.max(0, orderedIds.indexOf(input.beforeId))
    : orderedIds.length;
  if (input.beforeId && orderedIds.includes(input.beforeId)) {
    orderedIds.splice(insertAt, 0, input.id);
  } else {
    orderedIds.push(input.id);
  }

  await prisma.client.update({
    where: { id: input.id },
    data: {
      stageId: stage.id,
      status: statusFromKind(stage.kind),
      lastActivity: new Date(),
      notes: input.notes?.trim()
        ? `${client.notes}\n${input.notes.trim()}`.trim()
        : client.notes,
    },
  });

  await Promise.all(
    orderedIds.map((id, index) =>
      prisma.client.update({ where: { id }, data: { sortOrder: index } })
    )
  );

  if (client.stageId !== stage.id) {
    const fromStage = await prisma.pipelineStage.findUnique({
      where: { id: client.stageId },
    });
    await prisma.clientActivity.create({
      data: {
        clientId: client.id,
        userId: actor.id,
        type: stage.kind === "denied" ? "denied" : "stage_move",
        fromStage: fromStage?.name ?? "",
        toStage: stage.name,
        reason: input.reason?.trim() ?? "",
        body: input.notes?.trim() || `Moved from ${fromStage?.name ?? "previous"} to ${stage.name}.`,
      },
    });
  }
}

export async function addClientNote(clientId: string, body: string) {
  const { prisma, actor, role } = await requireUser();
  assertCan(role, "addNotes");
  const text = body.trim();
  if (!text) throw new Error("Note cannot be empty.");
  await prisma.clientNote.create({
    data: { clientId, userId: actor.id, body: text },
  });
  await prisma.client.update({
    where: { id: clientId },
    data: { lastActivity: new Date() },
  });
  await prisma.clientActivity.create({
    data: {
      clientId,
      userId: actor.id,
      type: "note",
      body: text,
    },
  });
}

export async function saveProject(
  input: Omit<Project, "id" | "createdAt" | "updatedAt"> & { id?: string }
) {
  const { prisma, actor, role } = await requireUser();
  assertCan(role, input.id ? "editRecords" : "createRecords");
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

  const previous = input.id
    ? await prisma.project.findUnique({ where: { id: input.id } })
    : null;
  const row = input.id
    ? await prisma.project.update({ where: { id: input.id }, data })
    : await prisma.project.create({ data });

  await prisma.client.update({
    where: { id: input.clientId },
    data: { lastActivity: new Date() },
  });

  if (!input.id) {
    await prisma.clientActivity.create({
      data: {
        clientId: input.clientId,
        userId: actor.id,
        type: "project_created",
        body: `Project created: ${row.name}.`,
      },
    });
  } else if (previous && previous.status !== "Delivered" && row.status === "Delivered") {
    await prisma.clientActivity.create({
      data: {
        clientId: input.clientId,
        userId: actor.id,
        type: "project_completed",
        body: `Project completed: ${row.name}.`,
      },
    });
  }

  return row.id;
}

export async function removeProject(id: string) {
  const { prisma, role } = await requireUser();
  assertCan(role, "deleteRecords");
  await prisma.project.delete({ where: { id } });
}

export async function savePayment(
  input: Omit<Payment, "id" | "createdAt"> & { id?: string }
) {
  const { prisma, actor, role } = await requireUser();
  assertCan(role, "managePayments");
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

  const previous = input.id
    ? await prisma.payment.findUnique({ where: { id: input.id } })
    : null;
  const row = input.id
    ? await prisma.payment.update({ where: { id: input.id }, data })
    : await prisma.payment.create({ data });

  await prisma.client.update({
    where: { id: input.clientId },
    data: { lastActivity: new Date() },
  });

  const becamePaid =
    input.status === "Paid" && (!previous || previous.status !== "Paid");
  if (becamePaid) {
    await prisma.clientActivity.create({
      data: {
        clientId: input.clientId,
        userId: actor.id,
        type: "payment_received",
        body: `Payment received: ${row.invoiceNumber}.`,
      },
    });
  }

  return row.id;
}

export async function removePayment(id: string) {
  const { prisma, role } = await requireUser();
  assertCan(role, "deleteRecords");
  await prisma.payment.delete({ where: { id } });
}

export async function saveEvent(
  input: Omit<CalendarEvent, "id"> & { id?: string }
) {
  const { prisma, role } = await requireUser();
  assertCan(role, input.id ? "editRecords" : "createRecords");
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
  const { prisma, role } = await requireUser();
  assertCan(role, "deleteRecords");
  await prisma.calendarEvent.delete({ where: { id } });
}

export async function saveSettings(patch: Partial<StudioSettings>) {
  const { prisma, role } = await requireUser();
  assertCan(role, "manageSettings");
  const current = await prisma.studioSettings.findUnique({ where: { id: "studio" } });
  if (!current) throw new Error("Studio settings missing.");
  const mapped = mapSettings(current);
  const next: StudioSettings = {
    ...mapped,
    ...patch,
    notifications: {
      ...mapped.notifications,
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
