import { AppShell } from "@vaahansafe/ui/patterns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@vaahansafe/ui/components";
import { Badge } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";

const ADMIN_NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: "dashboard" as const, active: true },
  { label: "QR Inventory", href: "/inventory", icon: "qr" as const },
  { label: "Customers", href: "/customers", icon: "users" as const },
  { label: "Activations", href: "/activations", icon: "check" as const },
  { label: "Subscriptions", href: "/subscriptions", icon: "payment" as const },
  { label: "Analytics", href: "/analytics", icon: "chart" as const },
  { label: "Audit Logs", href: "/audit", icon: "activity" as const },
  { label: "Settings", href: "/settings", icon: "settings" as const },
];

export default function AdminDashboardPage() {
  return (
    <AppShell
      appName="Operations Console (admin.vaahansafe.com)"
      appDescription="Internal platform operations, QR batches, and safety fleet metrics"
      navItems={ADMIN_NAV_ITEMS}
      showSidebar={true}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Operations Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Fleet metrics and sticker inventory health
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Stage 01 Verified</Badge>
            <Badge variant="secondary">Port 3004</Badge>
          </div>
        </div>

        {/* Quick Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Stickers Printed</CardTitle>
              <VaahanIcon name="qr" size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">10,000</div>
              <p className="text-[10px] text-muted-foreground mt-1">Batch #VS-2026-01</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground">Active Subscriptions</CardTitle>
              <VaahanIcon name="payment" size={16} className="text-emerald-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">0</div>
              <p className="text-[10px] text-muted-foreground mt-1">Ready for Stage 02 migrations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground">Retail Activations</CardTitle>
              <VaahanIcon name="check" size={16} className="text-sky-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">0</div>
              <p className="text-[10px] text-muted-foreground mt-1">Retailer network online</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground">Emergency Alerts (24h)</CardTitle>
              <VaahanIcon name="alert" size={16} className="text-amber-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">0</div>
              <p className="text-[10px] text-muted-foreground mt-1">MSG91 channel connected</p>
            </CardContent>
          </Card>
        </div>

        {/* Modules Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Operations Infrastructure Readiness</CardTitle>
            <CardDescription>
              Internal operations shell with responsive sidebar architecture, role-based controls, and clean workspace separation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <p>
              &bull; Strict noindex/robots policies prevent administrative routes from leaking to public search engines.
            </p>
            <p>
              &bull; Modular sidebar adapts cleanly to mobile viewports via the shared Sheet drawer component.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
