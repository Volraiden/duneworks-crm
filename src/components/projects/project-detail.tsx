"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ProjectStatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { projectRevenue } from "@/lib/analytics";
import type { Client, Payment, Project } from "@/lib/types";

export function ProjectDetail({
  project,
  client,
  payments,
  onEdit,
  onToggleItem,
}: {
  project: Project;
  client?: Client;
  payments: Payment[];
  onEdit: () => void;
  onToggleItem: (itemId: string, done: boolean) => void;
}) {
  const earned = projectRevenue(payments, project.id);
  const remaining = Math.max(0, project.budget - earned);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
            {client?.company ?? "Unassigned"}
          </p>
          <h2 className="font-heading text-3xl">{project.name}</h2>
          <div className="mt-2">
            <ProjectStatusBadge status={project.status} />
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={onEdit}>
          Edit
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Mini label="Budget" value={formatCurrency(project.budget)} />
        <Mini label="Earned" value={formatCurrency(earned)} />
        <Mini label="Remaining" value={formatCurrency(remaining)} />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span>Progress</span>
          <span className="text-muted-foreground">{project.progress}%</span>
        </div>
        <Progress value={project.progress} />
      </div>
      <p className="text-sm text-muted-foreground">
        Deadline · {formatDate(project.deadline)} · {project.type}
      </p>
      <div>
        <h3 className="mb-2 font-medium">Notes</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {project.notes || "No notes yet."}
        </p>
      </div>
      <div>
        <h3 className="mb-2 font-medium">Checklist</h3>
        <div className="space-y-2">
          {project.checklist.length === 0 ? (
            <p className="text-sm text-muted-foreground">No checklist items.</p>
          ) : (
            project.checklist.map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={item.done}
                  onCheckedChange={(checked) =>
                    onToggleItem(item.id, Boolean(checked))
                  }
                />
                <span className={item.done ? "text-muted-foreground line-through" : ""}>
                  {item.label}
                </span>
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/50 p-3">
      <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 font-heading text-xl">{value}</p>
    </div>
  );
}
