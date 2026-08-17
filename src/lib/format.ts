import { format, formatDistanceToNow, parseISO, isValid } from "date-fns";

export function formatCurrency(value: number, compact = false) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: compact ? 0 : 2,
    minimumFractionDigits: compact ? 0 : 2,
  }).format(value);
}

export function formatDate(value: string, pattern = "MMM d, yyyy") {
  const date = parseISO(value);
  if (!isValid(date)) return value;
  return format(date, pattern);
}

export function formatShortDate(value: string) {
  return formatDate(value, "MMM d");
}

export function formatRelativeTime(value: string) {
  const date = parseFlexible(value);
  if (!isValid(date)) return value;
  return formatDistanceToNow(date, { addSuffix: true });
}

function parseFlexible(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return parseISO(`${value}T12:00:00`);
  return parseISO(value);
}

export function toDateInput(value: string) {
  return value.slice(0, 10);
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
