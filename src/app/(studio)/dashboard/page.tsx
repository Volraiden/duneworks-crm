"use client";

import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Link from "next/link";
import { ArrowUpRight, Clapperboard, Columns3, Plus, Users } from "lucide-react";
import { PageHeader, PageTransition } from "@/components/page-chrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentStatusBadge, ProjectStatusBadge } from "@/components/status-badge";
import { DatabaseStatusPanel } from "@/components/database-status";
import { useAuth } from "@/context/auth-context";
import { useCrm } from "@/context/crm-context";
import {
  monthlyRevenue,
  outstandingCount,
  paidAmount,
  revenueByMonth,
} from "@/lib/analytics";
import { formatCurrency, formatDate } from "@/lib/format";
import { compareAsc, parseISO } from "date-fns";

export default function DashboardPage() {
  const { user, allow } = useAuth();
  const { data, openDialog } = useCrm();
  const { clients, projects, payments, stages } = data;

  const totalRevenue = paidAmount(payments);
  const thisMonth = monthlyRevenue(payments);
  const activeClients = clients.filter((client) => client.status === "Active").length;
  const outstanding = outstandingCount(payments);
  const chart = revenueByMonth(payments);
  const showFinance = allow("viewFinanceAnalytics");
  const recentPayments = [...payments]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);
  const upcoming = [...projects]
    .filter((project) => project.status !== "Delivered")
    .sort((a, b) => compareAsc(parseISO(a.deadline), parseISO(b.deadline)))
    .slice(0, 5);

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Studio overview"
        title={`Welcome back, ${user?.name ?? "Duneworks"}`}
        description="Production, clients, and cashflow for Duneworks — in one place."
        actions={
          <>
            {allow("createRecords") ? (
              <Button variant="outline" onClick={() => openDialog("client")}>
                <Users />
                Add company
              </Button>
            ) : null}
            {allow("createRecords") ? (
              <Button variant="outline" onClick={() => openDialog("project")}>
                <Clapperboard />
                Add project
              </Button>
            ) : null}
            {allow("managePayments") ? (
              <Button onClick={() => openDialog("payment")}>
                <Plus />
                Add payment
              </Button>
            ) : null}
            <Button variant="outline" asChild>
              <Link href="/pipeline">
                <Columns3 />
                Pipeline
              </Link>
            </Button>
          </>
        }
      />
      {showFinance ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total revenue"
            value={formatCurrency(totalRevenue, true)}
            hint="Paid invoices"
          />
          <SummaryCard
            label="Monthly revenue"
            value={formatCurrency(thisMonth, true)}
            hint="Paid this month"
          />
          <SummaryCard
            label="Paid clients"
            value={String(activeClients)}
            hint={`${clients.length} in pipeline`}
          />
          <SummaryCard
            label="Outstanding invoices"
            value={String(outstanding)}
            hint="Pending + overdue"
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            label="Pipeline companies"
            value={String(clients.length)}
            hint="Across all stages"
          />
          <SummaryCard
            label="Paid clients"
            value={String(activeClients)}
            hint="Available for productions"
          />
          <SummaryCard
            label="Active projects"
            value={String(projects.filter((project) => project.status !== "Delivered").length)}
            hint="Not yet delivered"
          />
        </div>
      )}
      <div className="mt-4">
        <Card className="glass-panel">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Pipeline</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/pipeline">
                Open board
                <ArrowUpRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className="rounded-xl border border-border/70 bg-card/50 px-3 py-3"
                >
                  <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                    {stage.name}
                  </p>
                  <p className="font-heading mt-1 text-2xl">
                    {clients.filter((client) => client.stageId === stage.id).length}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-4">
        <DatabaseStatusPanel compact />
      </div>
      {showFinance ? (
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Revenue over time</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={42}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--gold)"
                  fill="url(#revenueFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Upcoming deadlines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming deadlines.</p>
            ) : (
              upcoming.map((project) => {
                const client = clients.find((item) => item.id === project.clientId);
                return (
                  <button
                    key={project.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl border border-border/60 px-3 py-2 text-left transition hover:border-primary/40"
                    onClick={() => openDialog("projectDetail", project.id)}
                  >
                    <div>
                      <p className="text-sm font-medium">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {client?.company} · {formatDate(project.deadline)}
                      </p>
                    </div>
                    <ProjectStatusBadge status={project.status} />
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
      ) : (
        <Card className="glass-panel mt-6">
          <CardHeader>
            <CardTitle>Upcoming deadlines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming deadlines.</p>
            ) : (
              upcoming.map((project) => {
                const client = clients.find((item) => item.id === project.clientId);
                return (
                  <button
                    key={project.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl border border-border/60 px-3 py-2 text-left transition hover:border-primary/40"
                    onClick={() => openDialog("projectDetail", project.id)}
                  >
                    <div>
                      <p className="text-sm font-medium">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {client?.company} · {formatDate(project.deadline)}
                      </p>
                    </div>
                    <ProjectStatusBadge status={project.status} />
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>
      )}
      {allow("viewFinance") ? (
      <Card className="glass-panel mt-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent payments</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/finance">
              View finance
              <ArrowUpRight />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentPayments.map((payment) => {
            const client = clients.find((item) => item.id === payment.clientId);
            return (
              <button
                key={payment.id}
                type="button"
                className="flex w-full items-center justify-between rounded-xl border border-border/60 px-3 py-2 text-left transition hover:border-primary/40"
                onClick={() => openDialog("paymentDetail", payment.id)}
              >
                <div>
                  <p className="text-sm font-medium">{client?.company}</p>
                  <p className="text-xs text-muted-foreground">
                    {payment.invoiceNumber} · {formatDate(payment.date)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{formatCurrency(payment.amount)}</span>
                  <PaymentStatusBadge status={payment.status} />
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>
      ) : null}
    </PageTransition>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="glass-panel h-full">
        <CardContent className="pt-1">
          <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
            {label}
          </p>
          <p className="font-heading mt-2 text-3xl">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
