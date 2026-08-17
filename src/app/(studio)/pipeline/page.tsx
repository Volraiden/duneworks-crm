"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageTransition } from "@/components/page-chrome";
import { EmptyState } from "@/components/empty-state";
import { CompanyCard } from "@/components/pipeline/company-card";
import { PipelineColumn } from "@/components/pipeline/pipeline-column";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/auth-context";
import { useCrm } from "@/context/crm-context";
import { isDeniedStage } from "@/lib/types";
import type { Client } from "@/lib/types";

export default function PipelinePage() {
  const { data, openDialog, moveCompany } = useCrm();
  const { allow } = useAuth();
  const canMove = allow("movePipeline");
  const [query, setQuery] = useState("");
  const [assignee, setAssignee] = useState("all");
  const [source, setSource] = useState("all");
  const [tag, setTag] = useState("all");
  const [valueBand, setValueBand] = useState("all");
  const [added, setAdded] = useState("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingDeny, setPendingDeny] = useState<{
    client: Client;
    stageId: string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const collisionDetection: CollisionDetection = (args) => {
    const pointerHits = pointerWithin(args);
    if (pointerHits.length > 0) return pointerHits;
    return rectIntersection(args);
  };

  const tags = useMemo(
    () => [...new Set(data.clients.flatMap((client) => client.tags))],
    [data.clients]
  );

  const filtered = data.clients.filter((client) => {
    const haystack =
      `${client.company} ${client.name} ${client.email} ${client.phone} ${client.clientNumber}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesAssignee =
      assignee === "all" ||
      (assignee === "unassigned" && !client.assignedUserId) ||
      client.assignedUserId === assignee;
    const matchesSource = source === "all" || client.source === source;
    const matchesTag = tag === "all" || client.tags.includes(tag);
    const matchesValue =
      valueBand === "all" ||
      (valueBand === "low" && client.potentialValue < 20000) ||
      (valueBand === "mid" &&
        client.potentialValue >= 20000 &&
        client.potentialValue < 50000) ||
      (valueBand === "high" && client.potentialValue >= 50000);
    const matchesAdded =
      added === "all" ||
      (added === "30" && daysAgo(client.createdAt) <= 30) ||
      (added === "90" && daysAgo(client.createdAt) <= 90);
    return (
      matchesQuery &&
      matchesAssignee &&
      matchesSource &&
      matchesTag &&
      matchesValue &&
      matchesAdded
    );
  });

  const activeClient = data.clients.find((client) => client.id === activeId);

  async function completeMove(clientId: string, stageId: string, extras?: {
    reason?: string;
    notes?: string;
  }) {
    const previous = data.clients.find((item) => item.id === clientId);
    try {
      await moveCompany({ id: clientId, stageId, ...extras });
      toast.success("Pipeline updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not move company");
    }
    return previous;
  }

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || !canMove) return;
    const client = data.clients.find((item) => item.id === String(active.id));
    if (!client) return;
    const overId = String(over.id);
    const overStage =
      data.stages.find((stage) => stage.id === overId) ??
      data.stages.find(
        (stage) => stage.id === data.clients.find((item) => item.id === overId)?.stageId
      );
    if (!overStage || overStage.id === client.stageId) return;

    if (isDeniedStage(overStage)) {
      setPendingDeny({ client, stageId: overStage.id });
      return;
    }
    await completeMove(client.id, overStage.id);
  }

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Studio CRM"
        title="Client Pipeline"
        description="Move companies through outreach, trial, and paid work."
        actions={
          <>
            {allow("manageStages") ? (
              <Button variant="outline" onClick={() => openDialog("stage")}>
                <SlidersHorizontal />
                Create category
              </Button>
            ) : null}
            {allow("createRecords") ? (
              <Button onClick={() => openDialog("client")}>
                <Plus />
                Add company
              </Button>
            ) : null}
          </>
        }
      />
      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_repeat(5,minmax(0,9rem))]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 pl-9"
            placeholder="Search company or contact"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={assignee} onValueChange={setAssignee}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All owners</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {data.team.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {[...new Set(data.clients.map((client) => client.source).filter(Boolean))].map(
              (item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <Select value={valueBand} onValueChange={setValueBand}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Value" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any value</SelectItem>
            <SelectItem value="low">Under $20k</SelectItem>
            <SelectItem value="mid">$20k–$50k</SelectItem>
            <SelectItem value="high">$50k+</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tag} onValueChange={setTag}>
          <SelectTrigger className="w-full">
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
        <Select value={added} onValueChange={setAdded}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Added" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any date</SelectItem>
            <SelectItem value="30">Added in 30 days</SelectItem>
            <SelectItem value="90">Added in 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="size-5" />}
          title="No companies in view"
          description="Adjust filters or add a company to the pipeline."
          actionLabel={allow("createRecords") ? "Add company" : undefined}
          onAction={allow("createRecords") ? () => openDialog("client") : undefined}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="flex gap-3 overflow-x-auto pb-6">
            {data.stages.map((stage) => (
              <PipelineColumn
                key={stage.id}
                stage={stage}
                companies={filtered.filter((client) => client.stageId === stage.id)}
                team={data.team}
                notes={data.notes}
                disabled={!canMove}
                onOpen={(id) => openDialog("clientDetail", id)}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }}>
            {activeClient ? (
              <div className="w-[256px]">
                <CompanyCard
                  lifted
                  client={activeClient}
                  assignee={data.team.find((member) => member.id === activeClient.assignedUserId)}
                  lastNote={
                    data.notes.find((note) => note.clientId === activeClient.id)?.body
                  }
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
      <AnimatePresence>
        {pendingDeny ? (
          <DenyModal
            company={pendingDeny.client.company}
            onCancel={() => setPendingDeny(null)}
            onConfirm={async (reason, notes) => {
              await completeMove(pendingDeny.client.id, pendingDeny.stageId, {
                reason,
                notes,
              });
              setPendingDeny(null);
            }}
          />
        ) : null}
      </AnimatePresence>
    </PageTransition>
  );
}

function daysAgo(value: string) {
  return Math.floor((Date.now() - new Date(`${value}T12:00:00Z`).getTime()) / 86400000);
}

function DenyModal({
  company,
  onCancel,
  onConfirm,
}: {
  company: string;
  onCancel: () => void;
  onConfirm: (reason: string, notes: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12 }}
        className="glass-panel w-full max-w-md rounded-2xl p-6"
      >
        <h3 className="font-heading text-2xl">Move {company} to Denied</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          A reason is required and is stored in the company activity log.
        </p>
        <label className="mt-4 block text-sm">Denial reason</label>
        <Input className="mt-1" value={reason} onChange={(e) => setReason(e.target.value)} />
        {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
        <label className="mt-3 block text-sm">Notes</label>
        <Input className="mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            disabled={saving}
            onClick={async () => {
              if (!reason.trim()) {
                setError("Add a denial reason.");
                return;
              }
              setSaving(true);
              await onConfirm(reason.trim(), notes.trim());
              setSaving(false);
            }}
          >
            Confirm denial
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
