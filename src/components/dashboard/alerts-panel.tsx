"use client";

import { Button } from "@/components/ui/button";
import { DashPanel, DashPanelHeader } from "@/components/dashboard/panel";
import { PriorityBadge } from "@/components/dashboard/dashboard-header";
import type { DashboardAlert, DashboardTarget } from "@/lib/dashboard";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function AlertsPanel({
  alerts,
  readIds,
  onOpen,
  onMarkRead,
  onMarkAllRead,
}: {
  alerts: DashboardAlert[];
  readIds: string[];
  onOpen: (target: DashboardTarget) => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}) {
  const unread = alerts.filter((alert) => !readIds.includes(alert.id));

  return (
    <DashPanel delay={0.16}>
      <DashPanelHeader
        title="Notifications"
        description={`${unread.length} unread`}
        action={
          unread.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={onMarkAllRead}>
              Mark all as read
            </Button>
          ) : null
        }
      />
      {alerts.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No studio alerts. Overdue invoices, quiet leads, and demos will land here.
        </p>
      ) : (
        <div className="space-y-2">
          {alerts.slice(0, 7).map((alert) => {
            const unreadItem = !readIds.includes(alert.id);
            return (
              <button
                key={alert.id}
                type="button"
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition hover:border-primary/40",
                  unreadItem
                    ? "border-gold/25 bg-gold/5"
                    : "border-border/60 bg-card/30"
                )}
                onClick={() => {
                  onMarkRead(alert.id);
                  onOpen(alert.target);
                }}
              >
                <span
                  className={cn(
                    "mt-1 size-1.5 shrink-0 rounded-full",
                    alert.priority === "urgent" && "bg-destructive",
                    alert.priority === "important" && "bg-gold",
                    alert.priority === "normal" && "bg-muted-foreground"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <PriorityBadge priority={alert.priority} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{alert.body}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {formatRelativeTime(alert.timestamp)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </DashPanel>
  );
}
