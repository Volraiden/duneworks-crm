"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashPanel, DashPanelHeader } from "@/components/dashboard/panel";
import type { DashboardTarget, UpcomingItem } from "@/lib/dashboard";
import type { DashboardTask } from "@/lib/dashboard-storage";
import type { Client } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TasksPanel({
  items,
  clients,
  canCreate,
  onOpen,
  onToggle,
  onAdd,
}: {
  items: UpcomingItem[];
  clients: Client[];
  canCreate: boolean;
  onOpen: (target: DashboardTarget) => void;
  onToggle: (item: UpcomingItem, done: boolean) => void;
  onAdd: (input: Omit<DashboardTask, "id" | "createdAt" | "done">) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <DashPanel delay={0.2}>
      <DashPanelHeader
        title="Tasks & upcoming"
        description="Meetings, demos, deadlines, follow-ups, and unpaid invoices"
        action={
          canCreate ? (
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              <Plus />
              Add task
            </Button>
          ) : null
        }
      />
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nothing due this week. Add a task or a calendar event to fill the slate.
        </p>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 9).map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2"
            >
              <Checkbox
                checked={item.done}
                onCheckedChange={(checked) => onToggle(item, Boolean(checked))}
                aria-label={`Mark ${item.title} complete`}
              />
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => item.target && onOpen(item.target)}
              >
                <p className={cn("truncate text-sm", item.done && "text-muted-foreground line-through")}>
                  {item.title}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {item.relatedLabel}
                </p>
              </button>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] tracking-wide uppercase">
                {item.dueLabel}
              </span>
            </div>
          ))}
        </div>
      )}
      <AddTaskDialog
        open={open}
        clients={clients}
        onOpenChange={setOpen}
        onAdd={(input) => {
          onAdd(input);
          setOpen(false);
          toast.success("Task added");
        }}
      />
    </DashPanel>
  );
}

function AddTaskDialog({
  open,
  clients,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  clients: Client[];
  onOpenChange: (open: boolean) => void;
  onAdd: (input: Omit<DashboardTask, "id" | "createdAt" | "done">) => void;
}) {
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState(new Date().toISOString().slice(0, 10));
  const [relatedId, setRelatedId] = useState("none");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add task</DialogTitle>
          <DialogDescription>
            Kept on this dashboard until the studio backend is connected.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!title.trim()) return;
            const client = clients.find((item) => item.id === relatedId);
            onAdd({
              title: title.trim(),
              dueAt,
              relatedKind: client ? "company" : "none",
              relatedId: client?.id ?? null,
              relatedLabel: client?.company ?? "",
            });
            setTitle("");
          }}
        >
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Due</Label>
            <Input type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Related company</Label>
            <Select value={relatedId} onValueChange={setRelatedId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add task</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
