"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CLIENT_STATUSES, CLIENT_TAGS } from "@/lib/types";
import type { Client } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export function ClientForm({
  client,
  onSubmit,
  onCancel,
}: {
  client?: Client;
  onSubmit: (
    values: Omit<Client, "id" | "createdAt" | "lastActivity">
  ) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(client?.name ?? "");
  const [company, setCompany] = useState(client?.company ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [status, setStatus] = useState(client?.status ?? "Lead");
  const [tags, setTags] = useState<string[]>(client?.tags ?? []);
  const [customTag, setCustomTag] = useState("");
  const [notes, setNotes] = useState(client?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableTags = useMemo(
    () => CLIENT_TAGS.filter((tag) => !tags.includes(tag)),
    [tags]
  );

  function validate() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Name is required.";
    if (!company.trim()) next.company = "Company is required.";
    if (!email.trim() || !email.includes("@")) next.email = "Valid email required.";
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
          company: company.trim(),
          email: email.trim(),
          phone: phone.trim(),
          status,
          tags,
          notes,
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Client name" error={errors.name}>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Company" error={errors.company}>
          <Input value={company} onChange={(e) => setCompany(e.target.value)} />
        </Field>
        <Field label="Email" error={errors.email}>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
      </div>
      <Field label="Status">
        <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CLIENT_STATUSES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
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
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{client ? "Save client" : "Add client"}</Button>
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
