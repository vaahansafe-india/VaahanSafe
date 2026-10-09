import { requireAdminPage } from "../lib/session";
import { canReadModule } from "../lib/modules";
import { getDashboardSummary } from "../features/dashboard/server/get-dashboard-summary";
import {
  DashboardCommandHeader,
  OperationsHealthStrip,
  MetricStrip,
  AttentionPanel,
  ActivityPulse,
  OperationalQueue,
  RecentAdminActivity,
  ServiceHealthCard,
  QuickAccess,
} from "../features/dashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const identity = await requireAdminPage("dashboard");
  const summary = await getDashboardSummary(identity);

  const canViewAudit = canReadModule(identity.role, "audit");

  return (
    <div className="operations-command-center">
      {/* 1. Command Header (~150-180px desktop, ~130-150px mobile) */}
      <DashboardCommandHeader
        greeting={summary.greeting}
        operatorFirstName={summary.operatorFirstName}
        formattedSyncTime={summary.formattedSyncTime}
        formattedSyncDate={summary.formattedSyncDate}
        systemStatus={summary.systemStatus}
        attentionCount={summary.attentionItems.length}
      />

      {/* 2. Compact Operational Health Strip */}
      <OperationsHealthStrip
        systemStatus={summary.systemStatus}
        services={summary.services}
        formattedSyncTime={summary.formattedSyncTime}
      />

      {/* 3. Dense 5-Metric Strip */}
      <MetricStrip metrics={summary.metrics} />

      {/* 4. Split Grid: Activity Pulse (8 cols) + Needs Attention (4 cols) */}
      <div className="command-grid-split">
        <div className="command-grid-primary">
          <ActivityPulse pulse={summary.pulse} />
        </div>
        <div className="command-grid-secondary">
          <AttentionPanel items={summary.attentionItems} />
        </div>
      </div>

      {/* 5. Operational Work Queue */}
      <OperationalQueue items={summary.queueItems} />

      {/* 6. Split Grid: Recent Admin Activity (7 cols) + Service Health (5 cols) */}
      <div className="command-grid-split lower-split">
        <div className="command-grid-left">
          <RecentAdminActivity
            activity={summary.recentAudit}
            canViewAudit={canViewAudit}
          />
        </div>
        <div className="command-grid-right">
          <ServiceHealthCard services={summary.services} />
        </div>
      </div>

      {/* 7. Quick Access Workspaces */}
      <QuickAccess role={identity.role} />
    </div>
  );
}
