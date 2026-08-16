"use client";

import { motion } from "framer-motion";
import { ProjectStatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { projectRevenue } from "@/lib/analytics";
import { PROJECT_STATUSES } from "@/lib/types";
import type { Client, Payment, Project, ProjectStatus } from "@/lib/types";

export function ProjectKanban({
  projects,
  clients,
  payments,
  onOpen,
  onMove,
}: {
  projects: Project[];
  clients: Client[];
  payments: Payment[];
  onOpen: (id: string) => void;
  onMove: (id: string, status: ProjectStatus) => void;
}) {
  return (
    <div className="grid gap-4 overflow-x-auto pb-2 lg:grid-cols-5">
      {PROJECT_STATUSES.map((status) => {
        const column = projects.filter((project) => project.status === status);
        return (
          <div
            key={status}
            className="min-w-[240px] rounded-2xl border border-border/70 bg-card/40 p-3"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const id = event.dataTransfer.getData("text/plain");
              if (id) onMove(id, status);
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">{status}</p>
              <span className="text-xs text-muted-foreground">{column.length}</span>
            </div>
            <div className="space-y-2">
              {column.map((project) => {
                const client = clients.find((item) => item.id === project.clientId);
                return (
                  <motion.div layout key={project.id}>
                    <button
                      type="button"
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", project.id);
                      }}
                      onClick={() => onOpen(project.id)}
                      className="w-full rounded-xl border border-border/60 bg-background/70 p-3 text-left transition hover:border-primary/40"
                    >
                      <p className="text-sm font-medium">{project.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {client?.company ?? "—"}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span>
                          {formatCurrency(projectRevenue(payments, project.id), true)}
                        </span>
                        <span className="text-muted-foreground">
                          {formatDate(project.deadline, "MMM d")}
                        </span>
                      </div>
                      <div className="mt-2">
                        <ProjectStatusBadge status={project.status} />
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
