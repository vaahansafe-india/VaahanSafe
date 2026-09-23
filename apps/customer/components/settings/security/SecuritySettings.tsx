"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { Button } from "@vaahansafe/ui";
import { SettingsSection } from "../primitives/SettingsSection";
import { SettingRow } from "../primitives/SettingRow";
import { SettingStatus } from "../primitives/SettingStatus";
import { SessionDetailsSheet } from "../sheets/SessionDetailsSheet";
import { RevokeSessionAlert } from "../alerts/RevokeSessionAlert";
import { RevokeOtherSessionsAlert } from "../alerts/RevokeOtherSessionsAlert";
import type { SettingsData, SessionItem } from "@/lib/settings-types";

interface SecuritySettingsProps {
  data: SettingsData;
}

function SessionAvatar({
  browser,
  os,
  deviceType,
  isCurrent = false,
}: {
  browser: string;
  os: string;
  deviceType?: string;
  isCurrent?: boolean;
}) {
  const browserLower = browser.toLowerCase();
  let browserIcon: "chrome" | "safari" | "browser" = "browser";
  let brandColor = "text-[#cc785c]";
  let brandBg = "bg-[#cc785c]/10 border-[#cc785c]/25";

  if (browserLower.includes("chrome") || browserLower.includes("crios")) {
    browserIcon = "chrome";
    brandColor = isCurrent ? "text-emerald-600 dark:text-emerald-400" : "text-sky-600 dark:text-sky-400";
    brandBg = isCurrent
      ? "bg-emerald-500/10 border-emerald-500/25"
      : "bg-sky-500/10 border-sky-500/25";
  } else if (browserLower.includes("safari")) {
    browserIcon = "safari";
    brandColor = "text-sky-600 dark:text-sky-400";
    brandBg = "bg-sky-500/10 border-sky-500/25";
  } else if (browserLower.includes("firefox")) {
    brandColor = "text-orange-600 dark:text-orange-400";
    brandBg = "bg-orange-500/10 border-orange-500/25";
  } else if (browserLower.includes("edge")) {
    brandColor = "text-teal-600 dark:text-teal-400";
    brandBg = "bg-teal-500/10 border-teal-500/25";
  }

  const osLower = os.toLowerCase();
  let osIcon: "windows" | "apple" | "android" | "laptop" | "mobile" = "laptop";
  if (osLower.includes("windows")) osIcon = "windows";
  else if (osLower.includes("mac") || osLower.includes("ios") || osLower.includes("ipad")) osIcon = "apple";
  else if (osLower.includes("android")) osIcon = "android";
  else if (deviceType === "mobile") osIcon = "mobile";

  return (
    <div className="relative shrink-0">
      <div
        className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border shadow-2xs transition-all ${brandBg} ${brandColor}`}
      >
        <VaahanIcon name={browserIcon} size={20} />
      </div>
      <div
        className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-card border border-border text-muted-foreground shadow-2xs"
        title={`OS: ${os}`}
      >
        <VaahanIcon name={osIcon} size={10} />
      </div>
    </div>
  );
}

export function SecuritySettings({ data }: SecuritySettingsProps) {
  const [selectedSession, setSelectedSession] = React.useState<SessionItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  const [sessionToRevoke, setSessionToRevoke] = React.useState<SessionItem | null>(null);
  const [isRevokeAlertOpen, setIsRevokeAlertOpen] = React.useState(false);

  const [isRevokeAllAlertOpen, setIsRevokeAllAlertOpen] = React.useState(false);
  const [otherSessions, setOtherSessions] = React.useState<SessionItem[]>(
    data.sessions.otherSessions
  );

  const handleSessionRowClick = (s: SessionItem) => {
    setSelectedSession(s);
    setIsSheetOpen(true);
  };

  const handleRevokeClick = (s: SessionItem) => {
    setSessionToRevoke(s);
    setIsRevokeAlertOpen(true);
  };

  const handleRevokeSuccess = (sessionId: string) => {
    setOtherSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (selectedSession?.id === sessionId) {
      setIsSheetOpen(false);
    }
  };

  const handleRevokeAllSuccess = () => {
    setOtherSessions([]);
    setIsSheetOpen(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-medium tracking-tight text-foreground">
          Security & Sessions
        </h1>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          Manage cryptographic sign-in methods, active device sessions, and account integrity.
        </p>
      </div>

      {/* 01. Factual Sign-in Methods */}
      <SettingsSection
        title="Sign-in Methods"
        description="Authenticators registered for your VaahanSafe identity. Passwords are never used."
      >
        {/* Mobile OTP */}
        <SettingRow
          icon={
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 shrink-0 shadow-2xs">
              <VaahanIcon name="sms" size={18} />
            </div>
          }
          title="Mobile SMS OTP"
          description={
            <span className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-muted-foreground">Registered number:</span>
              <span className="font-mono text-[11px] text-foreground font-semibold bg-muted/70 px-1.5 py-0.5 rounded border border-border/70">
                {data.identities.mobile.maskedPhone || data.user.phone || "Not configured"}
              </span>
            </span>
          }
          status={
            <SettingStatus
              status={data.identities.mobile.verified ? "VERIFIED" : "REQUIRED"}
            />
          }
        >
          <span className="font-mono text-xs text-muted-foreground bg-muted/40 px-2 py-1 rounded border border-border/60">
            MSG91 Transactional OTP
          </span>
        </SettingRow>

        {/* Google OAuth */}
        <SettingRow
          icon={
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-[#cc785c]/10 text-[#cc785c] border border-[#cc785c]/25 shrink-0 shadow-2xs">
              <VaahanIcon name="google" size={18} />
            </div>
          }
          title="Google Account"
          description={
            data.identities.google.connected ? (
              <span className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-muted-foreground">Connected:</span>
                <span className="font-mono text-[11px] text-foreground font-medium bg-muted/70 px-1.5 py-0.5 rounded border border-border/70">
                  {data.identities.google.email || data.user.email}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">Not linked to account</span>
            )
          }
          status={
            <SettingStatus
              status={data.identities.google.connected ? "CONNECTED" : "DISABLED"}
            />
          }
        >
          <span className="font-mono text-xs text-muted-foreground bg-muted/40 px-2 py-1 rounded border border-border/60">
            OAuth 2.0 OpenID
          </span>
        </SettingRow>
      </SettingsSection>

      {/* 02. Active Sessions */}
      <SettingsSection
        title="Active Device Sessions"
        description="Devices with valid RFC 6265 HttpOnly session cookies issued by Cloudflare D1."
        action={
          otherSessions.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRevokeAllAlertOpen(true)}
              className="h-9 px-3.5 text-xs text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5 shadow-2xs font-medium shrink-0 rounded-xl"
            >
              <VaahanIcon name="logout" size={12} />
              <span>Sign Out Other Devices ({otherSessions.length})</span>
            </Button>
          ) : undefined
        }
      >
        {/* Current Session */}
        <div
          onClick={() => handleSessionRowClick(data.sessions.current)}
          className="group cursor-pointer transition-colors"
        >
          <SettingRow
            icon={
              <SessionAvatar
                browser={data.sessions.current.browser}
                os={data.sessions.current.os}
                deviceType={data.sessions.current.deviceType}
                isCurrent
              />
            }
            title={`${data.sessions.current.browser} · ${data.sessions.current.os}`}
            description={
              <span className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  RFC 6265 HttpOnly Secure Session
                </span>
                <span className="text-muted-foreground">&bull; Active on this device now</span>
              </span>
            }
            status={<SettingStatus status="CURRENT" />}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-3 rounded-lg border-border hover:border-[#cc785c] hover:text-[#cc785c] gap-1.5 shrink-0 text-foreground shadow-2xs text-xs font-medium"
            >
              <span>Details</span>
              <VaahanIcon name="arrow-right" size={12} />
            </Button>
          </SettingRow>
        </div>

        {/* Other Sessions */}
        {otherSessions.map((session) => (
          <div
            key={session.id}
            onClick={() => handleSessionRowClick(session)}
            className="group cursor-pointer transition-colors"
          >
            <SettingRow
              icon={
                <SessionAvatar
                  browser={session.browser}
                  os={session.os}
                  deviceType={session.deviceType}
                  isCurrent={false}
                />
              }
              title={`${session.browser} · ${session.os}`}
              description={
                <span className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-muted-foreground">Network route:</span>
                  <span className="font-mono text-[11px] text-foreground font-semibold bg-muted/70 px-1.5 py-0.5 rounded border border-border/70">
                    {session.ipAddressMasked}
                  </span>
                </span>
              }
              status={<SettingStatus status="ACTIVE" />}
            >
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRevokeClick(session);
                  }}
                  className="h-8 px-2.5 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 border-destructive/30 hover:border-destructive shadow-2xs"
                >
                  Sign Out
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 sm:px-3 rounded-lg border-border hover:border-[#cc785c] hover:text-[#cc785c] gap-1.5 text-foreground shadow-2xs text-xs font-medium"
                >
                  <span className="hidden sm:inline">Details</span>
                  <VaahanIcon name="arrow-right" size={12} />
                </Button>
              </div>
            </SettingRow>
          </div>
        ))}

        {otherSessions.length === 0 && (
          <div className="p-4 sm:p-5 text-xs text-muted-foreground italic">
            No other active browser sessions found. Your account is only signed in on this device.
          </div>
        )}
      </SettingsSection>

      {/* 03. Recent Security Activity */}
      {data.recentActivity.length > 0 && (
        <SettingsSection
          title="Recent Security Activity"
          description="Authoritative audit events recorded during session and identity lifecycle."
        >
          {data.recentActivity.map((act) => (
            <SettingRow
              key={act.id}
              icon={
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/70 text-muted-foreground border border-border/70 shrink-0 shadow-2xs">
                  <VaahanIcon name="shield" size={15} />
                </div>
              }
              title={act.title}
              description={act.description}
            >
              <span className="font-mono text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/60 shrink-0">
                {new Intl.DateTimeFormat("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "numeric",
                }).format(new Date(act.timestamp))}
              </span>
            </SettingRow>
          ))}
        </SettingsSection>
      )}

      {/* Session Details Sheet */}
      <SessionDetailsSheet
        session={selectedSession}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onRevokeClick={(s) => {
          setIsSheetOpen(false);
          handleRevokeClick(s);
        }}
      />

      {/* Revoke Single Session Alert */}
      <RevokeSessionAlert
        session={sessionToRevoke}
        open={isRevokeAlertOpen}
        onOpenChange={setIsRevokeAlertOpen}
        onSuccess={handleRevokeSuccess}
      />

      {/* Revoke All Other Sessions Alert */}
      <RevokeOtherSessionsAlert
        open={isRevokeAllAlertOpen}
        onOpenChange={setIsRevokeAllAlertOpen}
        onSuccess={handleRevokeAllSuccess}
        otherCount={otherSessions.length}
      />
    </div>
  );
}
