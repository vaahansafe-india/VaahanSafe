import { AppShell } from "@vaahansafe/ui/patterns";
import { Button } from "@vaahansafe/ui/components";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@vaahansafe/ui/components";
import { Badge } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";

export default function QrHomePage() {
  return (
    <AppShell
      appName="Permanent QR Resolver (qr.vaahansafe.com)"
      appDescription="High-uptime permanent QR vehicle safety profile resolver"
    >
      <div className="max-w-xl mx-auto space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="space-y-1">
              <span className="font-bold text-lg">apps/qr</span>
              <p className="text-xs text-muted-foreground">
                Domain target: <span className="font-mono text-foreground font-semibold">qr.vaahansafe.com</span> &bull; Port 3003
              </p>
            </div>
            <Badge variant="success">Edge Runtime Ready</Badge>
          </div>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <VaahanIcon name="qr" size={18} className="text-emerald-600" />
                Permanent Public QR Resolver
              </CardTitle>
              <CardDescription className="text-xs">
                Permanent sticker endpoint: <code className="font-mono">qr.vaahansafe.com/[publicId]</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2 text-xs text-muted-foreground space-y-2">
              <p>
                Decoupled from marketing, blog, and admin to ensure 99.999% resolution uptime during road emergencies.
              </p>
              <div className="pt-2">
                <Button asChild size="sm" variant="outline" className="w-full">
                  <a href="/demo_sticker_001" className="inline-flex items-center justify-center gap-2">
                    <VaahanIcon name="qr-scan" size={16} />
                    Test Resolver Route (/[publicId])
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
