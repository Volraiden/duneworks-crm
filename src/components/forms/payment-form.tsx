"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/lib/types";
import type { Client, Payment, Project } from "@/lib/types";

export function PaymentForm({
  payment,
  clients,
  projects,
  preset,
  onSubmit,
  onCancel,
}: {
  payment?: Payment;
  clients: Client[];
  projects: Project[];
  preset?: { clientId?: string; projectId?: string };
  onSubmit: (values: Omit<Payment, "id" | "createdAt">) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [clientId, setClientId] = useState(
    payment?.clientId ?? preset?.clientId ?? clients[0]?.id ?? ""
  );
  const [projectId, setProjectId] = useState(
    payment?.projectId ?? preset?.projectId ?? ""
  );
  const [date, setDate] = useState(
    payment?.date ?? new Date().toISOString().slice(0, 10)
  );
  const [amount, setAmount] = useState(String(payment?.amount ?? ""));
  const [status, setStatus] = useState(payment?.status ?? "Pending");
  const [method, setMethod] = useState(payment?.method ?? "Wire");
  const [invoiceNumber, setInvoiceNumber] = useState(
    payment?.invoiceNumber ?? `INV-${Math.floor(2000 + Math.random() * 8000)}`
  );
  const [notes, setNotes] = useState(payment?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clientProjects = useMemo(
    () => projects.filter((project) => project.clientId === clientId),
    [clientId, projects]
  );

  function validate() {
    const next: Record<string, string> = {};
    if (!clientId) next.clientId = "Select a client.";
    if (!projectId) next.projectId = "Select a project.";
    if (!date) next.date = "Date is required.";
    if (!invoiceNumber.trim()) next.invoiceNumber = "Invoice number is required.";
    if (Number.isNaN(Number(amount)) || Number(amount) <= 0)
      next.amount = "Enter a valid amount.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!validate()) return;
        await onSubmit({
          clientId,
          projectId,
          date,
          amount: Number(amount),
          status,
          method,
          invoiceNumber: invoiceNumber.trim(),
          notes,
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Client" error={errors.clientId}>
          <Select
            value={clientId}
            onValueChange={(value) => {
              setClientId(value);
              setProjectId("");
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Project" error={errors.projectId}>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {clientProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Date" error={errors.date}>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Amount (USD)" error={errors.amount}>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field label="Status">
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as typeof status)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Method">
          <Select
            value={method}
            onValueChange={(value) => setMethod(value as typeof method)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Invoice number" error={errors.invoiceNumber}>
        <Input
          value={invoiceNumber}
          onChange={(e) => setInvoiceNumber(e.target.value)}
        />
      </Field>
      <Field label="Notes">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{payment ? "Save payment" : "Add payment"}</Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
