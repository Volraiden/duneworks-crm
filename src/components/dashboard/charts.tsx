"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { DashPanel, DashPanelHeader } from "@/components/dashboard/panel";
import { formatCurrency } from "@/lib/format";
import type {
  ChartPoint,
  MetricTrend,
  PipelineBar,
  RevenueRange,
} from "@/lib/dashboard";
import { cn } from "@/lib/utils";

export function RevenuePipelineCharts({
  weekly,
  monthly,
  yearly,
  weekChange,
  monthChange,
  yearChange,
  pipeline,
  showFinance,
  onOpenStage,
  onOpenFinance,
}: {
  weekly: ChartPoint[];
  monthly: ChartPoint[];
  yearly: ChartPoint[];
  weekChange: MetricTrend;
  monthChange: MetricTrend;
  yearChange: MetricTrend;
  pipeline: PipelineBar[];
  showFinance: boolean;
  onOpenStage: (stageId: string) => void;
  onOpenFinance: () => void;
}) {
  const [range, setRange] = useState<RevenueRange>("monthly");
  const series = range === "weekly" ? weekly : range === "yearly" ? yearly : monthly;
  const change = range === "weekly" ? weekChange : range === "yearly" ? yearChange : monthChange;
  const hasRevenue = series.some((point) => point.amount > 0);
  const maxCount = Math.max(...pipeline.map((row) => row.count), 1);

  if (!showFinance) {
    return (
      <DashPanel delay={0.08}>
        <DashPanelHeader
          title="Pipeline"
          description="Count and potential value by stage"
        />
        {pipeline.every((row) => row.count === 0) ? (
          <EmptyChart message="Add companies to see the funnel fill in." />
        ) : (
          <PipelineBars pipeline={pipeline} maxCount={maxCount} onOpenStage={onOpenStage} />
        )}
      </DashPanel>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
      <DashPanel delay={0.08}>
        <DashPanelHeader
          title="Revenue"
          description={change.label}
          action={
            <div className="flex rounded-lg bg-muted/70 p-0.5">
              {(["weekly", "monthly", "yearly"] as const).map((item) => (
                <Button
                  key={item}
                  size="xs"
                  variant={range === item ? "secondary" : "ghost"}
                  className={cn(range === item && "bg-background")}
                  onClick={() => setRange(item)}
                >
                  {item[0].toUpperCase() + item.slice(1)}
                </Button>
              ))}
            </div>
          }
        />
        <div className="h-72">
          {hasRevenue ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} onClick={onOpenFinance}>
                <defs>
                  <linearGradient id="dwRevenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.42} />
                    <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={42}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={tooltipStyle}
                  cursor={{ stroke: "var(--gold)", strokeOpacity: 0.35 }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--gold)"
                  fill="url(#dwRevenueFill)"
                  strokeWidth={2}
                  activeDot={{ r: 5, fill: "var(--gold)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="Paid invoices will appear here as revenue lands." />
          )}
        </div>
      </DashPanel>
      <DashPanel delay={0.12}>
        <DashPanelHeader
          title="Pipeline"
          description="Count and potential value by stage"
        />
        {pipeline.every((row) => row.count === 0) ? (
          <EmptyChart message="Add companies to see the funnel fill in." />
        ) : (
          <PipelineBars pipeline={pipeline} maxCount={maxCount} onOpenStage={onOpenStage} />
        )}
      </DashPanel>
    </div>
  );
}

function PipelineBars({
  pipeline,
  maxCount,
  onOpenStage,
}: {
  pipeline: PipelineBar[];
  maxCount: number;
  onOpenStage: (stageId: string) => void;
}) {
  const chartData = useMemo(
    () => pipeline.map((row) => ({ ...row, fill: row.color })),
    [pipeline]
  );

  return (
    <div className="space-y-3">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 8 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={108}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value, _name, item) => {
                const row = item?.payload as PipelineBar | undefined;
                return [
                  `${Number(value)} · ${formatCurrency(row?.value ?? 0, true)}`,
                  "Companies / value",
                ];
              }}
              contentStyle={tooltipStyle}
            />
            <Bar
              dataKey="count"
              radius={[0, 8, 8, 0]}
              maxBarSize={18}
              cursor="pointer"
              onClick={(item) => {
                const id = (item as { id?: string }).id;
                if (id) onOpenStage(id);
              }}
            >
              {chartData.map((row) => (
                <Cell key={row.id} fill={row.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {pipeline.map((row) => (
          <button
            key={row.id}
            type="button"
            className="flex w-full items-center gap-3 text-left"
            onClick={() => onOpenStage(row.id)}
          >
            <span
              className="size-2 rounded-full"
              style={{ background: row.color }}
            />
            <span className="flex-1 text-xs text-muted-foreground">{row.name}</span>
            <span className="text-xs">{row.count}</span>
            <span className="w-20 text-right text-xs text-muted-foreground">
              {formatCurrency(row.value, true)}
            </span>
            <span className="h-1 w-16 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${Math.max(8, (row.count / maxCount) * 100)}%`,
                  background: row.color,
                }}
              />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border/70 px-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
};
