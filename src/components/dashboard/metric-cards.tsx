"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  Columns3,
  ListChecks,
  Minus,
  Percent,
  Users,
  Wallet,
} from "lucide-react";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { formatCurrency } from "@/lib/format";
import type { MetricCardModel, MetricId } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

const ICONS: Record<MetricId, typeof CircleDollarSign> = {
  totalRevenue: CircleDollarSign,
  monthRevenue: Wallet,
  activeClients: Users,
  pipelineValue: Activity,
  dealsInProgress: Columns3,
  outstanding: Wallet,
  conversion: Percent,
  tasksDue: ListChecks,
};

export function MetricCards({
  metrics,
  onOpen,
}: {
  metrics: MetricCardModel[];
  onOpen: (id: MetricId) => void;
}) {
  const visible = metrics.filter((metric) => metric.visible);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {visible.map((metric, index) => {
        const Icon = ICONS[metric.id];
        return (
          <motion.button
            key={metric.id}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.04 }}
            onClick={() => onOpen(metric.id)}
            className="glass-panel relative overflow-hidden rounded-2xl p-4 text-left transition hover:border-primary/30"
          >
            <div className="absolute inset-y-0 left-0 w-px bg-gold/40" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl border border-gold/20 bg-gold/10 text-gold">
                <Icon className="size-4" />
              </div>
              <TrendPill trend={metric.trend} />
            </div>
            <p className="mt-4 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              {metric.label}
            </p>
            <p className="font-heading mt-1 text-3xl tracking-tight">
              <AnimatedNumber
                value={metric.value}
                format={(value) => {
                  if (metric.format === "currency") return formatCurrency(value, true);
                  if (metric.format === "percent") return `${value.toFixed(1)}%`;
                  return Math.round(value).toLocaleString();
                }}
              />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{metric.hint}</p>
          </motion.button>
        );
      })}
    </div>
  );
}

function TrendPill({
  trend,
}: {
  trend: MetricCardModel["trend"];
}) {
  const Icon =
    trend.direction === "up"
      ? ArrowUpRight
      : trend.direction === "down"
        ? ArrowDownRight
        : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px]",
        trend.direction === "up" && "bg-emerald-500/10 text-emerald-300",
        trend.direction === "down" && "bg-destructive/15 text-destructive",
        trend.direction === "flat" && "bg-muted text-muted-foreground"
      )}
    >
      <Icon className="size-3" />
      {trend.percent == null
        ? "New"
        : `${trend.percent > 0 ? "+" : ""}${trend.percent.toFixed(1)}%`}
    </span>
  );
}
