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
import { useCrm } from "@/context/crm-context";
import { CLIENT_STATUSES } from "@/lib/types";
import { clientRevenue, projectCountForClient } from "@/lib/analytics";
import { formatCurrency, formatDate, initials } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ClientsPage() {
  const { data, openDialog } = useCrm();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [tag, setTag] = useState("all");
  const [view, setView] = useState<"table" | "grid">("table");

  const tags = useMemo(
    () => [...new Set(data.clients.flatMap((client) => client.tags))],
    [data.clients]
  );

  const filtered = data.clients.filter((client) => {
    const haystack = `${client.name} ${client.company} ${client.email}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesStatus = status === "all" || client.status === status;
    const matchesTag = tag === "all" || client.tags.includes(tag);
    return matchesQuery && matchesStatus && matchesTag;
  });

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Roster"
        title="Clients"
        description="Search, filter, and open any production partner."
        actions={
          <Button onClick={() => openDialog("client")}>
            <Plus />
            Add Client
          </Button>
        }
      />
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 pl-9"
            placeholder="Search name, company, or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full lg:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {CLIENT_STATUSES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tag} onValueChange={setTag}>
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {tags.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
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
          title="No clients match"
          description="Try a different search, or add a new client to the roster."
          actionLabel="Add Client"
          onAction={() => openDialog("client")}
        />
      ) : view === "table" ? (
        <div className="glass-panel rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Earned</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Last activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((client) => (
                <TableRow
                  key={client.id}
                  className="cursor-pointer"
                  onClick={() => openDialog("clientDetail", client.id)}
                >
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.company}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>
                    <ClientStatusBadge status={client.status} />
                  </TableCell>
                  <TableCell>
                    {formatCurrency(clientRevenue(data.payments, client.id), true)}
                  </TableCell>
                  <TableCell>
                    {projectCountForClient(data.projects, client.id)}
                  </TableCell>
                  <TableCell>{formatDate(client.lastActivity)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((client) => (
            <button
              key={client.id}
              type="button"
              onClick={() => openDialog("clientDetail", client.id)}
              className="glass-panel rounded-2xl p-5 text-left transition hover:-translate-y-0.5 hover:border-primary/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{initials(client.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-muted-foreground">{client.company}</p>
                  </div>
                </div>
                <ClientStatusBadge status={client.status} />
              </div>
              <p className="mt-4 font-heading text-2xl">
                {formatCurrency(clientRevenue(data.payments, client.id), true)}
              </p>
              <p className="text-xs text-muted-foreground">
                {projectCountForClient(data.projects, client.id)} projects ·{" "}
                {formatDate(client.lastActivity)}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {client.tags.map((item) => (
                  <Badge key={item} variant="outline">
                    {item}
                  </Badge>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
