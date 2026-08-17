"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashPanel, DashPanelHeader } from "@/components/dashboard/panel";
import { formatRelativeTime } from "@/lib/format";
import type { DashboardTarget, UpdateItem } from "@/lib/dashboard";

export function RecentUpdates({
  companies,
  clients,
  payments,
  projects,
  showFinance,
  onOpen,
}: {
  companies: UpdateItem[];
  clients: UpdateItem[];
  payments: UpdateItem[];
  projects: UpdateItem[];
  showFinance: boolean;
  onOpen: (target: DashboardTarget) => void;
}) {
  return (
    <DashPanel delay={0.18}>
      <DashPanelHeader
        title="Recent updates"
        description="Latest companies, signed clients, payments, and productions"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <UpdateGroup
          title="Companies"
          href="/pipeline"
          items={companies}
          empty="No companies added yet."
          onOpen={onOpen}
        />
        <UpdateGroup
          title="Signed clients"
          href="/clients"
          items={clients}
          empty="No paid clients yet."
          onOpen={onOpen}
        />
        {showFinance ? (
          <UpdateGroup
            title="Payments"
            href="/finance"
            items={payments}
            empty="No invoices yet."
            onOpen={onOpen}
          />
        ) : null}
        <UpdateGroup
          title="Projects"
          href="/projects"
          items={projects}
          empty="No productions yet."
          onOpen={onOpen}
        />
      </div>
    </DashPanel>
  );
}

function UpdateGroup({
  title,
  href,
  items,
  empty,
  onOpen,
}: {
  title: string;
  href: string;
  items: UpdateItem[];
  empty: string;
  onOpen: (target: DashboardTarget) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          {title}
        </p>
        <Button variant="ghost" size="xs" asChild>
          <Link href={href}>View all</Link>
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/70 px-3 py-6 text-xs text-muted-foreground">
          {empty}
        </p>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full flex-col rounded-xl border border-border/60 px-3 py-2 text-left transition hover:border-primary/40"
              onClick={() => onOpen(item.target)}
            >
              <span className="truncate text-sm">{item.title}</span>
              <span className="text-[11px] text-muted-foreground">
                {item.hint} · {formatRelativeTime(item.timestamp)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
