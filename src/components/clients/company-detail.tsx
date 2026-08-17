"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ClientStatusBadge, PaymentStatusBadge, ProjectStatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { clientRevenue, projectCountForClient, projectRevenue } from "@/lib/analytics";
import type {
  Client,
  ClientActivity,
  ClientNote,
  Payment,
  PipelineStage,
  Project,
  TeamMember,
} from "@/lib/types";

export function CompanyDetail({
  client,
  stage,
  team,
  notes,
  activities,
  projects,
  payments,
  canEdit,
  canDelete,
  canNote,
  canPay,
  onEdit,
  onDelete,
  onAddProject,
  onAddPayment,
  onAddNote,
}: {
  client: Client;
  stage?: PipelineStage;
  team: TeamMember[];
  notes: ClientNote[];
  activities: ClientActivity[];
  projects: Project[];
  payments: Payment[];
  canEdit: boolean;
  canDelete: boolean;
  canNote: boolean;
  canPay: boolean;
  onEdit: () => void;
  onDelete?: () => void;
  onAddProject: () => void;
  onAddPayment: () => void;
  onAddNote: (body: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const assignee = team.find((member) => member.id === client.assignedUserId);
  const clientProjects = projects.filter((project) => project.clientId === client.id);
  const clientPayments = payments.filter((payment) => payment.clientId === client.id);
  const lifetime = clientRevenue(payments, client.id);
  const clientNotes = notes.filter((item) => item.clientId === client.id);
  const history = activities.filter((item) => item.clientId === client.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-wide text-gold">#{client.clientNumber}</p>
          <h2 className="font-heading text-3xl">{client.company}</h2>
          <p className="text-sm text-muted-foreground">{client.name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {stage ? (
              <Badge variant="outline" style={{ borderColor: stage.color, color: stage.color }}>
                {stage.name}
              </Badge>
            ) : null}
            <ClientStatusBadge status={client.status} />
            {client.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit ? (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil />
              Edit
            </Button>
          ) : null}
          <Button size="sm" asChild>
            <Link href={`/clients/${client.id}`}>Full page</Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Potential" value={formatCurrency(client.potentialValue, true)} />
        <Stat label="Lifetime revenue" value={formatCurrency(lifetime, true)} />
        <Stat label="Projects" value={String(projectCountForClient(projects, client.id))} />
      </div>
      <div className="grid gap-2 text-sm">
        <Row label="Industry" value={client.industry || "—"} />
        <Row label="Email" value={client.email || "—"} />
        <Row label="Phone" value={client.phone || "—"} />
        <Row label="Source" value={client.source || "—"} />
        <Row label="Owner" value={assignee?.name ?? "Unassigned"} />
        <Row label="Last activity" value={formatDate(client.lastActivity)} />
      </div>
      <div>
        <h3 className="mb-2 font-medium">Internal notes</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {client.notes || "No profile notes yet."}
        </p>
        <div className="mt-3 space-y-2">
          {clientNotes.map((item) => {
            const author = team.find((member) => member.id === item.userId);
            return (
              <div key={item.id} className="rounded-xl border border-border/70 px-3 py-2">
                <p className="text-sm">{item.body}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {author?.name ?? "Studio"} · {format(parseISO(item.createdAt), "MMM d, yyyy p")}
                </p>
              </div>
            );
          })}
        </div>
        {canNote ? (
          <form
            className="mt-3 flex gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!note.trim()) return;
              await onAddNote(note.trim());
              setNote("");
            }}
          >
            <Textarea
              className="min-h-16"
              placeholder="Add an internal note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button type="submit" variant="secondary">
              Save
            </Button>
          </form>
        ) : null}
      </div>
      <Separator />
      <section>
        <h3 className="mb-3 font-medium">Pipeline history</h3>
        <div className="space-y-2">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history yet.</p>
          ) : (
            history.map((item) => {
              const actor = team.find((member) => member.id === item.userId);
              return (
                <div key={item.id} className="rounded-xl border border-border/60 px-3 py-2">
                  <p className="text-sm">
                    {item.type === "denied"
                      ? `Denied: ${item.reason || item.body}`
                      : item.body || `${item.fromStage} → ${item.toStage}`}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {actor?.name ?? "Studio"} · {format(parseISO(item.createdAt), "MMM d, yyyy p")}
                    {item.fromStage && item.toStage ? ` · ${item.fromStage} → ${item.toStage}` : ""}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </section>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium">Projects</h3>
          {canEdit ? (
            <Button size="sm" variant="outline" onClick={onAddProject}>
              <Plus />
              Add
            </Button>
          ) : null}
        </div>
        <div className="space-y-2">
          {clientProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects yet.</p>
          ) : (
            clientProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{project.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(projectRevenue(payments, project.id))} earned · due{" "}
                    {formatDate(project.deadline)}
                  </p>
                </div>
                <ProjectStatusBadge status={project.status} />
              </div>
            ))
          )}
        </div>
      </section>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium">Payments</h3>
          {canPay ? (
            <Button size="sm" variant="outline" onClick={onAddPayment}>
              <Plus />
              Add
            </Button>
          ) : null}
        </div>
        <div className="space-y-2">
          {clientPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            clientPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{payment.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(payment.date)} · {formatCurrency(payment.amount)}
                  </p>
                </div>
                <PaymentStatusBadge status={payment.status} />
              </div>
            ))
          )}
        </div>
      </section>
      {canDelete && onDelete ? (
        <Button variant="ghost" className="text-destructive" onClick={onDelete}>
          <Trash2 />
          Delete company
        </Button>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/50 p-3">
      <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 font-heading text-2xl">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="text-muted-foreground">{label} · </span>
      {value}
    </p>
  );
}
