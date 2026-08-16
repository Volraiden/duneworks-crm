"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { PageHeader, PageTransition } from "@/components/page-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCrm } from "@/context/crm-context";
import type { Appearance } from "@/lib/types";
import { DatabaseStatusPanel } from "@/components/database-status";

export default function SettingsPage() {
  const { data, updateSettings } = useCrm();
  const { setTheme } = useTheme();
  const { settings } = data;
  const [profile, setProfile] = useState({
    studioName: settings.studioName,
    email: settings.email,
    phone: settings.phone,
    website: settings.website,
    address: settings.address,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setProfile({
      studioName: settings.studioName,
      email: settings.email,
      phone: settings.phone,
      website: settings.website,
      address: settings.address,
    });
  }, [settings]);

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Studio"
        title="Settings"
        description="Profile, notifications, appearance, and database health."
      />
      <div className="grid gap-6">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Studio profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Studio name">
              <Input
                value={profile.studioName}
                onChange={(e) =>
                  setProfile((current) => ({ ...current, studioName: e.target.value }))
                }
              />
            </Field>
            <Field label="Email">
              <Input
                value={profile.email}
                onChange={(e) =>
                  setProfile((current) => ({ ...current, email: e.target.value }))
                }
              />
            </Field>
            <Field label="Phone">
              <Input
                value={profile.phone}
                onChange={(e) =>
                  setProfile((current) => ({ ...current, phone: e.target.value }))
                }
              />
            </Field>
            <Field label="Website">
              <Input
                value={profile.website}
                onChange={(e) =>
                  setProfile((current) => ({ ...current, website: e.target.value }))
                }
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address">
                <Input
                  value={profile.address}
                  onChange={(e) =>
                    setProfile((current) => ({ ...current, address: e.target.value }))
                  }
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Button
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  await updateSettings(profile);
                  setSaving(false);
                  toast.success("Studio profile saved");
                }}
              >
                {saving ? "Saving…" : "Save profile"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Toggle
              label="Project deadlines"
              description="Remind the studio before delivery dates."
              checked={settings.notifications.projectDeadlines}
              onChange={(projectDeadlines) =>
                updateSettings({
                  notifications: { ...settings.notifications, projectDeadlines },
                })
              }
            />
            <Toggle
              label="Payment reminders"
              description="Flag pending and overdue invoices."
              checked={settings.notifications.paymentReminders}
              onChange={(paymentReminders) =>
                updateSettings({
                  notifications: { ...settings.notifications, paymentReminders },
                })
              }
            />
            <Toggle
              label="New leads"
              description="Notify when a lead is added to the roster."
              checked={settings.notifications.newLeads}
              onChange={(newLeads) =>
                updateSettings({
                  notifications: { ...settings.notifications, newLeads },
                })
              }
            />
            <Toggle
              label="Weekly digest"
              description="A Monday summary of productions and cashflow."
              checked={settings.notifications.weeklyDigest}
              onChange={(weeklyDigest) =>
                updateSettings({
                  notifications: { ...settings.notifications, weeklyDigest },
                })
              }
            />
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent className="max-w-sm">
            <Field label="Theme">
              <Select
                value={settings.appearance}
                onValueChange={(value) => {
                  const appearance = value as Appearance;
                  void updateSettings({ appearance });
                  setTheme(appearance);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark charcoal</SelectItem>
                  <SelectItem value="light">Warm light</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </CardContent>
        </Card>

        <DatabaseStatusPanel />
      </div>
    </PageTransition>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 px-4 py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
