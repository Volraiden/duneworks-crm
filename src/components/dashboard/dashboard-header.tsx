"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import {
  Bell,
  Building2,
  ChevronDown,
  Clapperboard,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { initials } from "@/lib/format";
import type { DashboardAlert, DashboardTarget, SearchHit } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

export function DashboardHeader({
  name,
  role,
  refreshing,
  unreadCount,
  alerts,
  readIds,
  searchHits,
  canCreate,
  canPay,
  canManageUsers,
  canManageSettings,
  onRefresh,
  onSearch,
  onQuickAdd,
  onOpenTarget,
  onMarkRead,
  onMarkAllRead,
  onLogout,
}: {
  name: string;
  role: string;
  refreshing: boolean;
  unreadCount: number;
  alerts: DashboardAlert[];
  readIds: string[];
  searchHits: SearchHit[];
  canCreate: boolean;
  canPay: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
  onRefresh: () => void;
  onSearch: (query: string) => void;
  onQuickAdd: (kind: "company" | "client" | "project" | "payment" | "user") => void;
  onOpenTarget: (target: DashboardTarget) => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onLogout: () => void;
}) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const today = useMemo(() => format(new Date(), "EEEE, MMMM d"), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        document.getElementById("dashboard-search")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="mb-8 flex flex-col gap-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-[11px] tracking-[0.24em] text-gold uppercase">
            Studio overview
          </p>
          <h1 className="font-heading text-4xl leading-tight tracking-tight md:text-5xl">
            Welcome back, {name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{today}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 xl:w-72 xl:flex-none">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="dashboard-search"
              value={query}
              placeholder="Search companies, projects…"
              className="h-9 bg-card/50 pl-8"
              onFocus={() => setSearchOpen(true)}
              onBlur={() => window.setTimeout(() => setSearchOpen(false), 180)}
              onChange={(event) => {
                setQuery(event.target.value);
                onSearch(event.target.value);
                setSearchOpen(true);
              }}
            />
            <span className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded-md border border-border/70 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
              ⌘K
            </span>
            <AnimatePresence>
              {searchOpen && query.trim().length >= 2 ? (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute top-[calc(100%+8px)] z-30 w-full overflow-hidden rounded-xl border border-border/70 bg-popover shadow-2xl"
                >
                  {searchHits.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-muted-foreground">
                      No matching records.
                    </p>
                  ) : (
                    searchHits.map((hit) => (
                      <button
                        key={hit.id}
                        type="button"
                        className="flex w-full flex-col px-3 py-2.5 text-left hover:bg-muted/70"
                        onClick={() => {
                          onOpenTarget(hit.target);
                          setSearchOpen(false);
                          setQuery("");
                        }}
                      >
                        <span className="text-sm">{hit.title}</span>
                        <span className="text-xs text-muted-foreground">{hit.hint}</span>
                      </button>
                    ))
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            aria-label="Refresh dashboard"
          >
            <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative" aria-label="Notifications">
                <Bell className="size-4" />
                {unreadCount > 0 ? (
                  <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between border-b border-border/70 px-3 py-2">
                <p className="text-sm font-medium">Alerts</p>
                <Button variant="ghost" size="xs" onClick={onMarkAllRead}>
                  Mark all read
                </Button>
              </div>
              <ScrollArea className="h-72">
                {alerts.slice(0, 8).map((alert) => {
                  const unread = !readIds.includes(alert.id);
                  return (
                    <button
                      key={alert.id}
                      type="button"
                      className="flex w-full flex-col gap-0.5 border-b border-border/50 px-3 py-2.5 text-left hover:bg-muted/50"
                      onClick={() => {
                        onMarkRead(alert.id);
                        onOpenTarget(alert.target);
                      }}
                    >
                      <span className="flex items-center gap-2 text-sm">
                        {unread ? (
                          <span className="size-1.5 rounded-full bg-gold" />
                        ) : null}
                        {alert.title}
                      </span>
                      <span className="text-xs text-muted-foreground">{alert.body}</span>
                    </button>
                  );
                })}
                {alerts.length === 0 ? (
                  <p className="px-3 py-6 text-sm text-muted-foreground">No alerts right now.</p>
                ) : null}
              </ScrollArea>
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 gap-2 px-2">
                <Avatar size="sm">
                  <AvatarFallback>{initials(name)}</AvatarFallback>
                </Avatar>
                <span className="hidden text-left sm:block">
                  <span className="block text-xs leading-none">{name}</span>
                  <span className="text-[10px] text-muted-foreground">{role}</span>
                </span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>{role} access</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {canManageUsers ? (
                <DropdownMenuItem asChild>
                  <Link href="/team">
                    <Shield />
                    Team & permissions
                  </Link>
                </DropdownMenuItem>
              ) : null}
              {canManageSettings ? (
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings />
                    Settings
                  </Link>
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onClick={onLogout}>
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {canCreate || canPay || canManageUsers ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-9">
                  <Plus />
                  Quick Add
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {canCreate ? (
                  <DropdownMenuItem onClick={() => onQuickAdd("company")}>
                    <Building2 />
                    Add Company
                  </DropdownMenuItem>
                ) : null}
                {canCreate ? (
                  <DropdownMenuItem onClick={() => onQuickAdd("client")}>
                    <Users />
                    Add Client
                  </DropdownMenuItem>
                ) : null}
                {canCreate ? (
                  <DropdownMenuItem onClick={() => onQuickAdd("project")}>
                    <Clapperboard />
                    Add Project
                  </DropdownMenuItem>
                ) : null}
                {canPay ? (
                  <DropdownMenuItem onClick={() => onQuickAdd("payment")}>
                    <Wallet />
                    Add Payment
                  </DropdownMenuItem>
                ) : null}
                {canManageUsers ? (
                  <DropdownMenuItem onClick={() => onQuickAdd("user")}>
                    <UserPlus />
                    Add Team Member
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function PriorityBadge({ priority }: { priority: DashboardAlert["priority"] }) {
  if (priority === "urgent") return <Badge variant="destructive">Urgent</Badge>;
  if (priority === "important") {
    return (
      <Badge className="border-gold/30 bg-gold/15 text-gold" variant="outline">
        Important
      </Badge>
    );
  }
  return <Badge variant="outline">Normal</Badge>;
}
