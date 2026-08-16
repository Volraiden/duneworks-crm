"use client";

import { useEffect } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { AuthProvider } from "@/context/auth-context";
import { CrmProvider, useCrm } from "@/context/crm-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

function ThemeSync() {
  const { data, ready } = useCrm();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (ready) setTheme(data.settings.appearance);
  }, [data.settings.appearance, ready, setTheme]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider delayDuration={200}>
        <AuthProvider>
          <CrmProvider>
            <ThemeSync />
            {children}
            <Toaster position="top-right" richColors closeButton />
          </CrmProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
