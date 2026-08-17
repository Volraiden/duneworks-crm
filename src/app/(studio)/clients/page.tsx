"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, Plus, Search, Table2 } from "lucide-react";
import { PageHeader, PageTransition } from "@/components/page-chrome";
import { EmptyState } from "@/components/empty-state";
import { ClientStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { useCrm } from "@/context/crm-context";
import { formatCurrency, formatDate, initials } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ClientsPage() {
  const { data, openDialog } = useCrm();
  const { allow } = useAuth();
  const [query, setQuery] = useState("");
  const [stageId, setStageId] = useState("all");
  const [view, setView] = useState<"table" | "grid">("table");

  const filtered = useMemo(
    () =>
      data.clients.filter((client) => {
        const haystack =
          `${client.name} ${client.company} ${client.email} ${client.clientNumber}`.toLowerCase();
        return (
          haystack.includes(query.toLowerCase()) &&
          (stageId === "all" || client.stageId === stageId)
        );
      }),
    [data.clients, query, stageId]
  );

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Roster"
        title="Clients"
        description="Every company in the pipeline, with owners, value, and stage."
        actions={
          allow("createRecords") ? (
            <Button onClick={() => openDialog("client")}>
              <Plus />
              Add company
            </Button>
          ) : null
        }
      />
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 pl-9"
            placeholder="Search company, contact, or ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={stageId} onValueChange={setStageId}>
          <SelectTrigger className="w-full lg:w-52">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {data.stages.map((stage) => (
              <SelectItem key={stage.id} value={stage.id}>
                {stage.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button
            variant={view === "table" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setView("table")}
          >
            <Table2 />
          </Button>
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setView("grid")}
          >
            <LayoutGrid />
          </Button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="size-5" />}
          title="No companies match"
          description="Try a different search, or add a company to the roster."
          actionLabel={allow("createRecords") ? "Add company" : undefined}
          onAction={allow("createRecords") ? () => openDialog("client") : undefined}
        />
      ) : view === "table" ? (
        <div className="glass-panel rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Last activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((client) => {
                const owner = data.team.find((member) => member.id === client.assignedUserId);
                const stage = data.stages.find((item) => item.id === client.stageId);
                return (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer"
                    onClick={() => openDialog("clientDetail", client.id)}
                  >
                    <TableCell className="font-mono text-xs">#{client.clientNumber}</TableCell>
                    <TableCell className="font-medium">{client.company}</TableCell>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>{owner?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{stage?.name ?? client.status}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(client.potentialValue, true)}</TableCell>
                    <TableCell>{formatDate(client.lastActivity)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((client) => {
            const stage = data.stages.find((item) => item.id === client.stageId);
            return (
              <button
                key={client.id}
                type="button"
                onClick={() => openDialog("clientDetail", client.id)}
                className="glass-panel rounded-2xl p-5 text-left transition hover:-translate-y-0.5 hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{initials(client.company)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{client.company}</p>
                      <p className="text-sm text-muted-foreground">{client.name}</p>
                    </div>
                  </div>
                  <ClientStatusBadge status={client.status} />
                </div>
                <p className="mt-4 font-heading text-2xl">
                  {formatCurrency(client.potentialValue, true)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stage?.name} · {formatDate(client.lastActivity)}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </PageTransition>
  );
}
