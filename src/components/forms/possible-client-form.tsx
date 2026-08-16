"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  POSSIBLE_CLIENT_OUTCOMES,
  type PossibleClient,
  type PossibleClientOutcome,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const OUTCOME_HINTS: Record<PossibleClientOutcome, string> = {
  "Needed the service": "They want to work with Duneworks.",
  "Will let us know": "They asked for time before deciding.",
  "Said no": "They passed on the service.",
};

export function PossibleClientForm({
  prospect,
  onSubmit,
  onCancel,
  onDelete,
}: {
  prospect?: PossibleClient;
  onSubmit: (
    values: Omit<PossibleClient, "id" | "createdAt">
  ) => void | Promise<void>;
  onCancel: () => void;
  onDelete?: () => void | Promise<void>;
}) {
  const [company, setCompany] = useState(prospect?.company ?? "");
  const [phone, setPhone] = useState(prospect?.phone ?? "");
  const [outcome, setOutcome] = useState<PossibleClientOutcome>(
    prospect?.outcome ?? "Will let us know"
  );
  const [notes, setNotes] = useState(prospect?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const next: Record<string, string> = {};
    if (!company.trim()) next.company = "Company name is required.";
    if (!phone.trim()) next.phone = "Phone number is required.";
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
          phone: phone.trim(),
          outcome,
          notes: notes.trim(),
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Company name</Label>
          <Input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Studio or company"
          />
          {errors.company ? (
            <p className="text-xs text-destructive">{errors.company}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label>Phone number</Label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 000-0000"
          />
          {errors.phone ? (
            <p className="text-xs text-destructive">{errors.phone}</p>
          ) : null}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Outcome</Label>
        <div className="grid gap-2">
          {POSSIBLE_CLIENT_OUTCOMES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setOutcome(item)}
              className={cn(
                "rounded-xl border px-3 py-3 text-left transition",
                outcome === item
                  ? "border-primary/50 bg-primary/10"
                  : "border-border/70 hover:border-primary/30"
              )}
            >
              <p className="text-sm font-medium">{item}</p>
              <p className="text-xs text-muted-foreground">{OUTCOME_HINTS[item]}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional call notes"
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        {prospect && onDelete ? (
          <Button type="button" variant="ghost" className="text-destructive" onClick={onDelete}>
            Delete
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{prospect ? "Save" : "Log possible client"}</Button>
        </div>
      </div>
    </form>
  );
}
