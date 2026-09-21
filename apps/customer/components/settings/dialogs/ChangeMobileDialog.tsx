"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
} from "@vaahansafe/ui";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  sendMobileChangeOtpAction,
  verifyMobileChangeOtpAction,
} from "@/lib/settings-actions";
import { toast } from "sonner";

interface ChangeMobileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPhone: string;
  onSuccess: (newPhone: string) => void;
  returnUrl?: string;
}

type Step = "ENTER_PHONE" | "VERIFY_OTP" | "SUCCESS";

export function ChangeMobileDialog({
  open,
  onOpenChange,
  currentPhone,
  onSuccess,
  returnUrl,
}: ChangeMobileDialogProps) {
  const [step, setStep] = React.useState<Step>("ENTER_PHONE");
  const [phone, setPhone] = React.useState("");
  const [maskedPhone, setMaskedPhone] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (open) {
      setStep("ENTER_PHONE");
      setPhone("");
      setOtp("");
      setError(null);
    }
  }, [open]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const clean = phone.replace(/\D/g, "");
    if (clean.length !== 10) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    startTransition(async () => {
      const res = await sendMobileChangeOtpAction(clean);
      if (res.success) {
        if (res.data) {
          setMaskedPhone(res.data.maskedPhone);
        }
        setStep("VERIFY_OTP");
        toast.info("Verification code sent via SMS.");
      } else {
        setError(res.error || "Failed to dispatch verification code.");
      }
    });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    startTransition(async () => {
      const cleanPhone = phone.replace(/\D/g, "");
      const res = await verifyMobileChangeOtpAction(cleanPhone, cleanOtp);
      if (res.success) {
        toast.success("Mobile number updated and verified.");
        onSuccess(`+91${cleanPhone}`);
        setStep("SUCCESS");
      } else {
        setError(res.error || "Verification failed. Check the code and try again.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#cc785c]/10 text-[#cc785c]">
              <VaahanIcon name="phone" size={16} />
            </div>
            <div>
              <DialogTitle className="font-serif text-lg font-medium text-foreground">
                {step === "ENTER_PHONE" &&
                  (currentPhone ? "Change Verified Mobile" : "Verify Mobile Number")}
                {step === "VERIFY_OTP" && "Enter Verification Code"}
                {step === "SUCCESS" &&
                  (currentPhone ? "Mobile Number Updated" : "Mobile Number Verified & Linked")}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            {step === "ENTER_PHONE" &&
              (currentPhone
                ? "Enter your new mobile number. We will send an official MSG91 SMS OTP to establish identity verification."
                : "Link and verify your mobile number. We will send an official MSG91 SMS OTP to establish your verified account identity.")}
            {step === "VERIFY_OTP" &&
              `Enter the 6-digit code sent to ${maskedPhone}. Real verification required.`}
            {step === "SUCCESS" &&
              (currentPhone
                ? "Your account mobile number has been cryptographically updated and verified across VaahanSafe."
                : "Your account mobile number has been cryptographically verified and securely linked to your VaahanSafe account.")}
          </DialogDescription>
        </DialogHeader>

        {step === "ENTER_PHONE" && (
          <form onSubmit={handleSendOtp} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="new-phone-input"
                className="text-xs font-mono uppercase tracking-wider text-muted-foreground"
              >
                {currentPhone ? "New Mobile Number" : "Mobile Number"}
              </Label>
              <div className="relative flex items-center">
                <span className="absolute left-3 font-mono text-xs text-muted-foreground">
                  +91
                </span>
                <Input
                  id="new-phone-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98765 43210"
                  disabled={isPending}
                  maxLength={14}
                  className="pl-12 h-9 text-sm font-mono"
                  autoFocus
                />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <div className="rounded-md border border-border/60 bg-muted/30 p-2.5 text-[11px] text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Identity Notice: </span>
              This number will become your primary sign-in identifier and the recipient of urgent vehicle scan alerts.
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending || !phone.trim()}
                className="bg-[#cc785c] hover:bg-[#b8674d] text-white"
              >
                {isPending ? "Sending OTP..." : "Send Verification Code"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === "VERIFY_OTP" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="otp-input"
                className="text-xs font-mono uppercase tracking-wider text-muted-foreground"
              >
                6-Digit Code
              </Label>
              <Input
                id="otp-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                disabled={isPending}
                className="h-10 text-center font-mono text-base tracking-[0.3em]"
                autoFocus
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Didn't receive code?</span>
              <button
                type="button"
                onClick={() => setStep("ENTER_PHONE")}
                className="font-medium text-[#cc785c] hover:underline"
                disabled={isPending}
              >
                Change Number
              </button>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep("ENTER_PHONE")}
                disabled={isPending}
              >
                Back
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending || otp.length !== 6}
                className="bg-[#cc785c] hover:bg-[#b8674d] text-white"
              >
                {isPending ? "Verifying..." : "Verify & Confirm"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === "SUCCESS" && (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <VaahanIcon name="check" size={24} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {currentPhone ? "Mobile Number Updated" : "Mobile Number Verified & Linked"}
              </p>
              <p className="text-xs text-muted-foreground">
                {currentPhone
                  ? "Your new number is now securely linked to your VaahanSafe account."
                  : "Your phone is now verified. Vehicle safety identities and emergency alerts are active."}
              </p>
            </div>
            <DialogFooter className="justify-center sm:justify-center pt-2">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  if (returnUrl) {
                    window.location.href = returnUrl;
                  }
                }}
                className="bg-[#cc785c] hover:bg-[#b8674d] text-white px-6"
              >
                {returnUrl ? "Done & Continue →" : "Done"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
