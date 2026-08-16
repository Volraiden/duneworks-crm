"use client";

import { StudioWordmark } from "@/components/logo";
import { PaymentStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Client, Payment, Project } from "@/lib/types";

export function InvoiceModal({
  payment,
  client,
  project,
  studioName,
  studioAddress,
  studioEmail,
  onEdit,
}: {
  payment: Payment;
  client?: Client;
  project?: Project;
  studioName: string;
  studioAddress: string;
  studioEmail: string;
  onEdit: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <StudioWordmark />
        <PaymentStatusBadge status={payment.status} />
      </div>
      <div>
        <p className="text-[11px] tracking-[0.22em] text-gold uppercase">Invoice</p>
        <h2 className="font-heading text-4xl">{payment.invoiceNumber}</h2>
      </div>
      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-muted-foreground">From</p>
          <p className="font-medium">{studioName}</p>
          <p>{studioAddress}</p>
          <p>{studioEmail}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Bill to</p>
          <p className="font-medium">{client?.company ?? "—"}</p>
          <p>{client?.name}</p>
          <p>{client?.email}</p>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/70">
        <div className="grid grid-cols-[1fr_auto] bg-muted/40 px-4 py-2 text-xs tracking-[0.16em] text-muted-foreground uppercase">
          <span>Description</span>
          <span>Amount</span>
        </div>
        <div className="grid grid-cols-[1fr_auto] px-4 py-3 text-sm">
          <div>
            <p className="font-medium">{project?.name ?? "Production services"}</p>
            <p className="text-muted-foreground">
              {formatDate(payment.date)} · {payment.method}
            </p>
            {payment.notes ? (
              <p className="mt-1 text-muted-foreground">{payment.notes}</p>
            ) : null}
          </div>
          <p className="font-heading text-xl">{formatCurrency(payment.amount)}</p>
        </div>
      </div>
      <div className="flex justify-end">
        <Button variant="outline" onClick={onEdit}>
          Edit payment
        </Button>
      </div>
    </div>
  );
}
