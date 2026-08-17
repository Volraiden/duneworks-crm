"use client";

import {
  ArrowRightLeft,
  Ban,
  Building2,
  CheckCircle2,
  Clapperboard,
  Pencil,
  Shield,
  StickyNote,
  UserPlus,
  Wallet,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DashPanel, DashPanelHeader } from "@/components/dashboard/panel";
import { formatRelativeTime, initials } from "@/lib/format";
import type { ActivityEntry, DashboardTarget } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

const ICONS = {
  company_created: Building2,
  stage_move: ArrowRightLeft,
  denied: Ban,
  client_updated: Pencil,
  payment_received: Wallet,
  project_created: Clapperboard,
  project_completed: CheckCircle2,
  team_added: UserPlus,
  permission_changed: Shield,
  note: StickyNote,
};

export function ActivityFeed({
  entries,
  onOpen,
  onViewAll,
}: {
  entries: ActivityEntry[];
  onOpen: (target: DashboardTarget) => void;
  onViewAll: () => void;
}) {
  const preview = entries.slice(0, 8);

  return (
    <DashPanel delay={0.14}>
      <DashPanelHeader
        title="Recent activity"
        description="Studio audit trail"
        action={
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View full activity log
          </Button>
        }
      />
      {preview.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Activity will appear as the studio moves companies, payments, and projects.
        </p>
      ) : (
        <div className="space-y-1">
          {preview.map((entry) => (
            <ActivityRow key={entry.id} entry={entry} onOpen={onOpen} />
          ))}
        </div>
      )}
    </DashPanel>
  );
}

export function ActivityLogSheet({
  open,
  entries,
  onClose,
  onOpen,
}: {
  open: boolean;
  entries: ActivityEntry[];
  onClose: () => void;
  onOpen: (target: DashboardTarget) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Activity log</SheetTitle>
          <SheetDescription>
            Companies, pipeline moves, payments, projects, and team changes.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-7rem)] px-4 pb-8">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recorded activity yet.</p>
          ) : (
            <div className="space-y-1">
              {entries.map((entry) => (
                <ActivityRow key={entry.id} entry={entry} onOpen={onOpen} />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function ActivityRow({
  entry,
  onOpen,
}: {
  entry: ActivityEntry;
  onOpen: (target: DashboardTarget) => void;
}) {
  const Icon = ICONS[entry.type];
  return (
    <button
      type="button"
      className="flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-muted/40"
      onClick={() => entry.target && onOpen(entry.target)}
    >
      <span
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border",
          entry.tone === "danger" && "border-destructive/30 bg-destructive/10 text-destructive",
          entry.tone === "success" && "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
          entry.tone === "gold" && "border-gold/30 bg-gold/10 text-gold",
          entry.tone === "sand" && "border-sand/20 bg-sand/10 text-sand",
          entry.tone === "muted" && "border-border bg-muted text-muted-foreground"
        )}
      >
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-medium">{entry.userName}</span>{" "}
          <span className="text-muted-foreground">{entry.action}</span>
        </p>
        <p className="truncate text-xs text-muted-foreground">{entry.entityLabel}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Avatar size="sm">
          <AvatarFallback>{initials(entry.userName)}</AvatarFallback>
        </Avatar>
        <span className="text-[10px] text-muted-foreground">
          {formatRelativeTime(entry.timestamp)}
        </span>
      </div>
    </button>
  );
}
