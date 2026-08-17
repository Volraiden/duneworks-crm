"use client";

import { useState } from "react";
import { toast } from "sonner";
import { saveUser } from "@/app/actions/users";
import { appendStudioAudit } from "@/lib/dashboard-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLES, type Role } from "@/lib/permissions";
import type { TeamMember } from "@/lib/types";

export function UserForm({
  member,
  actor,
  onCancel,
  onSaved,
}: {
  member?: TeamMember | null;
  actor: { id: string; name: string };
  onCancel: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [name, setName] = useState(member?.name ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [role, setRole] = useState<Role>(member?.role ?? "Editor");
  const [password, setPassword] = useState("");
  const [active, setActive] = useState(member?.active ?? true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        const result = await saveUser({
          id: member?.id,
          name,
          email,
          role,
          password: password || undefined,
          active,
        });
        setSaving(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        if (!member) {
          appendStudioAudit({
            type: "team_added",
            userId: result.id,
            userName: name.trim(),
            actorId: actor.id,
            actorName: actor.name,
            detail: `${name.trim()} joined as ${role}.`,
          });
        } else if (member.role !== role) {
          appendStudioAudit({
            type: "permission_changed",
            userId: member.id,
            userName: name.trim(),
            actorId: actor.id,
            actorName: actor.name,
            detail: `${name.trim()} moved from ${member.role} to ${role}.`,
          });
        }
        toast.success(member ? "User updated" : "Team member added");
        await onSaved();
      }}
    >
      <Field label="Name">
        <Input value={name} onChange={(event) => setName(event.target.value)} />
      </Field>
      <Field label="Email">
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>
      <Field label="Role">
        <Select value={role} onValueChange={(value) => setRole(value as Role)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label={member ? "New password (optional)" : "Password"}>
        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>
      {member ? (
        <div className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2">
          <Label>Active</Label>
          <Switch checked={active} onCheckedChange={setActive} />
        </div>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
