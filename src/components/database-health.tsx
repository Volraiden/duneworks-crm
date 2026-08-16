"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDatabaseStatus } from "@/app/actions/db-status";
import { cn } from "@/lib/utils";

export function DatabaseHealth({ collapsed }: { collapsed: boolean }) {
  const [healthy, setHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const status = await getDatabaseStatus();
        if (active) setHealthy(status.healthy);
      } catch {
        if (active) setHealthy(false);
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <Link
      href="/settings#database"
      className={cn(
        "mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground transition hover:bg-sidebar-accent/70 hover:text-foreground",
        collapsed && "justify-center px-0"
      )}
    >
      <span
        className={cn(
          "size-2 shrink-0 rounded-full",
          healthy === null && "bg-muted-foreground/50",
          healthy === true && "bg-emerald-400",
          healthy === false && "bg-destructive"
        )}
      />
      {!collapsed && (
        <span>
          {healthy === null
            ? "Checking database"
            : healthy
              ? "SQLite online"
              : "Database offline"}
        </span>
      )}
    </Link>
  );
}
