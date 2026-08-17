"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { PageTransition } from "@/components/page-chrome";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { MetricCards } from "@/components/dashboard/metric-cards";
import { RevenuePipelineCharts } from "@/components/dashboard/charts";
import { ActivityFeed, ActivityLogSheet } from "@/components/dashboard/activity-feed";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { RecentUpdates } from "@/components/dashboard/recent-updates";
import { TasksPanel } from "@/components/dashboard/tasks-panel";
import { TeamOverview } from "@/components/dashboard/team-overview";
import { DashboardDetailSheet } from "@/components/dashboard/detail-sheet";
import { DashboardSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useCrm } from "@/context/crm-context";
import {
  buildDashboardModel,
  searchCrm,
  type DashboardTarget,
  type DetailRow,
  type MetricId,
} from "@/lib/dashboard";
import { useDashboardLocal } from "@/lib/dashboard-storage";
import { isPaidStage } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const { user, allow, logout } = useAuth();
  const { data, openDialog, refresh, dialog } = useCrm();
  const local = useDashboardLocal();
  const { reloadAudit, markRead, markAllRead, addTask, toggleTask, toggleDerived } = local;
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [detail, setDetail] = useState<{
    title: string;
    description?: string;
    rows: DetailRow[];
  } | null>(null);

  const showFinance = allow("viewFinanceAnalytics");
  const showPayments = allow("viewFinance");
  const showTeam = user?.role === "Admin" || user?.role === "Manager";

  useEffect(() => {
    if (dialog.kind === null) reloadAudit();
  }, [dialog.kind, reloadAudit]);

  const model = useMemo(
    () =>
      buildDashboardModel(data, {
        tasks: local.tasks,
        audit: local.audit,
        completedDerived: local.completedDerived,
        showFinance,
        showPayments,
        showTeam,
      }),
    [data, local.audit, local.completedDerived, local.tasks, showFinance, showPayments, showTeam]
  );

  const activity = useMemo(() => {
    return model.activity.filter((entry) => {
      if (!showPayments && entry.type === "payment_received") return false;
      if (!showTeam && (entry.type === "team_added" || entry.type === "permission_changed")) {
        return false;
      }
      return true;
    });
  }, [model.activity, showPayments, showTeam]);

  const searchHits = useMemo(() => searchCrm(data, query), [data, query]);
  const unreadCount = model.alerts.filter((alert) => !local.readIds.includes(alert.id)).length;

  function openTarget(target: DashboardTarget) {
    if (target.type === "route") {
      router.push(target.href);
      return;
    }
    openDialog(target.kind, target.id ?? null, target.preset);
  }

  async function handleRefresh() {
    setRefreshing(true);
    setError(null);
    try {
      await refresh();
      reloadAudit();
      toast.success("Dashboard updated");
    } catch {
      setError("Could not refresh studio data.");
      toast.error("Could not refresh the dashboard.");
    } finally {
      setRefreshing(false);
    }
  }

  function openMetric(id: MetricId) {
    const metric = model.metrics.find((item) => item.id === id);
    setDetail({
      title: metric?.label ?? "Detail",
      description: metric?.hint,
      rows: model.metricDetails[id] ?? [],
    });
  }

  if (!local.hydrated) {
    return (
      <PageTransition>
        <DashboardSkeleton />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <DashboardHeader
        name={user?.name ?? "Duneworks"}
        role={user?.role ?? "Viewer"}
        refreshing={refreshing}
        unreadCount={unreadCount}
        alerts={model.alerts}
        readIds={local.readIds}
        searchHits={searchHits}
        canCreate={allow("createRecords")}
        canPay={allow("managePayments")}
        canManageUsers={allow("manageUsers")}
        canManageSettings={allow("manageSettings")}
        onRefresh={handleRefresh}
        onSearch={setQuery}
        onQuickAdd={(kind) => {
          if (kind === "company") {
            const first = data.stages.find((stage) => stage.kind === "possible") ?? data.stages[0];
            openDialog("client", null, { stageId: first?.id ?? "" });
            return;
          }
          if (kind === "client") {
            const paid = data.stages.find((stage) => isPaidStage(stage));
            openDialog("client", null, { stageId: paid?.id ?? "", intent: "client" });
            return;
          }
          if (kind === "project") openDialog("project");
          if (kind === "payment") openDialog("payment");
          if (kind === "user") openDialog("user");
        }}
        onOpenTarget={openTarget}
        onMarkRead={markRead}
        onMarkAllRead={() => markAllRead(model.alerts.map((alert) => alert.id))}
        onLogout={() => void logout()}
      />

      {error ? (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
          <span className="flex items-center gap-2">
            <AlertTriangle className="size-4" />
            {error}
          </span>
          <Button size="sm" variant="outline" onClick={handleRefresh}>
            <RefreshCw />
            Retry
          </Button>
        </div>
      ) : null}

      <MetricCards metrics={model.metrics} onOpen={openMetric} />

      <div className="mt-4">
        <RevenuePipelineCharts
          weekly={model.revenue.weekly}
          monthly={model.revenue.monthly}
          yearly={model.revenue.yearly}
          weekChange={model.revenue.weekChange}
          monthChange={model.revenue.monthChange}
          yearChange={model.revenue.yearChange}
          pipeline={model.pipeline}
          showFinance={showFinance}
          onOpenStage={(stageId) => {
            const stage = model.pipeline.find((item) => item.id === stageId);
            setDetail({
              title: stage?.name ?? "Stage",
              description: `${stage?.count ?? 0} companies · click to open a record`,
              rows: model.stageDetails[stageId] ?? [],
            });
          }}
          onOpenFinance={() => router.push("/finance")}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ActivityFeed
          entries={activity}
          onOpen={openTarget}
          onViewAll={() => setLogOpen(true)}
        />
        <AlertsPanel
          alerts={model.alerts}
          readIds={local.readIds}
          onOpen={openTarget}
          onMarkRead={markRead}
          onMarkAllRead={() => markAllRead(model.alerts.map((alert) => alert.id))}
        />
      </div>

      <div className="mt-4">
        <RecentUpdates
          companies={model.updates.companies}
          clients={model.updates.clients}
          payments={model.updates.payments}
          projects={model.updates.projects}
          showFinance={showPayments}
          onOpen={openTarget}
        />
      </div>

      <div className={showTeam ? "mt-4 grid gap-4 xl:grid-cols-2" : "mt-4"}>
        <TasksPanel
          items={model.upcoming}
          clients={data.clients}
          canCreate={allow("createRecords")}
          onOpen={openTarget}
          onToggle={(item, done) => {
            if (item.source === "custom") toggleTask(item.id, done);
            else toggleDerived(item.id, done);
          }}
          onAdd={addTask}
        />
        {showTeam ? (
          <TeamOverview rows={model.team} canManage={allow("manageUsers")} />
        ) : null}
      </div>

      <ActivityLogSheet
        open={logOpen}
        entries={activity}
        onClose={() => setLogOpen(false)}
        onOpen={(target) => {
          setLogOpen(false);
          openTarget(target);
        }}
      />
      <DashboardDetailSheet
        open={Boolean(detail)}
        title={detail?.title ?? ""}
        description={detail?.description}
        rows={detail?.rows ?? []}
        onClose={() => setDetail(null)}
        onOpen={openTarget}
      />
    </PageTransition>
  );
}
