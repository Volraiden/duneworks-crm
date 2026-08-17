"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { DashboardTarget, DetailRow } from "@/lib/dashboard";

export function DashboardDetailSheet({
  open,
  title,
  description,
  rows,
  onClose,
  onOpen,
}: {
  open: boolean;
  title: string;
  description?: string;
  rows: DetailRow[];
  onClose: () => void;
  onOpen: (target: DashboardTarget) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-7rem)] px-4 pb-8">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing to show yet.</p>
          ) : (
            <div className="space-y-2">
              {rows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  className="flex w-full flex-col rounded-xl border border-border/60 bg-card/40 px-3 py-2.5 text-left transition hover:border-primary/40"
                  onClick={() => {
                    onOpen(row.target);
                    onClose();
                  }}
                >
                  <span className="text-sm font-medium">{row.title}</span>
                  <span className="text-xs text-muted-foreground">{row.hint}</span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
