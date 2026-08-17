"use client";

import { useMemo, useState } from "react";
import { KanbanSquare, Plus, Search, Table2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageTransition } from "@/components/page-chrome";
import { EmptyState } from "@/components/empty-state";
import { ProjectKanban } from "@/components/projects/project-kanban";
import { ProjectStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCrm } from "@/context/crm-context";
import { useAuth } from "@/context/auth-context";
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/types";
import { projectRevenue } from "@/lib/analytics";
import { formatCurrency, formatDate } from "@/lib/format";

export default function ProjectsPage() {
  const { data, openDialog, upsertProject, deleteProject } = useCrm();
  const { allow } = useAuth();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState<"table" | "kanban">("kanban");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      data.projects.filter((project) => {
        const client = data.clients.find((item) => item.id === project.clientId);
        const haystack = `${project.name} ${client?.company ?? ""}`.toLowerCase();
        const matchesQuery = haystack.includes(query.toLowerCase());
        const matchesStatus = status === "all" || project.status === status;
        return matchesQuery && matchesStatus;
      }),
    [data.clients, data.projects, query, status]
  );

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Productions"
        title="Projects"
        description="Move work through inquiry to delivery. Drag cards between stages."
        actions={
          allow("createRecords") ? (
            <Button onClick={() => openDialog("project")}>
              <Plus />
              Add Project
            </Button>
          ) : null
        }
      />
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 pl-9"
            placeholder="Search projects or clients"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {PROJECT_STATUSES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button
            variant={view === "kanban" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setView("kanban")}
          >
            <KanbanSquare />
          </Button>
          <Button
            variant={view === "table" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setView("table")}
          >
            <Table2 />
          </Button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          icon={<KanbanSquare className="size-5" />}
          title="No projects yet"
          description="Add a production and it will appear on the board."
          actionLabel="Add Project"
          onAction={() => openDialog("project")}
        />
      ) : view === "kanban" ? (
        <ProjectKanban
          projects={filtered}
          clients={data.clients}
          payments={data.payments}
          onOpen={(id) => openDialog("projectDetail", id)}
          onMove={(id, nextStatus: ProjectStatus) => {
            if (!allow("editRecords")) return;
            const project = data.projects.find((item) => item.id === id);
            if (!project || project.status === nextStatus) return;
            upsertProject({ ...project, status: nextStatus });
            toast.success(`Moved to ${nextStatus}`);
          }}
        />
      ) : (
        <div className="glass-panel rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Earned</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((project) => {
                const client = data.clients.find((item) => item.id === project.clientId);
                return (
                  <TableRow
                    key={project.id}
                    className="cursor-pointer"
                    onClick={() => openDialog("projectDetail", project.id)}
                  >
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>{client?.company}</TableCell>
                    <TableCell>{project.type}</TableCell>
                    <TableCell>{formatCurrency(project.budget, true)}</TableCell>
                    <TableCell>
                      {formatCurrency(projectRevenue(data.payments, project.id), true)}
                    </TableCell>
                    <TableCell>{formatDate(project.deadline)}</TableCell>
                    <TableCell>
                      <ProjectStatusBadge status={project.status} />
                    </TableCell>
                    <TableCell className="w-36">
                      <div className="flex items-center gap-2">
                        <Progress value={project.progress} />
                        <span className="text-xs text-muted-foreground">
                          {project.progress}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {allow("deleteRecords") ? (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={(event) => {
                          event.stopPropagation();
                          setPendingDelete(project.id);
                        }}
                      >
                        <Trash2 />
                      </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              Linked payments and calendar events will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingDelete) {
                  deleteProject(pendingDelete);
                  toast.success("Project removed");
                }
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}
