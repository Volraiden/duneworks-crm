"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { GlobalModals } from "@/components/modals/global-modals";
import { BetaBadge } from "@/components/beta-badge";
import { StudioWordmark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/context/auth-context";
import { useCrm } from "@/context/crm-context";
import { SIDEBAR_STORAGE_KEY } from "@/lib/empty-data";
import { DashboardSkeleton } from "@/components/skeletons";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready: authReady, authenticated } = useAuth();
  const { ready: crmReady } = useCrm();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    if (authReady && !authenticated) router.replace("/login");
  }, [authReady, authenticated, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  };

  if (!authReady || !crmReady || !authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <div className="w-full max-w-5xl">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="sticky top-0 hidden h-screen lg:flex">
        <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />
      </div>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-72 border-sidebar-border bg-sidebar p-0 sm:max-w-72"
          showCloseButton={false}
        >
          <Sidebar
            collapsed={false}
            onToggle={() => setMobileOpen(false)}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border/70 bg-background/80 px-4 py-3 backdrop-blur-xl lg:hidden">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
            >
              <Menu />
            </Button>
            <StudioWordmark />
          </div>
          <BetaBadge />
        </header>
        <main className="mx-auto w-full flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className={pathname === "/dashboard" ? "mx-auto max-w-[92rem]" : "mx-auto max-w-7xl"}>
            {children}
          </div>
        </main>
      </div>
      <GlobalModals />
    </div>
  );
}
