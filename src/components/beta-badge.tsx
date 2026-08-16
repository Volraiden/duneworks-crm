import { cn } from "@/lib/utils";

export function BetaBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold tracking-[0.18em] text-gold uppercase",
        className
      )}
    >
      Beta
    </span>
  );
}
