import { format, parseISO, startOfMonth } from "date-fns";
import type { Client, Payment, Project } from "@/lib/types";

export function paidAmount(payments: Payment[]) {
  return payments
    .filter((payment) => payment.status === "Paid")
    .reduce((sum, payment) => sum + payment.amount, 0);
}

export function pendingAmount(payments: Payment[]) {
  return payments
    .filter((payment) => payment.status === "Pending" || payment.status === "Overdue")
    .reduce((sum, payment) => sum + payment.amount, 0);
}

export function clientRevenue(payments: Payment[], clientId: string) {
  return paidAmount(payments.filter((payment) => payment.clientId === clientId));
}

export function projectRevenue(payments: Payment[], projectId: string) {
  return paidAmount(payments.filter((payment) => payment.projectId === projectId));
}

export function monthlyRevenue(payments: Payment[], isoDate = new Date().toISOString()) {
  const month = startOfMonth(parseISO(isoDate.slice(0, 10)));
  return paidAmount(
    payments.filter((payment) => {
      const date = startOfMonth(parseISO(payment.date));
      return date.getTime() === month.getTime();
    })
  );
}

export function outstandingCount(payments: Payment[]) {
  return payments.filter(
    (payment) => payment.status === "Pending" || payment.status === "Overdue"
  ).length;
}

export function averageClientValue(clients: Client[], payments: Payment[]) {
  if (clients.length === 0) return 0;
  return paidAmount(payments) / clients.length;
}

export function revenueByMonth(payments: Payment[]) {
  const map = new Map<string, number>();
  for (const payment of payments) {
    if (payment.status !== "Paid") continue;
    const key = format(parseISO(payment.date), "yyyy-MM");
    map.set(key, (map.get(key) ?? 0) + payment.amount);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({
      month,
      label: format(parseISO(`${month}-01`), "MMM"),
      amount,
    }));
}

export function revenueByClient(clients: Client[], payments: Payment[]) {
  return clients
    .map((client) => ({
      id: client.id,
      name: client.company,
      amount: clientRevenue(payments, client.id),
    }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

export function projectCountForClient(projects: Project[], clientId: string) {
  return projects.filter((project) => project.clientId === clientId).length;
}
