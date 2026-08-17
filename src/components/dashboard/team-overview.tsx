"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DashPanel, DashPanelHeader } from "@/components/dashboard/panel";
import { initials } from "@/lib/format";
import type { TeamRow } from "@/lib/dashboard";

export function TeamOverview({
  rows,
  canManage,
}: {
  rows: TeamRow[];
  canManage: boolean;
}) {
  return (
    <DashPanel delay={0.22}>
      <DashPanelHeader
        title="Team"
        description="Assigned companies and relative workload"
        action={
          canManage ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/team">Manage</Link>
            </Button>
          ) : null
        }
      />
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No active team members to show.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-xl border border-border/60 px-3 py-2.5">
              <div className="mb-2 flex items-center gap-3">
                <Avatar size="sm">
                  <AvatarFallback>{initials(row.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{row.name}</p>
                  <p className="text-[11px] text-muted-foreground">{row.role}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {row.assigned} {row.assigned === 1 ? "company" : "companies"}
                </p>
              </div>
              <Progress value={row.workload} className="h-1" />
            </div>
          ))}
        </div>
      )}
    </DashPanel>
  );
}
