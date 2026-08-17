import {
  addDays,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { paidAmount } from "@/lib/analytics";
import type { StudioAuditEntry, DashboardTask } from "@/lib/dashboard-storage";
import { isPaidClient, isPaidStage, type CrmData, type DialogKind } from "@/lib/types";

export type RevenueRange = "weekly" | "monthly" | "yearly";
export type AlertPriority = "urgent" | "important" | "normal";
export type DashboardTarget =
  | { type: "route"; href: string }
  | { type: "dialog"; kind: DialogKind; id?: string | null; preset?: Record<string, string> };

export type MetricId =
  | "totalRevenue"
  | "monthRevenue"
  | "activeClients"
  | "pipelineValue"
  | "dealsInProgress"
  | "outstanding"
  | "conversion"
  | "tasksDue";

export interface MetricTrend {
  direction: "up" | "down" | "flat";
  percent: number | null;
  label: string;
}

export interface MetricCardModel {
  id: MetricId;
  label: string;
  value: number;
  format: "currency" | "number" | "percent";
  hint: string;
  trend: MetricTrend;
  href?: string;
  visible: boolean;
}

export interface ChartPoint {
  key: string;
  label: string;
  amount: number;
}

export interface PipelineBar {
  id: string;
  name: string;
  kind: string;
  color: string;
  count: number;
  value: number;
}

export interface ActivityEntry {
  id: string;
  type:
    | "company_created"
    | "stage_move"
    | "denied"
    | "client_updated"
    | "payment_received"
    | "project_created"
    | "project_completed"
    | "team_added"
    | "permission_changed"
    | "note";
  userId: string | null;
  userName: string;
  action: string;
  entityLabel: string;
  entityKind: "company" | "project" | "payment" | "team" | "system";
  target: DashboardTarget | null;
  timestamp: string;
  tone: "gold" | "sand" | "muted" | "danger" | "success";
}

export interface DashboardAlert {
  id: string;
  title: string;
  body: string;
  priority: AlertPriority;
  timestamp: string;
  target: DashboardTarget;
}

export interface UpdateItem {
  id: string;
  title: string;
  hint: string;
  timestamp: string;
  target: DashboardTarget;
}

export interface UpcomingItem {
  id: string;
  title: string;
  dueLabel: string;
  dueAt: string;
  kind: "meeting" | "demo" | "deadline" | "followup" | "invoice" | "task";
  relatedLabel: string;
  target: DashboardTarget | null;
  source: "derived" | "custom";
  done: boolean;
}

export interface TeamRow {
  id: string;
  name: string;
  role: string;
  assigned: number;
  workload: number;
}

export interface SearchHit {
  id: string;
  title: string;
  hint: string;
  target: DashboardTarget;
}

export interface DetailRow {
  id: string;
  title: string;
  hint: string;
  target: DashboardTarget;
}

export interface DashboardModel {
  metrics: MetricCardModel[];
  revenue: {
    weekly: ChartPoint[];
    monthly: ChartPoint[];
    yearly: ChartPoint[];
    weekChange: MetricTrend;
    monthChange: MetricTrend;
    yearChange: MetricTrend;
  };
  pipeline: PipelineBar[];
  activity: ActivityEntry[];
  alerts: DashboardAlert[];
  updates: {
    companies: UpdateItem[];
    clients: UpdateItem[];
    payments: UpdateItem[];
    projects: UpdateItem[];
  };
  upcoming: UpcomingItem[];
  team: TeamRow[];
  metricDetails: Record<MetricId, DetailRow[]>;
  stageDetails: Record<string, DetailRow[]>;
}

function parseStamp(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T12:00:00`);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function inRange(value: string, start: Date, end: Date) {
  const date = parseStamp(value);
  return isWithinInterval(date, { start, end });
}

function paidInRange(data: CrmData, start: Date, end: Date) {
  return paidAmount(
    data.payments.filter(
      (payment) => payment.status === "Paid" && inRange(payment.date, start, end)
    )
  );
}

export function trendFrom(current: number, previous: number, suffix = "vs last period"): MetricTrend {
  if (previous === 0 && current === 0) {
    return { direction: "flat", percent: 0, label: "No change" };
  }
  if (previous === 0) {
    return { direction: "up", percent: null, label: "New this period" };
  }
  const percent = ((current - previous) / Math.abs(previous)) * 100;
  if (Math.abs(percent) < 0.35) {
    return { direction: "flat", percent, label: `Steady ${suffix}` };
  }
  const sign = percent > 0 ? "+" : "";
  return {
    direction: percent > 0 ? "up" : "down",
    percent,
    label: `${sign}${percent.toFixed(1)}% ${suffix}`,
  };
}

function series(
  data: CrmData,
  count: number,
  step: "week" | "month" | "year",
  now: Date
): ChartPoint[] {
  const points: ChartPoint[] = [];
  for (let index = count - 1; index >= 0; index -= 1) {
    let start: Date;
    let end: Date;
    let label: string;
    let key: string;
    if (step === "week") {
      const cursor = subWeeks(now, index);
      start = startOfWeek(cursor, { weekStartsOn: 1 });
      end = endOfWeek(cursor, { weekStartsOn: 1 });
      label = format(start, "MMM d");
      key = format(start, "yyyy-MM-dd");
    } else if (step === "month") {
      const cursor = subMonths(now, index);
      start = startOfMonth(cursor);
      end = endOfMonth(cursor);
      label = format(start, "MMM");
      key = format(start, "yyyy-MM");
    } else {
      const cursor = subYears(now, index);
      start = startOfYear(cursor);
      end = endOfYear(cursor);
      label = format(start, "yyyy");
      key = label;
    }
    points.push({ key, label, amount: paidInRange(data, start, end) });
  }
  return points;
}

function conversionRate(data: CrmData) {
  const paid = data.clients.filter((client) => isPaidClient(client, data.stages)).length;
  const denied = data.clients.filter((client) => {
    const stage = data.stages.find((item) => item.id === client.stageId);
    return client.status === "Denied" || stage?.kind === "denied";
  }).length;
  const closed = paid + denied;
  if (closed === 0) return paid > 0 ? 100 : 0;
  return (paid / closed) * 100;
}

function periodConversion(data: CrmData, start: Date, end: Date) {
  const paidStage = data.stages.find((stage) => stage.kind === "paid");
  const won = data.activities.filter((activity) => {
    if (!inRange(activity.createdAt, start, end)) return false;
    if (activity.type === "payment_received") return false;
    return (
      activity.type === "stage_move" &&
      (activity.toStage === paidStage?.name || activity.toStage === paidStage?.id)
    );
  }).length;
  const lost = data.activities.filter(
    (activity) => activity.type === "denied" && inRange(activity.createdAt, start, end)
  ).length;
  const closed = won + lost;
  if (closed === 0) return 0;
  return (won / closed) * 100;
}

export function searchCrm(data: CrmData, query: string): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const hits: SearchHit[] = [];

  for (const client of data.clients) {
    const haystack =
      `${client.company} ${client.name} ${client.email} ${client.phone} ${client.clientNumber}`.toLowerCase();
    if (haystack.includes(q)) {
      hits.push({
        id: client.id,
        title: client.company,
        hint: `${client.clientNumber} · ${client.name}`,
        target: { type: "dialog", kind: "clientDetail", id: client.id },
      });
    }
  }
  for (const project of data.projects) {
    if (project.name.toLowerCase().includes(q)) {
      const client = data.clients.find((item) => item.id === project.clientId);
      hits.push({
        id: project.id,
        title: project.name,
        hint: client?.company ?? "Project",
        target: { type: "dialog", kind: "projectDetail", id: project.id },
      });
    }
  }
  for (const payment of data.payments) {
    const haystack = `${payment.invoiceNumber} ${payment.notes}`.toLowerCase();
    if (haystack.includes(q)) {
      const client = data.clients.find((item) => item.id === payment.clientId);
      hits.push({
        id: payment.id,
        title: payment.invoiceNumber,
        hint: client?.company ?? "Invoice",
        target: { type: "dialog", kind: "paymentDetail", id: payment.id },
      });
    }
  }
  for (const member of data.team) {
    const haystack = `${member.name} ${member.email} ${member.role}`.toLowerCase();
    if (haystack.includes(q)) {
      hits.push({
        id: member.id,
        title: member.name,
        hint: `${member.role} · ${member.email}`,
        target: { type: "route", href: "/team" },
      });
    }
  }
  return hits.slice(0, 12);
}

export function buildDashboardModel(
  data: CrmData,
  options: {
    now?: Date;
    tasks: DashboardTask[];
    audit: StudioAuditEntry[];
    completedDerived: string[];
    showFinance: boolean;
    showPayments: boolean;
    showTeam: boolean;
  }
): DashboardModel {
  const now = options.now ?? new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const thisYearStart = startOfYear(now);
  const lastYearStart = startOfYear(subYears(now, 1));
  const lastYearEnd = endOfYear(subYears(now, 1));

  const paidClients = data.clients.filter((client) => isPaidClient(client, data.stages));
  const inProgress = data.clients.filter((client) => {
    const stage = data.stages.find((item) => item.id === client.stageId);
    return stage?.kind !== "paid" && stage?.kind !== "denied" && client.status !== "Denied";
  });
  const pipelineValue = inProgress.reduce((sum, client) => sum + client.potentialValue, 0);
  const lastMonthPipeline = data.clients
    .filter((client) => inRange(client.createdAt, lastMonthStart, lastMonthEnd))
    .reduce((sum, client) => sum + client.potentialValue, 0);
  const thisMonthPipeline = data.clients
    .filter((client) => inRange(client.createdAt, thisMonthStart, thisMonthEnd))
    .reduce((sum, client) => sum + client.potentialValue, 0);

  const outstandingPayments = data.payments.filter(
    (payment) => payment.status === "Pending" || payment.status === "Overdue"
  );
  const lastMonthOutstanding = data.payments.filter(
    (payment) =>
      (payment.status === "Pending" || payment.status === "Overdue") &&
      inRange(payment.date, lastMonthStart, lastMonthEnd)
  );
  const thisMonthOutstanding = data.payments.filter(
    (payment) =>
      (payment.status === "Pending" || payment.status === "Overdue") &&
      inRange(payment.date, thisMonthStart, thisMonthEnd)
  );

  const totalRevenue = paidAmount(data.payments);
  const revenueThroughLastMonth = paidAmount(
    data.payments.filter(
      (payment) => payment.status === "Paid" && parseStamp(payment.date) < thisMonthStart
    )
  );
  const monthRevenue = paidInRange(data, thisMonthStart, thisMonthEnd);
  const lastMonthRevenue = paidInRange(data, lastMonthStart, lastMonthEnd);
  const weekRevenue = paidInRange(data, thisWeekStart, thisWeekEnd);
  const prevWeekRevenue = paidInRange(data, lastWeekStart, lastWeekEnd);
  const yearRevenue = paidInRange(data, thisYearStart, now);
  const lastYearRevenue = paidInRange(data, lastYearStart, lastYearEnd);

  const activeNow = paidClients.length;
  const activeLastMonth = paidClients.filter(
    (client) => parseStamp(client.createdAt) < thisMonthStart
  ).length;

  const dealsNow = inProgress.length;
  const dealsLastMonth = data.clients.filter((client) => {
    const stage = data.stages.find((item) => item.id === client.stageId);
    return (
      parseStamp(client.createdAt) < thisMonthStart &&
      stage?.kind !== "paid" &&
      stage?.kind !== "denied"
    );
  }).length;

  const teamById = new Map(data.team.map((member) => [member.id, member]));
  const stageById = new Map(data.stages.map((stage) => [stage.id, stage]));
  const clientById = new Map(data.clients.map((client) => [client.id, client]));

  const customUpcoming: UpcomingItem[] = options.tasks.map((task) => ({
    id: task.id,
    title: task.title,
    dueLabel: format(parseStamp(task.dueAt), "EEE, MMM d"),
    dueAt: task.dueAt,
    kind: "task",
    relatedLabel: task.relatedLabel || "Studio task",
    target: task.relatedId
      ? {
          type: "dialog",
          kind:
            task.relatedKind === "project"
              ? "projectDetail"
              : task.relatedKind === "payment"
                ? "paymentDetail"
                : "clientDetail",
          id: task.relatedId,
        }
      : null,
    source: "custom",
    done: task.done,
  }));

  const derivedUpcoming: UpcomingItem[] = [];
  for (const event of data.events) {
    if (!inRange(event.date, thisWeekStart, addDays(thisWeekEnd, 1))) continue;
    const client = event.clientId ? clientById.get(event.clientId) : undefined;
    const project = data.projects.find((item) => item.id === event.projectId);
    const isDemo = event.title.toLowerCase().includes("demo") || event.type === "meeting";
    derivedUpcoming.push({
      id: `event:${event.id}`,
      title: event.title,
      dueLabel: format(parseStamp(event.date), "EEE"),
      dueAt: event.date,
      kind: isDemo ? "demo" : event.type === "meeting" ? "meeting" : "followup",
      relatedLabel: client?.company ?? project?.name ?? "Calendar",
      target: client
        ? { type: "dialog", kind: "clientDetail", id: client.id }
        : project
          ? { type: "dialog", kind: "projectDetail", id: project.id }
          : { type: "route", href: "/calendar" },
      source: "derived",
      done: options.completedDerived.includes(`event:${event.id}`),
    });
  }
  for (const project of data.projects) {
    if (project.status === "Delivered") continue;
    if (!inRange(project.deadline, thisWeekStart, thisWeekEnd)) continue;
    const client = clientById.get(project.clientId);
    derivedUpcoming.push({
      id: `deadline:${project.id}`,
      title: `${project.name} deadline`,
      dueLabel: format(parseStamp(project.deadline), "EEE"),
      dueAt: project.deadline,
      kind: "deadline",
      relatedLabel: client?.company ?? "Project",
      target: { type: "dialog", kind: "projectDetail", id: project.id },
      source: "derived",
      done: options.completedDerived.includes(`deadline:${project.id}`),
    });
  }
  if (options.showPayments) {
    for (const payment of outstandingPayments) {
      const client = clientById.get(payment.clientId);
      derivedUpcoming.push({
        id: `invoice:${payment.id}`,
        title: `${payment.invoiceNumber} unpaid`,
        dueLabel: payment.status === "Overdue" ? "Overdue" : format(parseStamp(payment.date), "EEE"),
        dueAt: payment.date,
        kind: "invoice",
        relatedLabel: client?.company ?? "Invoice",
        target: { type: "dialog", kind: "paymentDetail", id: payment.id },
        source: "derived",
        done: options.completedDerived.includes(`invoice:${payment.id}`),
      });
    }
  }

  const upcoming = [...customUpcoming, ...derivedUpcoming].sort(
    (a, b) => parseStamp(a.dueAt).getTime() - parseStamp(b.dueAt).getTime()
  );
  const tasksThisWeek = upcoming.filter(
    (item) => !item.done && inRange(item.dueAt, thisWeekStart, addDays(thisWeekEnd, 1))
  ).length;
  const tasksLastWeek = options.tasks.filter((task) =>
    inRange(task.dueAt, lastWeekStart, lastWeekEnd)
  ).length;

  const metrics: MetricCardModel[] = [
    {
      id: "totalRevenue",
      label: "Total Revenue",
      value: totalRevenue,
      format: "currency",
      hint: "Paid invoices, all time",
      trend: trendFrom(totalRevenue, revenueThroughLastMonth, "vs prior months"),
      href: "/finance",
      visible: options.showFinance,
    },
    {
      id: "monthRevenue",
      label: "Revenue This Month",
      value: monthRevenue,
      format: "currency",
      hint: format(now, "MMMM yyyy"),
      trend: trendFrom(monthRevenue, lastMonthRevenue, "vs last month"),
      href: "/finance",
      visible: options.showFinance,
    },
    {
      id: "activeClients",
      label: "Active Clients",
      value: activeNow,
      format: "number",
      hint: `${data.clients.length} companies in pipeline`,
      trend: trendFrom(activeNow, activeLastMonth, "vs last month"),
      href: "/clients",
      visible: true,
    },
    {
      id: "pipelineValue",
      label: "Potential Pipeline Value",
      value: pipelineValue,
      format: "currency",
      hint: "Open deals, excluding paid and denied",
      trend: trendFrom(thisMonthPipeline, lastMonthPipeline, "new value vs last month"),
      href: "/pipeline",
      visible: true,
    },
    {
      id: "dealsInProgress",
      label: "Deals in Progress",
      value: dealsNow,
      format: "number",
      hint: "Not yet paid or denied",
      trend: trendFrom(dealsNow, dealsLastMonth, "vs last month"),
      href: "/pipeline",
      visible: true,
    },
    {
      id: "outstanding",
      label: "Outstanding Payments",
      value: outstandingPayments.reduce((sum, payment) => sum + payment.amount, 0),
      format: "currency",
      hint: `${outstandingPayments.length} pending or overdue`,
      trend: trendFrom(
        thisMonthOutstanding.reduce((sum, payment) => sum + payment.amount, 0),
        lastMonthOutstanding.reduce((sum, payment) => sum + payment.amount, 0),
        "vs last month"
      ),
      href: "/finance",
      visible: options.showFinance,
    },
    {
      id: "conversion",
      label: "Conversion Rate",
      value: conversionRate(data),
      format: "percent",
      hint: "Paid vs denied outcomes",
      trend: trendFrom(
        periodConversion(data, thisMonthStart, thisMonthEnd),
        periodConversion(data, lastMonthStart, lastMonthEnd),
        "closed this month vs last"
      ),
      href: "/pipeline",
      visible: true,
    },
    {
      id: "tasksDue",
      label: "Tasks Due This Week",
      value: tasksThisWeek,
      format: "number",
      hint: "Meetings, deadlines, invoices, follow-ups",
      trend: trendFrom(tasksThisWeek, tasksLastWeek, "vs last week"),
      href: "/calendar",
      visible: true,
    },
  ];

  const pipeline: PipelineBar[] = data.stages.map((stage) => {
    const companies = data.clients.filter((client) => client.stageId === stage.id);
    return {
      id: stage.id,
      name: stage.name,
      kind: stage.kind,
      color: stage.color,
      count: companies.length,
      value: companies.reduce((sum, client) => sum + client.potentialValue, 0),
    };
  });

  const activity: ActivityEntry[] = [];

  for (const activityRow of data.activities) {
    const client = clientById.get(activityRow.clientId);
    const actor = activityRow.userId ? teamById.get(activityRow.userId) : undefined;
    const typeMap: Record<string, ActivityEntry["type"]> = {
      created: "company_created",
      stage_move: "stage_move",
      denied: "denied",
      updated: "client_updated",
      payment_received: "payment_received",
      project_created: "project_created",
      project_completed: "project_completed",
      note: "note",
    };
    const type = typeMap[activityRow.type] ?? "client_updated";
    const action =
      type === "company_created"
        ? "created a company"
        : type === "stage_move"
          ? `moved ${client?.company ?? "a company"} to ${activityRow.toStage || "a new stage"}`
          : type === "denied"
            ? `logged a denial${activityRow.reason ? `: ${activityRow.reason}` : ""}`
            : type === "client_updated"
              ? "updated company details"
              : type === "payment_received"
                ? "recorded a payment"
                : type === "project_created"
                  ? "created a project"
                  : type === "project_completed"
                    ? "completed a project"
                    : "added a note";
    activity.push({
      id: activityRow.id,
      type,
      userId: activityRow.userId,
      userName: actor?.name ?? "Studio",
      action,
      entityLabel: client?.company ?? "Company",
      entityKind:
        type === "payment_received"
          ? "payment"
          : type === "project_created" || type === "project_completed"
            ? "project"
            : "company",
      target: client
        ? { type: "dialog", kind: "clientDetail", id: client.id }
        : null,
      timestamp: activityRow.createdAt,
      tone:
        type === "denied"
          ? "danger"
          : type === "payment_received" || type === "project_completed"
            ? "success"
            : type === "stage_move"
              ? "gold"
              : "sand",
    });
  }

  for (const member of data.team) {
    activity.push({
      id: `team:${member.id}`,
      type: "team_added",
      userId: member.id,
      userName: "Studio",
      action: "added a team member",
      entityLabel: member.name,
      entityKind: "team",
      target: options.showTeam ? { type: "route", href: "/team" } : null,
      timestamp: member.createdAt,
      tone: "muted",
    });
  }

  for (const entry of options.audit) {
    activity.push({
      id: entry.id,
      type: entry.type,
      userId: entry.actorId,
      userName: entry.actorName,
      action:
        entry.type === "team_added" ? "added a team member" : "changed permissions",
      entityLabel: entry.userName,
      entityKind: "team",
      target: options.showTeam ? { type: "route", href: "/team" } : null,
      timestamp: entry.timestamp,
      tone: "gold",
    });
  }

  activity.sort((a, b) => parseStamp(b.timestamp).getTime() - parseStamp(a.timestamp).getTime());
  const uniqueActivity: ActivityEntry[] = [];
  const seen = new Set<string>();
  for (const entry of activity) {
    const key =
      entry.type === "team_added"
        ? `team_added:${entry.entityLabel}`
        : entry.id;
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueActivity.push(entry);
  }

  const alerts: DashboardAlert[] = [];
  for (const payment of data.payments.filter((item) => item.status === "Overdue")) {
    const client = clientById.get(payment.clientId);
    alerts.push({
      id: `overdue:${payment.id}`,
      title: "Payment overdue",
      body: `${payment.invoiceNumber} for ${client?.company ?? "a client"} is overdue.`,
      priority: "urgent",
      timestamp: payment.date,
      target: { type: "dialog", kind: "paymentDetail", id: payment.id },
    });
  }
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  for (const event of data.events.filter((item) => inRange(item.date, todayStart, todayEnd))) {
    const client = event.clientId ? clientById.get(event.clientId) : undefined;
    const isDemo = event.title.toLowerCase().includes("demo") || event.type === "meeting";
    alerts.push({
      id: `today:${event.id}`,
      title: isDemo ? "Demo scheduled today" : "On the calendar today",
      body: `${event.title}${client ? ` · ${client.company}` : ""}`,
      priority: "important",
      timestamp: event.date,
      target: client
        ? { type: "dialog", kind: "clientDetail", id: client.id }
        : { type: "route", href: "/calendar" },
    });
  }
  for (const client of data.clients) {
    const stage = stageById.get(client.stageId);
    if (isPaidStage(stage) || stage?.kind === "denied") continue;
    const days = Math.floor(
      (now.getTime() - parseStamp(client.lastActivity).getTime()) / 86_400_000
    );
    if (days >= 14) {
      alerts.push({
        id: `stale:${client.id}`,
        title: "Not contacted recently",
        body: `${client.company} has had no activity for ${days} days.`,
        priority: "important",
        timestamp: client.lastActivity,
        target: { type: "dialog", kind: "clientDetail", id: client.id },
      });
    }
  }
  for (const activityRow of data.activities.filter((item) => item.type === "denied")) {
    const client = clientById.get(activityRow.clientId);
    alerts.push({
      id: `denied:${activityRow.id}`,
      title: "Denied deal reason logged",
      body: `${client?.company ?? "A company"}: ${activityRow.reason || activityRow.body}`,
      priority: "important",
      timestamp: activityRow.createdAt,
      target: client
        ? { type: "dialog", kind: "clientDetail", id: client.id }
        : { type: "route", href: "/pipeline" },
    });
  }
  if (options.showTeam) {
    for (const member of data.team.filter(
      (item) => now.getTime() - parseStamp(item.createdAt).getTime() < 7 * 86_400_000
    )) {
      alerts.push({
        id: `member:${member.id}`,
        title: "New team member",
        body: `${member.name} joined as ${member.role}.`,
        priority: "normal",
        timestamp: member.createdAt,
        target: { type: "route", href: "/team" },
      });
    }
  }
  alerts.sort((a, b) => {
    const rank = { urgent: 0, important: 1, normal: 2 };
    const byPriority = rank[a.priority] - rank[b.priority];
    if (byPriority !== 0) return byPriority;
    return parseStamp(b.timestamp).getTime() - parseStamp(a.timestamp).getTime();
  });

  const assignedCounts = new Map<string, number>();
  for (const client of data.clients) {
    if (!client.assignedUserId) continue;
    assignedCounts.set(
      client.assignedUserId,
      (assignedCounts.get(client.assignedUserId) ?? 0) + 1
    );
  }
  const maxAssigned = Math.max(1, ...assignedCounts.values(), 1);
  const team: TeamRow[] = data.team
    .filter((member) => member.active)
    .map((member) => {
      const assigned = assignedCounts.get(member.id) ?? 0;
      return {
        id: member.id,
        name: member.name,
        role: member.role,
        assigned,
        workload: Math.round((assigned / maxAssigned) * 100),
      };
    });

  const metricDetails: Record<MetricId, DetailRow[]> = {
    totalRevenue: data.payments
      .filter((payment) => payment.status === "Paid")
      .map((payment) => ({
        id: payment.id,
        title: payment.invoiceNumber,
        hint: `${clientById.get(payment.clientId)?.company ?? "Client"} · ${payment.date}`,
        target: { type: "dialog", kind: "paymentDetail", id: payment.id },
      })),
    monthRevenue: data.payments
      .filter(
        (payment) => payment.status === "Paid" && inRange(payment.date, thisMonthStart, thisMonthEnd)
      )
      .map((payment) => ({
        id: payment.id,
        title: payment.invoiceNumber,
        hint: clientById.get(payment.clientId)?.company ?? "Client",
        target: { type: "dialog", kind: "paymentDetail", id: payment.id },
      })),
    activeClients: paidClients.map((client) => ({
      id: client.id,
      title: client.company,
      hint: client.clientNumber,
      target: { type: "dialog", kind: "clientDetail", id: client.id },
    })),
    pipelineValue: inProgress.map((client) => ({
      id: client.id,
      title: client.company,
      hint: stageById.get(client.stageId)?.name ?? "Pipeline",
      target: { type: "dialog", kind: "clientDetail", id: client.id },
    })),
    dealsInProgress: inProgress.map((client) => ({
      id: client.id,
      title: client.company,
      hint: stageById.get(client.stageId)?.name ?? "Open",
      target: { type: "dialog", kind: "clientDetail", id: client.id },
    })),
    outstanding: outstandingPayments.map((payment) => ({
      id: payment.id,
      title: payment.invoiceNumber,
      hint: `${payment.status} · ${clientById.get(payment.clientId)?.company ?? ""}`,
      target: { type: "dialog", kind: "paymentDetail", id: payment.id },
    })),
    conversion: [...paidClients, ...data.clients.filter((client) => client.status === "Denied")].map(
      (client) => ({
        id: client.id,
        title: client.company,
        hint: isPaidClient(client, data.stages) ? "Paid" : "Denied",
        target: { type: "dialog", kind: "clientDetail", id: client.id },
      })
    ),
    tasksDue: upcoming
      .filter((item) => !item.done)
      .map((item) => ({
        id: item.id,
        title: item.title,
        hint: item.relatedLabel,
        target: item.target ?? { type: "route", href: "/calendar" },
      })),
  };

  const stageDetails: Record<string, DetailRow[]> = {};
  for (const stage of data.stages) {
    stageDetails[stage.id] = data.clients
      .filter((client) => client.stageId === stage.id)
      .map((client) => ({
        id: client.id,
        title: client.company,
        hint: client.name,
        target: { type: "dialog", kind: "clientDetail", id: client.id },
      }));
  }

  return {
    metrics,
    revenue: {
      weekly: series(data, 12, "week", now),
      monthly: series(data, 12, "month", now),
      yearly: series(data, 6, "year", now),
      weekChange: trendFrom(weekRevenue, prevWeekRevenue, "vs last week"),
      monthChange: trendFrom(monthRevenue, lastMonthRevenue, "vs last month"),
      yearChange: trendFrom(yearRevenue, lastYearRevenue, "vs last year"),
    },
    pipeline,
    activity: uniqueActivity,
    alerts: options.showPayments
      ? alerts
      : alerts.filter((alert) => !alert.id.startsWith("overdue:")),
    updates: {
      companies: [...data.clients]
        .sort((a, b) => parseStamp(b.createdAt).getTime() - parseStamp(a.createdAt).getTime())
        .slice(0, 5)
        .map((client) => ({
          id: client.id,
          title: client.company,
          hint: client.clientNumber,
          timestamp: client.createdAt,
          target: { type: "dialog", kind: "clientDetail", id: client.id },
        })),
      clients: paidClients
        .sort((a, b) => parseStamp(b.lastActivity).getTime() - parseStamp(a.lastActivity).getTime())
        .slice(0, 5)
        .map((client) => ({
          id: client.id,
          title: client.company,
          hint: "Signed client",
          timestamp: client.lastActivity,
          target: { type: "dialog", kind: "clientDetail", id: client.id },
        })),
      payments: options.showPayments
        ? [...data.payments]
            .sort((a, b) => parseStamp(b.date).getTime() - parseStamp(a.date).getTime())
            .slice(0, 5)
            .map((payment) => ({
              id: payment.id,
              title: payment.invoiceNumber,
              hint: clientById.get(payment.clientId)?.company ?? "Payment",
              timestamp: payment.date,
              target: { type: "dialog", kind: "paymentDetail", id: payment.id },
            }))
        : [],
      projects: [...data.projects]
        .sort((a, b) => parseStamp(b.updatedAt).getTime() - parseStamp(a.updatedAt).getTime())
        .slice(0, 5)
        .map((project) => ({
          id: project.id,
          title: project.name,
          hint: clientById.get(project.clientId)?.company ?? project.status,
          timestamp: project.updatedAt,
          target: { type: "dialog", kind: "projectDetail", id: project.id },
        })),
    },
    upcoming,
    team,
    metricDetails,
    stageDetails,
  };
}
