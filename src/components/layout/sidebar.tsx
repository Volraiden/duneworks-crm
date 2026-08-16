"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Settings,
  Users,
  Clapperboard,
  Wallet,
} from "lucide-react";
import { BetaBadge } from "@/components/beta-badge";
import { StudioWordmark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { DatabaseHealth } from "@/components/database-health";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/projects", label: "Projects", icon: Clapperboard },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  collapsed,
  onToggle,
  onNavigate,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar/90 backdrop-blur-xl transition-[width] duration-300",
        collapsed ? "w-[76px]" : "w-64"
      )}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-5">
        <StudioWordmark compact={collapsed} />
        {!collapsed && <BetaBadge />}
      </div>
      <div className="px-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={onToggle}
        >
          <PanelLeft />
          {!collapsed && <span>Collapse</span>}
        </Button>
      </div>
      <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const link = (
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
          if (!collapsed) {
            return <div key={item.href}>{link}</div>;
          }
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
      <Separator />
      <div className="p-3">
        <DatabaseHealth collapsed={collapsed} />
        <div
          className={cn(
            "mb-3 rounded-xl bg-sidebar-accent/60 px-3 py-3",
            collapsed && "px-0 text-center"
          )}
        >
          {!collapsed && (
            <>
              <p className="truncate text-sm font-medium">{user?.name ?? "Studio"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.role ?? "Studio Lead"}
              </p>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-muted-foreground",
            collapsed && "justify-center px-0"
          )}
          onClick={logout}
        >
          <LogOut />
          {!collapsed && <span>Log out</span>}
        </Button>
      </div>
    </aside>
  );
}
