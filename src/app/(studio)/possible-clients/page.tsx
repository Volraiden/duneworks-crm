"use client";

import { useMemo, useState } from "react";
import { Phone, Plus, Search } from "lucide-react";
import { PageHeader, PageTransition } from "@/components/page-chrome";
import { EmptyState } from "@/components/empty-state";
import { PossibleClientOutcomeBadge } from "@/components/status-badge";
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
import { useCrm } from "@/context/crm-context";
import { POSSIBLE_CLIENT_OUTCOMES, type PossibleClientOutcome } from "@/lib/types";
import { formatDate } from "@/lib/format";

export default function PossibleClientsPage() {
  const { data, openDialog } = useCrm();
  const [query, setQuery] = useState("");
  const [outcome, setOutcome] = useState("all");

  const counts = useMemo(() => {
    const next: Record<PossibleClientOutcome, number> = {
      "Needed the service": 0,
      "Will let us know": 0,
      "Said no": 0,
    };
    for (const prospect of data.possibleClients) {
      next[prospect.outcome] += 1;
    }
    return next;
  }, [data.possibleClients]);

  const filtered = data.possibleClients.filter((prospect) => {
    const haystack = `${prospect.company} ${prospect.phone} ${prospect.notes}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesOutcome = outcome === "all" || prospect.outcome === outcome;
    return matchesQuery && matchesOutcome;
  });

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Outreach"
        title="Possible clients"
        description="Log companies you called: if they needed the service, will let you know, or said no."
        actions={
          <Button onClick={() => openDialog("possibleClient")}>
            <Plus />
            Log possible client
          </Button>
        }
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {POSSIBLE_CLIENT_OUTCOMES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setOutcome(outcome === item ? "all" : item)}
            className="glass-panel rounded-2xl px-4 py-4 text-left transition hover:border-primary/30"
          >
            <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              {item}
            </p>
            <p className="font-heading mt-2 text-3xl">{counts[item]}</p>
          </button>
        ))}
      </div>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 pl-9"
            placeholder="Search company or phone"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={outcome} onValueChange={setOutcome}>
          <SelectTrigger className="w-full lg:w-56">
            <SelectValue placeholder="Outcome" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All outcomes</SelectItem>
            {POSSIBLE_CLIENT_OUTCOMES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Phone className="size-5" />}
          title={data.possibleClients.length === 0 ? "No possible clients yet" : "No matches"}
          description={
            data.possibleClients.length === 0
              ? "Log a company, their phone number, and whether they needed the service."
              : "Try a different search or outcome filter."
          }
          actionLabel="Log possible client"
          onAction={() => openDialog("possibleClient")}
        />
      ) : (
        <div className="glass-panel rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Logged</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((prospect) => (
                <TableRow
                  key={prospect.id}
                  className="cursor-pointer"
                  onClick={() => openDialog("possibleClient", prospect.id)}
                >
                  <TableCell className="font-medium">{prospect.company}</TableCell>
                  <TableCell>{prospect.phone}</TableCell>
                  <TableCell>
                    <PossibleClientOutcomeBadge outcome={prospect.outcome} />
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {prospect.notes || "—"}
                  </TableCell>
                  <TableCell>{formatDate(prospect.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageTransition>
  );
}
