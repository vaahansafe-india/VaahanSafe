"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { VaahanIcon } from "@vaahansafe/icons";
import { Button, Avatar, AvatarFallback, AvatarImage } from "@vaahansafe/ui";
import { SettingsSection } from "../primitives/SettingsSection";
import { SettingRow } from "../primitives/SettingRow";
import { SettingStatus } from "../primitives/SettingStatus";
import { EditNameDialog } from "../dialogs/EditNameDialog";
import { ChangeMobileDialog } from "../dialogs/ChangeMobileDialog";
import type { SettingsData } from "@/lib/settings-types";
import { toast } from "sonner";

interface ProfileSettingsProps {
  data: SettingsData;
}

export function ProfileSettings({ data }: ProfileSettingsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || undefined;

  const [userName, setUserName] = React.useState(data.user.name);
  const [userPhone, setUserPhone] = React.useState(data.identities.mobile.maskedPhone);
  const [rawPhone, setRawPhone] = React.useState(data.user.phone);
  const [isVerified, setIsVerified] = React.useState(
    Boolean(data.identities.mobile.verified && data.user.phone)
  );

  const [isNameDialogOpen, setIsNameDialogOpen] = React.useState(false);
  const [isMobileDialogOpen, setIsMobileDialogOpen] = React.useState(false);

  // Compute initials for avatar fallback
  const initials =
    userName
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "VS";

  const handleMobileVerificationSuccess = (newPhone: string) => {
    setRawPhone(newPhone);
    const digits = newPhone.replace(/\D/g, "");
    setUserPhone(`+91 ••••• ••${digits.slice(-3)}`);
    setIsVerified(true);
    router.refresh();

    if (returnUrl) {
      toast.success("Mobile verified. Redirecting to your requested page...");
      setTimeout(() => {
        window.location.href = returnUrl;
      }, 800);
    } else {
      toast.success("Mobile number verified and securely linked to your account.");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-medium tracking-tight text-foreground">
          Profile
        </h1>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          Manage your owner identity, verified mobile number, and connected credentials.
        </p>
      </div>

      {/* Mandatory Verification Alert Banner if Unverified */}
      {!isVerified && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 mt-0.5">
              <VaahanIcon name="alert" size={18} />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                Action Required: Mobile Number Verification
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed max-w-xl">
                Your Google account is connected, but a verified Indian mobile number is mandatory to anchor your vehicle safety identities, emergency contacts, and passerby VoIP relay.
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => setIsMobileDialogOpen(true)}
            className="bg-[#cc785c] hover:bg-[#b8674d] text-white text-xs h-8 px-4 shrink-0 self-start sm:self-center font-medium shadow-xs"
          >
            Verify Mobile &rarr;
          </Button>
        </div>
      )}

      <SettingsSection
        title="Personal Profile"
        description="Information associated with your VaahanSafe account and safety identity."
      >
        {/* Profile Photo */}
        <SettingRow
          title="Profile Photo"
          description="A clear representation helps first responders identify the vehicle owner."
        >
          <div className="flex items-center gap-2.5 justify-end">
            <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border border-border bg-[#cc785c]/10 text-[#cc785c] shrink-0 shadow-2xs">
              {data.user.avatarUrl && <AvatarImage src={data.user.avatarUrl} alt={userName} />}
              <AvatarFallback className="font-mono text-xs font-semibold text-[#cc785c]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="font-mono text-xs text-muted-foreground hidden sm:inline">
              {data.user.avatarUrl ? "Synced via Google" : "Default Avatar"}
            </span>
          </div>
        </SettingRow>

        {/* Full Name */}
        <SettingRow
          title="Full Name"
          description="Used across account management and optional public vehicle safety view."
        >
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap justify-end">
            <span className="text-sm font-medium text-foreground">{userName}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNameDialogOpen(true)}
              className="text-xs h-8 px-3 rounded-lg border-border hover:border-[#cc785c] text-foreground shrink-0 font-medium shadow-2xs"
            >
              Edit Name &rarr;
            </Button>
          </div>
        </SettingRow>

        {/* Mobile Number */}
        <SettingRow
          title="Mobile Number"
          description="Authoritative identity anchor for SMS OTP authentication and emergency scan alerts."
          status={<SettingStatus status={isVerified ? "VERIFIED" : "REQUIRED"} />}
        >
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap justify-end">
            {isVerified && userPhone ? (
              <>
                <span className="font-mono text-xs text-foreground tracking-wider font-medium">
                  {userPhone}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMobileDialogOpen(true)}
                  className="text-xs h-8 px-3 rounded-lg border-border hover:border-[#cc785c] shrink-0 font-medium shadow-2xs"
                >
                  Change &rarr;
                </Button>
              </>
            ) : (
              <>
                <span className="font-mono text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                  <VaahanIcon name="alert" size={13} />
                  Unverified
                </span>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsMobileDialogOpen(true)}
                  className="text-xs h-8 px-3.5 rounded-lg bg-[#cc785c] hover:bg-[#b8674d] text-white shadow-xs font-medium shrink-0"
                >
                  Verify Mobile &rarr;
                </Button>
              </>
            )}
          </div>
        </SettingRow>

        {/* Email / Google Account */}
        <SettingRow
          title="Email Address"
          description={
            data.identities.google.connected
              ? "Verified via official Google OAuth 2.0 OpenID Connect."
              : "Used for official order invoices and security notifications."
          }
          status={
            data.identities.google.connected ? (
              <SettingStatus status="CONNECTED" />
            ) : undefined
          }
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {data.user.email || "Not linked"}
            </span>
          </div>
        </SettingRow>
      </SettingsSection>

      {/* Dialogs */}
      <EditNameDialog
        open={isNameDialogOpen}
        onOpenChange={setIsNameDialogOpen}
        currentName={userName}
        onSuccess={(newName) => setUserName(newName)}
      />

      <ChangeMobileDialog
        open={isMobileDialogOpen}
        onOpenChange={setIsMobileDialogOpen}
        currentPhone={rawPhone}
        onSuccess={handleMobileVerificationSuccess}
        returnUrl={returnUrl}
      />
    </div>
  );
}
