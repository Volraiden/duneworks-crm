"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Database, RefreshCw, Server } from "lucide-react";
import { getDatabaseStatus, type DatabaseStatus } from "@/app/actions/db-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function DatabaseStatusPanel({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStatus(await getDatabaseStatus());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const chart = useMemo(
    () =>
      status
        ? [
            { name: "Users", value: status.tables.users },
            { name: "Clients", value: status.tables.clients },
            { name: "Notes", value: status.tables.notes },
            { name: "Projects", value: status.tables.projects },
            { name: "Payments", value: status.tables.payments },
            { name: "Events", value: status.tables.events },
          ]
        : [],
    [status]
  );

  const totalRecords = status
    ? Object.values(status.tables).reduce((sum, value) => sum + value, 0)
    : 0;

  if (compact) {
    return (
      <Card className="glass-panel">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Database status</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/settings#database">Details</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading || !status ? (
            <Skeleton className="h-16 rounded-xl" />
          ) : (
            <div className="space-y-3">
              <HealthLine healthy={status.healthy} latencyMs={status.latencyMs} />
              <p className="text-sm text-muted-foreground">
                {status.engine} · {status.hosting} · {formatBytes(status.sizeBytes)} ·{" "}
                {totalRecords} records
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="database" className="glass-panel scroll-mt-24">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Database status</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Hosting, connection health, and live record analytics.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading && !status ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        ) : status ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Stat
                icon={<Database className="size-4" />}
                label="Connection"
                value={status.healthy ? "Online" : "Offline"}
                hint={`${status.latencyMs} ms ping`}
                ok={status.healthy}
              />
              <Stat
                icon={<Server className="size-4" />}
                label="Hosting"
                value={status.hosting}
                hint={`${status.environment} · ${status.hostname}`}
              />
              <Stat
                label="Engine"
                value={status.engine}
                hint={`${status.provider} ORM`}
              />
              <Stat
                label="Database size"
                value={formatBytes(status.sizeBytes)}
                hint={
                  status.lastModified
                    ? `Updated ${formatDate(status.lastModified, "MMM d, yyyy p")}`
                    : "File not found"
                }
              />
            </div>
            {status.error ? (
              <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {status.error}
              </p>
            ) : null}
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-border/70 p-4">
                <p className="mb-3 text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                  Record analytics
                </p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chart}>
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={28}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                        }}
                      />
                      <Bar dataKey="value" fill="var(--gold)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-2 rounded-2xl border border-border/70 p-4 text-sm">
                <Row label="Total records" value={String(totalRecords)} />
                <Row label="Users" value={String(status.tables.users)} />
                <Row label="Clients" value={String(status.tables.clients)} />
                <Row
                  label="Notes"
                  value={String(status.tables.notes)}
                />
                <Row label="Projects" value={String(status.tables.projects)} />
                <Row label="Payments" value={String(status.tables.payments)} />
                <Row label="Calendar events" value={String(status.tables.events)} />
                <Row label="Latest migration" value={status.latestMigration ?? "—"} />
                <Row label="File" value={status.fileExists ? status.filePath : "Missing"} />
                <Row
                  label="Checked"
                  value={formatDate(status.checkedAt, "MMM d, yyyy p")}
                />
              </div>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function HealthLine({
  healthy,
  latencyMs,
}: {
  healthy: boolean;
  latencyMs: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "size-2 rounded-full",
          healthy ? "bg-emerald-400" : "bg-destructive"
        )}
      />
      <span className="text-sm font-medium">
        {healthy ? "Database online" : "Database offline"}
      </span>
      <span className="text-xs text-muted-foreground">{latencyMs} ms</span>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  icon,
  ok,
}: {
  label: string;
  value: string;
  hint: string;
  icon?: React.ReactNode;
  ok?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/50 p-3">
      <p className="flex items-center gap-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
        {icon}
        {label}
      </p>
      <p
        className={cn(
          "font-heading mt-1 text-2xl",
          ok === false && "text-destructive",
          ok === true && "text-emerald-300"
        )}
      >
        {value}
      </p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/50 py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right break-all">{value}</span>
    </div>
  );
}
