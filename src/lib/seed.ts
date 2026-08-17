import bcrypt from "bcryptjs";
import type { PrismaClient } from "@/generated/prisma/client";
import { DEFAULT_SETTINGS } from "@/lib/empty-data";
import {
  DEFAULT_PIPELINE_STAGES,
  DEMO_ADMIN,
  DEMO_COMPANIES,
  DEMO_PAYMENTS,
  DEMO_PROJECTS,
  DEMO_TEAM,
} from "@/lib/seed-config";
import { fromDateOnly } from "@/lib/mappers";

function statusForStage(kind: string) {
  if (kind === "paid") return "Active";
  if (kind === "denied") return "Denied";
  return "Lead";
}

export async function ensureStudioSeed(prisma: PrismaClient) {
  await prisma.studioSettings.upsert({
    where: { id: "studio" },
    update: {},
    create: {
      id: "studio",
      studioName: DEFAULT_SETTINGS.studioName,
      email: DEMO_ADMIN.email,
      phone: DEFAULT_SETTINGS.phone,
      website: DEFAULT_SETTINGS.website,
      address: DEFAULT_SETTINGS.address,
      appearance: "dark",
    },
  });

  for (const stage of DEFAULT_PIPELINE_STAGES) {
    await prisma.pipelineStage.upsert({
      where: { id: stage.id },
      update: {
        name: stage.name,
        slug: stage.slug,
        kind: stage.kind,
      },
      create: { ...stage },
    });
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: DEMO_ADMIN.email.toLowerCase() },
  });
  if (!existingAdmin) {
    const adminHash = await bcrypt.hash(DEMO_ADMIN.password, 10);
    await prisma.user.create({
      data: {
        id: DEMO_ADMIN.id,
        name: DEMO_ADMIN.name,
        email: DEMO_ADMIN.email.toLowerCase(),
        passwordHash: adminHash,
        role: DEMO_ADMIN.role,
        active: true,
      },
    });
  } else {
    const adminHash = await bcrypt.hash(DEMO_ADMIN.password, 10);
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        name: DEMO_ADMIN.name,
        role: DEMO_ADMIN.role,
        active: true,
        passwordHash: adminHash,
      },
    });
  }

  for (const member of DEMO_TEAM) {
    const exists = await prisma.user.findUnique({
      where: { email: member.email.toLowerCase() },
    });
    if (exists) continue;
    const passwordHash = await bcrypt.hash(member.password, 10);
    await prisma.user.create({
      data: {
        id: member.id,
        name: member.name,
        email: member.email.toLowerCase(),
        passwordHash,
        role: member.role,
        active: true,
      },
    });
  }

  await prisma.user.updateMany({
    where: { role: "Studio Lead" },
    data: { role: "Admin" },
  });

  const users = await prisma.user.findMany();
  const idByEmail = Object.fromEntries(users.map((user) => [user.email, user.id]));
  const userIds: Record<string, string> = {
    [DEMO_ADMIN.id]: idByEmail[DEMO_ADMIN.email.toLowerCase()] ?? DEMO_ADMIN.id,
    ...Object.fromEntries(
      DEMO_TEAM.map((member) => [
        member.id,
        idByEmail[member.email.toLowerCase()] ?? member.id,
      ])
    ),
  };

  const clientCount = await prisma.client.count();
  if (clientCount > 0) return;

  const stageById = Object.fromEntries(
    DEFAULT_PIPELINE_STAGES.map((stage) => [stage.id, stage])
  );

  for (const [index, company] of DEMO_COMPANIES.entries()) {
    const stage = stageById[company.stageId];
    await prisma.client.create({
      data: {
        id: company.id,
        clientNumber: company.clientNumber,
        name: company.name,
        company: company.company,
        industry: company.industry,
        email: company.email,
        phone: company.phone,
        potentialValue: company.potentialValue,
        source: company.source,
        assignedUserId: userIds[company.assignedUserId] ?? null,
        stageId: company.stageId,
        status: statusForStage(stage.kind),
        tags: JSON.stringify(company.tags),
        notes: company.notes,
        sortOrder: index,
        createdAt: fromDateOnly(company.createdAt),
        lastActivity: fromDateOnly(company.createdAt),
      },
    });

    await prisma.clientActivity.create({
      data: {
        clientId: company.id,
        userId: userIds[company.assignedUserId] ?? userIds[DEMO_ADMIN.id],
        type: "created",
        body: `Added ${company.company} to the pipeline.`,
      },
    });

    await prisma.clientNote.create({
      data: {
        clientId: company.id,
        userId: userIds[company.assignedUserId] ?? userIds[DEMO_ADMIN.id],
        body: company.lastNote,
      },
    });

    if ("deniedReason" in company && company.deniedReason) {
      await prisma.clientActivity.create({
        data: {
          clientId: company.id,
          userId: userIds[company.assignedUserId] ?? userIds[DEMO_ADMIN.id],
          type: "denied",
          fromStage: "In Discussion",
          toStage: "Denied",
          reason: company.deniedReason,
          body: company.deniedReason,
        },
      });
    }
  }

  for (const project of DEMO_PROJECTS) {
    await prisma.project.create({
      data: {
        id: project.id,
        name: project.name,
        clientId: project.clientId,
        type: project.type,
        budget: project.budget,
        deadline: fromDateOnly(project.deadline),
        status: project.status,
        progress: project.progress,
        notes: project.notes,
        checklist: JSON.stringify([
          { id: `${project.id}_lock`, label: "Lock schedule", done: true },
          { id: `${project.id}_crew`, label: "Confirm crew", done: false },
        ]),
      },
    });
  }

  for (const payment of DEMO_PAYMENTS) {
    await prisma.payment.create({
      data: {
        id: payment.id,
        date: fromDateOnly(payment.date),
        clientId: payment.clientId,
        projectId: payment.projectId,
        amount: payment.amount,
        status: payment.status,
        method: payment.method,
        invoiceNumber: payment.invoiceNumber,
        notes: payment.notes,
      },
    });
  }

  await prisma.calendarEvent.create({
    data: {
      title: "Redcedar demo on the lot",
      date: fromDateOnly("2026-08-20"),
      type: "meeting",
      notes: "Walk through the trail-running spots.",
      clientId: "co_redcedar",
    },
  });
}
