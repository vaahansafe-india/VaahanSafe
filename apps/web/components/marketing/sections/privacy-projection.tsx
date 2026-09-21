import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui/components";

export function PrivacyProjection() {
  return (
    <section className="py-20 md:py-28 border-t border-border/40 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
          <Badge
            variant="outline"
            className="mb-4 text-xs font-mono tracking-wider uppercase border-primary/20 text-primary bg-primary/5"
          >
            Zero-Leakage Privacy Architecture
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Account Data ≠ Public Safety View
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Your VaahanSafe account contains private identity records. But when someone
            scans your QR, they only see a strictly controlled, owner-governed projection.
            Your physical home address, email, and personal phone number remain permanently concealed.
          </p>
        </div>

        {/* 3-Tier Visual Architecture Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch relative">
          {/* TIER 1: Private Account */}
          <div className="rounded-2xl border-2 border-border/70 bg-card p-6 sm:p-7 flex flex-col justify-between shadow-sm relative">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  01. Private Customer Account
                </span>
                <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-[10px] font-mono font-bold">
                  NEVER EXPOSED
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Stored in encrypted D1 regional storage. Accessible only by the authenticated owner.
              </p>

              <div className="space-y-2.5 pt-2">
                {[
                  { label: "Home / Shipping Address", status: "Never Public", icon: "home" },
                  { label: "Primary Account Email", status: "Never Public", icon: "email" },
                  { label: "Verified Mobile Number", status: "Protected in Vault", icon: "phone" },
                  { label: "Payment & Invoice History", status: "Encrypted", icon: "receipt" },
                  { label: "Government ID / RC Docs", status: "Owner Vault Only", icon: "document" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-muted/40 border border-border flex items-center justify-between text-xs"
                  >
                    <span className="flex items-center gap-2 font-medium text-foreground">
                      <VaahanIcon name={item.icon as any} size={14} className="text-muted-foreground" />
                      {item.label}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/80 text-[11px] text-muted-foreground flex items-center gap-1.5">
              <VaahanIcon name="lock" size={13} className="text-primary shrink-0" />
              <span>Strict isolation boundary enforced at edge API</span>
            </div>
          </div>

          {/* TIER 2: Owner Controls */}
          <div className="rounded-2xl border-2 border-primary/40 bg-card p-6 sm:p-7 flex flex-col justify-between shadow-md relative">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-primary/20">
                <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
                  02. Owner Governance Controls
                </span>
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 text-[10px] font-mono font-bold">
                  ACTIVE TOGGLES
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                You selectively decide which safety fields and emergency relays are projected to finders.
              </p>

              <div className="space-y-2.5 pt-2">
                {[
                  { label: "Emergency Contact 1 Relay", enabled: true, note: "Masked phone relay" },
                  { label: "Emergency Contact 2 Relay", enabled: true, note: "Secondary priority" },
                  { label: "Blood Group (Opt-in)", enabled: true, note: "Shared with triage" },
                  { label: "Medical Alert / Allergy Note", enabled: true, note: "Optional instructions" },
                  { label: "Parking Assistance Relay", enabled: false, note: "Owner opted out" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-background border border-border flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-medium text-foreground block">{item.label}</span>
                      <span className="text-[10px] text-muted-foreground">{item.note}</span>
                    </div>
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        item.enabled
                          ? "bg-[#22D3A7] text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.enabled ? "✓" : "–"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/80 text-[11px] text-primary flex items-center gap-1.5 font-medium">
              <VaahanIcon name="shield" size={13} className="shrink-0" />
              <span>Owner can update or revoke permissions anytime</span>
            </div>
          </div>

          {/* TIER 3: Public Safety View */}
          <div className="rounded-2xl border-2 border-[#22D3A7]/40 bg-card p-6 sm:p-7 flex flex-col justify-between shadow-sm relative">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#22D3A7]/20">
                <span className="text-xs font-mono uppercase tracking-wider text-[#16A36A] dark:text-[#22D3A7] font-semibold">
                  03. Approved Public Safety View
                </span>
                <span className="px-2 py-0.5 rounded bg-[#22D3A7]/15 text-[#16A36A] dark:text-[#22D3A7] border border-[#22D3A7]/40 text-[10px] font-mono font-bold">
                  WHAT FINDERS SEE
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                The sanitized, zero-auth profile served to emergency responders and bystanders.
              </p>

              <div className="space-y-2.5 pt-2">
                {[
                  { label: "Vehicle Model & Fuel Type", value: "Tata Safari (Diesel)" },
                  { label: "Registration Suffix", value: "DL 01 •••• 9021" },
                  { label: "Emergency Contact 1", value: "Spouse (Masked Call Button)" },
                  { label: "Emergency Contact 2", value: "Brother (Masked Call Button)" },
                  { label: "Medical Alert (if opted-in)", value: "Blood: O+, Penicillin Safe" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-muted/40 border border-border flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-foreground">{item.label}</span>
                    <span className="font-mono text-[11px] text-muted-foreground text-right">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/80 text-[11px] text-muted-foreground flex items-center gap-1.5">
              <VaahanIcon name="check" size={13} className="text-[#22D3A7] shrink-0" />
              <span>Zero credentials or session tokens exchanged</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
