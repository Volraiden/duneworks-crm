import { formatCurrency, formatDate } from "@/lib/format";
import type { Client, Payment, Project } from "@/lib/types";

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

export function paymentsToCsv(
  payments: Payment[],
  clients: Client[],
  projects: Project[]
) {
  const header = [
    "Invoice",
    "Date",
    "Client",
    "Company",
    "Project",
    "Amount",
    "Status",
    "Method",
    "Notes",
  ];
  const rows = payments.map((payment) => {
    const client = clients.find((item) => item.id === payment.clientId);
    const project = projects.find((item) => item.id === payment.projectId);
    return [
      payment.invoiceNumber,
      formatDate(payment.date),
      client?.name ?? "",
      client?.company ?? "",
      project?.name ?? "",
      formatCurrency(payment.amount),
      payment.status,
      payment.method,
      payment.notes,
    ].map((value) => escapeCsv(String(value)));
  });
  return [header.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
