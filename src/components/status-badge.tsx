import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  ClientStatus,
  EventType,
  PaymentStatus,
  ProjectStatus,
} from "@/lib/types";

const clientStyles: Record<ClientStatus, string> = {
  Lead: "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200",
  Active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  Paused: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  Completed: "border-primary/30 bg-primary/10 text-primary",
  Denied: "border-destructive/40 bg-destructive/15 text-destructive",
};

const projectStyles: Record<ProjectStatus, string> = {
  Inquiry: "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200",
  "Pre-production": "border-violet-500/30 bg-violet-500/10 text-violet-800 dark:text-violet-200",
  Production: "border-gold/40 bg-gold/10 text-amber-800 dark:text-gold",
  Editing: "border-orange-500/30 bg-orange-500/10 text-orange-800 dark:text-orange-200",
  Delivered: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
};

const paymentStyles: Record<PaymentStatus, string> = {
  Paid: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  Pending: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  Overdue: "border-destructive/40 bg-destructive/15 text-destructive",
};

const eventStyles: Record<EventType, string> = {
  deadline: "bg-[#c9a45c]",
  meeting: "bg-sky-400",
  shoot: "bg-orange-400",
  payment: "bg-emerald-400",
};

const eventLabels: Record<EventType, string> = {
  deadline: "Deadline",
  meeting: "Meeting",
  shoot: "Shoot",
  payment: "Payment",
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return (
    <Badge variant="outline" className={cn("border", clientStyles[status])}>
      {status}
    </Badge>
  );
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge variant="outline" className={cn("border", projectStyles[status])}>
      {status}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant="outline" className={cn("border", paymentStyles[status])}>
      {status}
    </Badge>
  );
}

export function EventTypeDot({ type }: { type: EventType }) {
  return (
    <span
      className={cn("inline-block size-2 rounded-full", eventStyles[type])}
      title={eventLabels[type]}
    />
  );
}

export function eventTypeLabel(type: EventType) {
  return eventLabels[type];
}

export function eventTypeColor(type: EventType) {
  return eventStyles[type];
}
