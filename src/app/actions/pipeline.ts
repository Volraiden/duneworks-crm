"use server";

import { assertCan, requireUser } from "@/lib/guard";
import { mapStage, slugify } from "@/lib/mappers";
import type { PipelineStage } from "@/lib/types";

const SYSTEM_KINDS = new Set(["paid", "denied"]);

export async function saveStage(input: {
  id?: string;
  name: string;
  color: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { prisma, role } = await requireUser();
  assertCan(role, "manageStages");
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Category name is required." };
  const color = input.color || "#c4b49a";

  if (input.id) {
    const row = await prisma.pipelineStage.update({
      where: { id: input.id },
      data: { name, color },
    });
    return { ok: true, id: row.id };
  }

  const last = await prisma.pipelineStage.aggregate({ _max: { sortOrder: true } });
  const slugBase = slugify(name) || `stage-${Date.now()}`;
  let slug = slugBase;
  let attempt = 1;
  while (await prisma.pipelineStage.findUnique({ where: { slug } })) {
    slug = `${slugBase}-${attempt++}`;
  }

  const row = await prisma.pipelineStage.create({
    data: {
      id: `stage_${slug}`,
      name,
      slug,
      color,
      sortOrder: (last._max.sortOrder ?? 0) + 1,
      kind: "custom",
    },
  });
  return { ok: true, id: row.id };
}

export async function reorderStages(ids: string[]): Promise<void> {
  const { prisma, role } = await requireUser();
  assertCan(role, "manageStages");
  await Promise.all(
    ids.map((id, index) =>
      prisma.pipelineStage.update({ where: { id }, data: { sortOrder: index } })
    )
  );
}

export async function deleteStage(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { prisma, role } = await requireUser();
  assertCan(role, "manageStages");
  const stage = await prisma.pipelineStage.findUnique({ where: { id } });
  if (!stage) return { ok: false, error: "Category not found." };
  if (SYSTEM_KINDS.has(stage.kind) || stage.kind !== "custom") {
    return { ok: false, error: "Default pipeline stages cannot be deleted." };
  }
  const fallback = await prisma.pipelineStage.findFirst({
    where: { kind: "possible" },
  });
  if (!fallback) return { ok: false, error: "No fallback stage available." };
  await prisma.client.updateMany({
    where: { stageId: id },
    data: { stageId: fallback.id },
  });
  await prisma.pipelineStage.delete({ where: { id } });
  return { ok: true };
}

export async function listStages(): Promise<PipelineStage[]> {
  const { prisma } = await requireUser();
  const rows = await prisma.pipelineStage.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map(mapStage);
}
