"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CLIENT_SOURCES, CLIENT_TAGS } from "@/lib/types";
import type { Client, PipelineStage, TeamMember } from "@/lib/types";

export function CompanyForm({
  client,
  stages,
  team,
  defaultStageId,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  client?: Client;
  stages: PipelineStage[];
  team: TeamMember[];
  defaultStageId?: string;
  submitLabel?: string;
  onSubmit: (
    values: Omit<Client, "id" | "createdAt" | "lastActivity" | "clientNumber" | "sortOrder">
  ) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [company, setCompany] = useState(client?.company ?? "");
  const [industry, setIndustry] = useState(client?.industry ?? "");
  const [name, setName] = useState(client?.name ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [potentialValue, setPotentialValue] = useState(
    String(client?.potentialValue ?? "")
  );
  const [source, setSource] = useState(client?.source || CLIENT_SOURCES[0]);
  const [assignedUserId, setAssignedUserId] = useState(client?.assignedUserId ?? "");
  const [stageId, setStageId] = useState(() =>
    resolveStageId(stages, client?.stageId || defaultStageId)
  );
  const [tags, setTags] = useState<string[]>(client?.tags ?? []);
  const [customTag, setCustomTag] = useState("");
  const [notes, setNotes] = useState(client?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEditing = Boolean(client);

  const availableTags = useMemo(
    () => CLIENT_TAGS.filter((tag) => !tags.includes(tag)),
    [tags]
  );
  const activeTeam = team.filter((member) => member.active);

  function validate() {
    const next: Record<string, string> = {};
    if (!company.trim()) next.company = "Company name is required.";
    if (!name.trim()) next.name = "Contact name is required.";
    if (Number.isNaN(Number(potentialValue)) || Number(potentialValue) < 0) {
      next.potentialValue = "Enter a valid potential value.";
    }
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
          company: company.trim(),
          industry: industry.trim(),
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          potentialValue: Number(potentialValue || 0),
          source,
          assignedUserId: assignedUserId || null,
          stageId,
          status: client?.status ?? "Lead",
          tags,
          notes,
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company name" error={errors.company}>
          <Input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company name"
          />
        </Field>
        <Field label="Industry">
          <Input
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="Restaurant, fashion, real estate…"
          />
        </Field>
        <Field label="Contact person" error={errors.name}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Who to speak with"
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@email.com"
          />
        </Field>
        <Field label="Phone">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
          />
        </Field>
        <Field label="Potential value" error={errors.potentialValue}>
          <Input
            inputMode="decimal"
            value={potentialValue}
            onChange={(e) => setPotentialValue(e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="Source">
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLIENT_SOURCES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Assigned user">
          <Select
            value={assignedUserId || "unassigned"}
            onValueChange={(value) => setAssignedUserId(value === "unassigned" ? "" : value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {activeTeam.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      {isEditing ? (
        <Field label="Pipeline stage">
          <Select value={stageId} onValueChange={setStageId}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stages.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      ) : null}
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="gap-1">
              {tag}
              <button
                type="button"
                onClick={() => setTags((current) => current.filter((item) => item !== tag))}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <Button
              key={tag}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setTags((current) => [...current, tag])}
            >
              {tag}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Custom tag"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const next = customTag.trim();
              if (!next || tags.includes(next)) return;
              setTags((current) => [...current, next]);
              setCustomTag("");
            }}
          >
            Add
          </Button>
        </div>
      </div>
      <Field label="Notes">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything the team should know"
        />
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {submitLabel ?? (client ? "Save company" : "Add company")}
        </Button>
      </div>
    </form>
  );
}

function resolveStageId(stages: PipelineStage[], preferred?: string) {
  if (preferred) {
    const match = stages.find((stage) => stage.id === preferred);
    if (match) return match.id;
  }
  const possible = stages.find((stage) => stage.kind === "possible");
  if (possible) return possible.id;
  return stages.find((stage) => stage.kind !== "denied")?.id ?? stages[0]?.id ?? "";
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
