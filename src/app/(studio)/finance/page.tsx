"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageTransition } from "@/components/page-chrome";
import { EmptyState } from "@/components/empty-state";
import { PaymentStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCrm } from "@/context/crm-context";
import { useAuth } from "@/context/auth-context";
import { PAYMENT_STATUSES } from "@/lib/types";
import {
  averageClientValue,
  paidAmount,
  pendingAmount,
  revenueByClient,
  revenueByMonth,
} from "@/lib/analytics";
import { downloadCsv, paymentsToCsv } from "@/lib/csv";
import { formatCurrency, formatDate } from "@/lib/format";

export default function FinancePage() {
  const { data, openDialog } = useCrm();
  const { allow } = useAuth();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const earned = paidAmount(data.payments);
  const pending = pendingAmount(data.payments);
  const average = averageClientValue(data.clients, data.payments);
  const monthly = revenueByMonth(data.payments);
  const byClient = revenueByClient(data.clients, data.payments).slice(0, 8);

  const filtered = useMemo(
    () =>
      data.payments.filter((payment) => {
        const client = data.clients.find((item) => item.id === payment.clientId);
        const project = data.projects.find((item) => item.id === payment.projectId);
        const haystack =
          `${payment.invoiceNumber} ${client?.company ?? ""} ${project?.name ?? ""}`.toLowerCase();
        return (
          haystack.includes(query.toLowerCase()) &&
          (status === "all" || payment.status === status)
        );
      }),
    [data.clients, data.payments, data.projects, query, status]
  );

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Ledger"
        title="Finance"
        description="Revenue by month and client, with a complete payment log."
        actions={
          <>
            {allow("viewFinanceAnalytics") ? (
            <Button
              variant="outline"
              onClick={() => {
                downloadCsv(
                  "duneworks-payments.csv",
                  paymentsToCsv(data.payments, data.clients, data.projects)
                );
                toast.success("Payment CSV exported");
              }}
            >
              <Download />
              Export CSV
            </Button>
            ) : null}
            {allow("managePayments") ? (
            <Button onClick={() => openDialog("payment")}>
              <Plus />
              Add Payment
            </Button>
            ) : null}
          </>
        }
      />
      {allow("viewFinanceAnalytics") ? (
      <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total earned" value={formatCurrency(earned, true)} />
        <Stat label="Pending revenue" value={formatCurrency(pending, true)} />
        <Stat label="Average client value" value={formatCurrency(average, true)} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Revenue by month</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
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
                <Bar dataKey="amount" fill="var(--gold)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Revenue by client</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byClient} layout="vertical">
                <CartesianGrid stroke="var(--border)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="amount" fill="var(--sand)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      </>
      ) : null}
      <div className="mt-8 mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 pl-9"
            placeholder="Search invoices, clients, or projects"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {PAYMENT_STATUSES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="size-5" />}
          title="No payments found"
          description="Adjust filters or log a new invoice."
          actionLabel={allow("managePayments") ? "Add Payment" : undefined}
          onAction={allow("managePayments") ? () => openDialog("payment") : undefined}
        />
      ) : (
        <div className="glass-panel rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((payment) => {
                  const client = data.clients.find((item) => item.id === payment.clientId);
                  const project = data.projects.find((item) => item.id === payment.projectId);
                  return (
                    <TableRow
                      key={payment.id}
                      className="cursor-pointer"
                      onClick={() => openDialog("paymentDetail", payment.id)}
                    >
                      <TableCell>{formatDate(payment.date)}</TableCell>
                      <TableCell>{client?.company}</TableCell>
                      <TableCell>{project?.name}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={payment.status} />
                      </TableCell>
                      <TableCell>{payment.method}</TableCell>
                      <TableCell>{payment.invoiceNumber}</TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      )}
    </PageTransition>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="glass-panel">
      <CardContent>
        <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          {label}
        </p>
        <p className="font-heading mt-2 text-3xl">{value}</p>
      </CardContent>
    </Card>
  );
}
