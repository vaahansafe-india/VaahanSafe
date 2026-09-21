import { AppShell } from "@vaahansafe/ui/patterns";
import { Button } from "@vaahansafe/ui/components";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@vaahansafe/ui/components";
import { Badge } from "@vaahansafe/ui/components";
import { Input } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";

interface ActivatePageProps {
  searchParams: Promise<{
    id?: string;
  }>;
}

export default async function ActivatePage({ searchParams }: ActivatePageProps) {
  const { id } = await searchParams;

  return (
    <AppShell
      appName="QR Activation (activate.vaahansafe.com)"
      appDescription="Retail sticker activation and vehicle pairing portal"
    >
      <div className="max-w-xl mx-auto space-y-8">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="space-y-1 text-center border-b pb-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mx-auto mb-2">
              <VaahanIcon name="qr-scan" size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Activate VaahanSafe Sticker</h1>
            <p className="text-xs text-muted-foreground">
              Enter the sticker public ID and scratch code printed on your retail card to bind it to your vehicle.
            </p>
          </div>

          {/* Workflow Steps Preview */}
          <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-medium text-muted-foreground pb-2">
            <div className="p-1 rounded bg-primary/10 text-primary font-semibold">1. Code</div>
            <div className="p-1 rounded bg-muted">2. Auth</div>
            <div className="p-1 rounded bg-muted">3. Vehicle</div>
            <div className="p-1 rounded bg-muted">4. Active</div>
          </div>

          <form
            action="/continue"
            method="GET"
            className="space-y-4"
          >
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold">Sticker Information</CardTitle>
                <CardDescription className="text-xs">
                  Physical packaging security credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Public QR Identifier</label>
                  <Input
                    name="id"
                    defaultValue={id || ""}
                    placeholder="e.g. vs_99a8b7c6d5e4"
                    required
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Scratch Verification Code</label>
                  <Input
                    name="code"
                    type="password"
                    placeholder="Silver scratch code on packaging"
                    required
                    className="font-mono text-xs tracking-widest uppercase"
                  />
                </div>
                <a
                  href={`http://localhost:3001/qr/activate${id ? `?id=${encodeURIComponent(id)}` : ""}`}
                  className="inline-flex items-center justify-center w-full h-10 px-4 mt-2 text-xs font-semibold uppercase tracking-wider text-white transition-colors rounded-lg bg-[#cc785c] hover:bg-[#b5654b]"
                >
                  Continue to Verified Activation
                </a>
              </CardContent>
            </Card>
          </form>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
            <Badge variant="outline">@vaahansafe/qr-core connected</Badge>
            <span className="font-mono text-[10px]">Authoritative D1 Identity</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
