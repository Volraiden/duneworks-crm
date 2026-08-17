"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CompanyCard } from "@/components/pipeline/company-card";
import type { Client, ClientNote, PipelineStage, TeamMember } from "@/lib/types";

export function PipelineColumn({
  stage,
  companies,
  team,
  notes,
  disabled,
  onOpen,
}: {
  stage: PipelineStage;
  companies: Client[];
  team: TeamMember[];
  notes: ClientNote[];
  disabled?: boolean;
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    disabled,
    data: { type: "column", stageId: stage.id },
  });
  const total = companies.reduce((sum, company) => sum + company.potentialValue, 0);

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex w-[280px] shrink-0 flex-col rounded-2xl border bg-black/15 p-3 transition",
        isOver ? "border-gold/50 bg-gold/5" : "border-white/8"
      )}
    >
      <header className="mb-3 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: stage.color }}
            />
            <h2 className="text-sm font-medium">{stage.name}</h2>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {companies.length} · {formatCurrency(total, true)}
          </p>
        </div>
      </header>
      <div className="flex min-h-[220px] flex-1 flex-col gap-2">
        {companies.map((client) => (
          <DraggableCard
            key={client.id}
            client={client}
            assignee={team.find((member) => member.id === client.assignedUserId)}
            lastNote={notes.find((note) => note.clientId === client.id)?.body}
            disabled={disabled}
            onOpen={() => onOpen(client.id)}
          />
        ))}
      </div>
    </section>
  );
}

function DraggableCard({
  client,
  assignee,
  lastNote,
  disabled,
  onOpen,
}: {
  client: Client;
  assignee?: TeamMember;
  lastNote?: string;
  disabled?: boolean;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: client.id,
    disabled,
    data: { type: "card", clientId: client.id, stageId: client.stageId },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.35 : 1,
      }}
      className={cn(isDragging && "cursor-grabbing")}
      {...listeners}
      {...attributes}
    >
      <CompanyCard
        client={client}
        assignee={assignee}
        lastNote={lastNote}
        onOpen={onOpen}
      />
    </div>
  );
}
