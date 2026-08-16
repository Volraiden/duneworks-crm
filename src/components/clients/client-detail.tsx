"use client";

import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ClientStatusBadge, PaymentStatusBadge, ProjectStatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { clientRevenue, projectCountForClient, projectRevenue } from "@/lib/analytics";
import type { Client, Payment, Project } from "@/lib/types";

export function ClientDetail({
  client,
  projects,
  payments,
  onEdit,
  onAddProject,
  onAddPayment,
  showFullPageLink = true,
}: {
  client: Client;
  projects: Project[];
  payments: Payment[];
  onEdit: () => void;
  onAddProject: () => void;
  onAddPayment: () => void;
  showFullPageLink?: boolean;
}) {
  const clientProjects = projects.filter((project) => project.clientId === client.id);
  const clientPayments = payments.filter((payment) => payment.clientId === client.id);
  const lifetime = clientRevenue(payments, client.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
            {client.company}
          </p>
          <h2 className="font-heading text-3xl">{client.name}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ClientStatusBadge status={client.status} />
            {client.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil />
            Edit
          </Button>
          {showFullPageLink ? (
            <Button size="sm" asChild>
              <Link href={`/clients/${client.id}`}>Full page</Link>
            </Button>
          ) : null}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Lifetime revenue" value={formatCurrency(lifetime)} />
        <Stat label="Projects" value={String(projectCountForClient(projects, client.id))} />
        <Stat label="Last activity" value={formatDate(client.lastActivity)} />
      </div>
      <div className="grid gap-2 text-sm">
        <p>
          <span className="text-muted-foreground">Email · </span>
          {client.email}
        </p>
        <p>
          <span className="text-muted-foreground">Phone · </span>
          {client.phone || "—"}
        </p>
      </div>
      <div>
        <h3 className="mb-2 font-medium">Notes</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {client.notes || "No notes yet."}
        </p>
      </div>
      <Separator />
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium">Projects</h3>
          <Button size="sm" variant="outline" onClick={onAddProject}>
            <Plus />
            Add
          </Button>
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
          <Button size="sm" variant="outline" onClick={onAddPayment}>
            <Plus />
            Add
          </Button>
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
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/50 p-3">
      <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 font-heading text-2xl">{value}</p>
    </div>
  );
}
