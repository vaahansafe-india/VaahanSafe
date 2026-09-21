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
          title="Mobile SMS OTP"
          description={`Registered number: ${data.identities.mobile.maskedPhone}`}
          status={
            <SettingStatus
              status={data.identities.mobile.verified ? "VERIFIED" : "REQUIRED"}
            />
          }
        >
          <span className="font-mono text-xs text-muted-foreground">
            MSG91 Transactional OTP
          </span>
        </SettingRow>

        {/* Google OAuth */}
        <SettingRow
          title="Google Account"
          description={
            data.identities.google.connected
              ? `Connected: ${data.identities.google.email || data.user.email}`
              : "Not linked"
          }
          status={
            <SettingStatus
              status={data.identities.google.connected ? "CONNECTED" : "DISABLED"}
            />
          }
        >
          <span className="font-mono text-xs text-muted-foreground">
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
              className="text-xs h-7 text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              Sign Out Other Devices ({otherSessions.length})
            </Button>
          ) : undefined
        }
      >
        {/* Current Session */}
        <div
          onClick={() => handleSessionRowClick(data.sessions.current)}
          className="group cursor-pointer rounded-lg p-3 -mx-3 hover:bg-muted/30 transition-colors"
        >
          <SettingRow
            title={`${data.sessions.current.browser} · ${data.sessions.current.os}`}
            description="RFC 6265 HttpOnly Secure Session &bull; Active on this device now"
            status={<SettingStatus status="CURRENT" />}
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs h-7 text-muted-foreground group-hover:text-foreground"
            >
              Details &rarr;
            </Button>
          </SettingRow>
        </div>

        {/* Other Sessions */}
        {otherSessions.map((session) => (
          <div
            key={session.id}
            onClick={() => handleSessionRowClick(session)}
            className="group cursor-pointer rounded-lg p-3 -mx-3 hover:bg-muted/30 transition-colors"
          >
            <SettingRow
              title={`${session.browser} · ${session.os}`}
              description={`Network route: ${session.ipAddressMasked}`}
              status={<SettingStatus status="ACTIVE" />}
            >
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRevokeClick(session);
                  }}
                  className="text-xs h-7 text-destructive hover:bg-destructive/10 border-border"
                >
                  Sign Out
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 text-muted-foreground group-hover:text-foreground"
                >
                  Details &rarr;
                </Button>
              </div>
            </SettingRow>
          </div>
        ))}

        {otherSessions.length === 0 && (
          <p className="py-2 text-xs text-muted-foreground italic">
            No other active browser sessions found. Your account is only signed in on this device.
          </p>
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
              title={act.title}
              description={act.description}
            >
              <span className="font-mono text-xs text-muted-foreground">
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
