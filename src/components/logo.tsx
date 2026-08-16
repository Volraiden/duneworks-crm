import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("text-primary", className)}
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M6 28c6-12 10-18 14-18s8 6 14 18H6Zm8.2-3h11.6C23.4 19.8 21.4 16 20 16s-3.4 3.8-5.8 9Z"
      />
      <circle cx="20" cy="11" r="2.2" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

export function StudioWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex size-9 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
        <LogoMark className="size-5" />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="font-heading text-lg leading-none tracking-wide">
            Duneworks
          </p>
          <p className="mt-1 text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
            Productions
          </p>
        </div>
      )}
    </div>
  );
}
