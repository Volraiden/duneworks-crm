"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Client, ClientNote, TeamMember } from "@/lib/types";

export function CompanyCard({
  client,
  assignee,
  lastNote,
  lifted = false,
  onOpen,
}: {
  client: Client;
  assignee?: TeamMember;
  lastNote?: string;
  lifted?: boolean;
  onOpen?: () => void;
}) {
  const contact = client.phone || client.email || "No contact yet";

  return (
    <motion.button
      type="button"
      layout={!lifted}
      onClick={onOpen}
      className={cn(
        "w-full rounded-xl border border-white/8 bg-[oklch(0.2_0.018_255_/_0.92)] p-3 text-left transition",
        lifted
          ? "scale-[1.04] shadow-[0_24px_50px_-20px_rgb(0_0_0_/_80%)] ring-1 ring-gold/40"
          : "hover:-translate-y-0.5 hover:border-gold/30 hover:shadow-[0_16px_32px_-24px_rgb(0_0_0_/_70%)]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{client.company}</p>
          <p className="font-mono text-[10px] tracking-wide text-gold/80">
            #{client.clientNumber}
          </p>
        </div>
        {assignee ? (
          <span
            title={assignee.name}
            className="flex size-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[9px] font-medium"
          >
            {initials(assignee.name)}
          </span>
        ) : null}
      </div>
      <p className="mt-2 truncate text-xs text-muted-foreground">{client.name}</p>
      <p className="truncate text-[11px] text-muted-foreground/80">{contact}</p>
      {lastNote ? (
        <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-sand/80">
          {lastNote}
        </p>
      ) : null}
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-gold">
          {formatCurrency(client.potentialValue, true)}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {formatDate(client.lastActivity, "MMM d")}
        </p>
      </div>
      {client.tags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {client.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="h-5 px-1.5 text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}
    </motion.button>
  );
}
