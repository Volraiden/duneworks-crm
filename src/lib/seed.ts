import bcrypt from "bcryptjs";
import type { PrismaClient } from "@/generated/prisma/client";
import { DEFAULT_SETTINGS } from "@/lib/empty-data";
import {
  DEFAULT_PIPELINE_STAGES,
  LEGACY_SAMPLE_IDS,
  STUDIO_ADMIN,
} from "@/lib/seed-config";

export async function ensureStudioSeed(prisma: PrismaClient) {
  await prisma.studioSettings.upsert({
    where: { id: "studio" },
    update: {},
    create: {
      id: "studio",
      studioName: DEFAULT_SETTINGS.studioName,
      email: STUDIO_ADMIN.email,
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
    where: { email: STUDIO_ADMIN.email.toLowerCase() },
  });
  if (!existingAdmin) {
    const adminHash = await bcrypt.hash(STUDIO_ADMIN.password, 10);
    await prisma.user.create({
      data: {
        id: STUDIO_ADMIN.id,
        name: STUDIO_ADMIN.name,
        email: STUDIO_ADMIN.email.toLowerCase(),
        passwordHash: adminHash,
        role: STUDIO_ADMIN.role,
        active: true,
      },
    });
  } else {
    const adminHash = await bcrypt.hash(STUDIO_ADMIN.password, 10);
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        name: STUDIO_ADMIN.name,
        role: STUDIO_ADMIN.role,
        active: true,
        passwordHash: adminHash,
      },
    });
  }

  await prisma.user.updateMany({
    where: { role: "Studio Lead" },
    data: { role: "Admin" },
  });

  await removeLegacySampleData(prisma);
}

async function removeLegacySampleData(prisma: PrismaClient) {
  await prisma.payment.deleteMany({
    where: { id: { in: [...LEGACY_SAMPLE_IDS.payments] } },
  });
  await prisma.project.deleteMany({
    where: { id: { in: [...LEGACY_SAMPLE_IDS.projects] } },
  });
  await prisma.calendarEvent.deleteMany({
    where: {
      OR: [
        { clientId: { in: [...LEGACY_SAMPLE_IDS.clients] } },
        { title: "Redcedar demo on the lot" },
      ],
    },
  });
  await prisma.client.deleteMany({
    where: { id: { in: [...LEGACY_SAMPLE_IDS.clients] } },
  });
  await prisma.user.deleteMany({
    where: {
      OR: [
        { id: { in: [...LEGACY_SAMPLE_IDS.users] } },
        { email: { in: [...LEGACY_SAMPLE_IDS.userEmails] } },
      ],
    },
  });
}
