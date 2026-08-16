"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CLIENT_TAGS, PROJECT_STATUSES } from "@/lib/types";
import type { ChecklistItem, Client, Project } from "@/lib/types";
import { createId } from "@/lib/ids";
import { Plus, Trash2 } from "lucide-react";

export function ProjectForm({
  project,
  clients,
  presetClientId,
  onSubmit,
  onCancel,
}: {
  project?: Project;
  clients: Client[];
  presetClientId?: string;
  onSubmit: (values: Omit<Project, "id" | "createdAt">) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(project?.name ?? "");
  const [clientId, setClientId] = useState(
    project?.clientId ?? presetClientId ?? clients[0]?.id ?? ""
  );
  const [type, setType] = useState(project?.type ?? "Brand Campaign");
  const [budget, setBudget] = useState(String(project?.budget ?? ""));
  const [deadline, setDeadline] = useState(project?.deadline ?? "");
  const [status, setStatus] = useState(project?.status ?? "Inquiry");
  const [progress, setProgress] = useState(String(project?.progress ?? 0));
  const [notes, setNotes] = useState(project?.notes ?? "");
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    project?.checklist ?? []
  );
  const [newItem, setNewItem] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const types = useMemo(() => [...CLIENT_TAGS], []);

  function validate() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Project name is required.";
    if (!clientId) next.clientId = "Select a client.";
    if (!deadline) next.deadline = "Deadline is required.";
    if (Number.isNaN(Number(budget)) || Number(budget) < 0)
      next.budget = "Enter a valid budget.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!validate()) return;
        await onSubmit({
          name: name.trim(),
          clientId,
          type,
          budget: Number(budget),
          deadline,
          status,
          progress: Math.min(100, Math.max(0, Number(progress) || 0)),
          notes,
          checklist,
        });
      }}
    >
      <Field label="Project name" error={errors.name}>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Client" error={errors.clientId}>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Type">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {types.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Budget (USD)" error={errors.budget}>
          <Input
            type="number"
            min="0"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </Field>
        <Field label="Deadline" error={errors.deadline}>
          <Input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </Field>
        <Field label="Status">
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as typeof status)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_STATUSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Progress (%)">
          <Input
            type="number"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
          />
        </Field>
      </div>
      <div className="space-y-2">
        <Label>Checklist</Label>
        <div className="space-y-2">
          {checklist.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <Checkbox
                checked={item.done}
                onCheckedChange={(checked) =>
                  setChecklist((current) =>
                    current.map((row) =>
                      row.id === item.id ? { ...row, done: Boolean(checked) } : row
                    )
                  )
                }
              />
              <Input
                value={item.label}
                onChange={(e) =>
                  setChecklist((current) =>
                    current.map((row) =>
                      row.id === item.id ? { ...row, label: e.target.value } : row
                    )
                  )
                }
              />
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() =>
                  setChecklist((current) =>
                    current.filter((row) => row.id !== item.id)
                  )
                }
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add checklist item"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (!newItem.trim()) return;
              setChecklist((current) => [
                ...current,
                { id: createId("cl"), label: newItem.trim(), done: false },
              ]);
              setNewItem("");
            }}
          >
            <Plus />
            Add
          </Button>
        </div>
      </div>
      <Field label="Notes">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{project ? "Save project" : "Add project"}</Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
