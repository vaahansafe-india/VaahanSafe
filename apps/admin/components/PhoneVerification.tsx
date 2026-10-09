"use client";
import { useState } from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { useOtpAvailability } from "@vaahansafe/ui/lib/use-otp-availability";

function WhatsAppIcon({ size = 15, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
    </svg>
  );
}

export function PhoneVerification({
  stepUp = false,
  onVerified,
}: {
  stepUp?: boolean;
  onVerified?: () => void;
}) {
  const availability = useOtpAvailability("/api/auth/otp");
  const [phone, setPhone] = useState(""),
    [channel, setChannel] = useState<"WHATSAPP" | "SMS">("WHATSAPP"),
    [code, setCode] = useState(""),
    [sent, setSent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const canSubmit =
    !busy && (sent ? code.length === 6 : !availability.loading && availability.channels[channel] && /^[6-9]\d{9}$/.test(phone));
  const submit = async (customChannel?: "WHATSAPP" | "SMS") => {
    if (!canSubmit) return;
    setBusy(true);
    setError("");
    const targetChannel = customChannel || channel;
    try {
      const response = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: sent ? "verify" : "send",
          phone,
          channel: targetChannel,
          code,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error?.message ||
            "We couldn't verify your mobile right now. Please try again.",
        );
      if (sent && result.data?.verified === true) {
        if (onVerified) onVerified();
        else window.location.assign("/");
      } else if (!sent && result.data?.sent === true) {
        if (result.data?.channel) {
          setChannel(result.data.channel);
        }
        setSent(true);
      } else
        throw new Error(
          "We couldn't complete verification right now. Please try again.",
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      className="admin-form admin-phone-verification"
      aria-busy={busy}
      onKeyDown={(event) => {
        if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
          event.preventDefault();
          event.stopPropagation();
          if (canSubmit) void submit();
        }
      }}
    >
      {stepUp && (
        <p className="admin-phone-description">
          {stepUp
            ? "Verify a fresh OTP on your registered mobile to authorize this action."
            : "Verify your Indian mobile number to secure your administrative access."}
        </p>
      )}
      {!sent ? (
        <>
          <label htmlFor="admin-phone">Mobile number</label>
          <div className="admin-phone-input">
            <span className="admin-phone-prefix" aria-hidden="true">
              +91
            </span>
            <input
              id="admin-phone"
              name="admin-mobile"
              type="tel"
              autoComplete="tel-national"
              inputMode="tel"
              placeholder="10-digit mobile number"
              aria-label="Indian mobile number, country code +91"
              aria-describedby="admin-phone-help"
              disabled={busy}
              value={phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                setPhone(
                  (digits.length === 12 && digits.startsWith("91")
                    ? digits.slice(2)
                    : digits
                  ).slice(0, 10),
                );
              }}
            />
          </div>

          {/* Delivery Channel Radio Buttons */}
          <div style={{ marginTop: "12px", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", color: "var(--paper-text-muted, #77736c)", display: "block", marginBottom: "6px" }}>
              Deliver code via
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <button
                type="button"
                disabled={busy || !availability.channels.WHATSAPP}
                onClick={() => setChannel("WHATSAPP")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "8px 12px",
                  fontSize: "12px",
                  fontWeight: channel === "WHATSAPP" ? "600" : "500",
                  borderRadius: "3px",
                  border: channel === "WHATSAPP" ? "1px solid #25d366" : "1px solid #d8d0c5",
                  backgroundColor: channel === "WHATSAPP" ? "rgba(37, 211, 102, 0.1)" : "#fff",
                  color: channel === "WHATSAPP" ? "#0f6b31" : "#44413c",
                  cursor: "pointer",
                }}
              >
                <WhatsAppIcon size={14} />
                <span>WhatsApp{!availability.channels.WHATSAPP ? " · unavailable" : ""}</span>
              </button>
              <button
                type="button"
                disabled={busy || !availability.channels.SMS}
                onClick={() => setChannel("SMS")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "8px 12px",
                  fontSize: "12px",
                  fontWeight: channel === "SMS" ? "600" : "500",
                  borderRadius: "3px",
                  border: channel === "SMS" ? "1px solid #a9583e" : "1px solid #d8d0c5",
                  backgroundColor: channel === "SMS" ? "rgba(204, 120, 92, 0.1)" : "#fff",
                  color: channel === "SMS" ? "#8c3e25" : "#44413c",
                  cursor: "pointer",
                }}
              >
                <VaahanIcon name="sms" size={14} />
                <span>SMS</span>
              </button>
            </div>
          </div>

          <p className="admin-phone-help" id="admin-phone-help">
            {stepUp
              ? "Use the mobile number registered to your admin account."
              : `We’ll send a six-digit verification code to this number via ${channel === "WHATSAPP" ? "WhatsApp" : "SMS"}.`}
          </p>
        </>
      ) : (
        <>
          <label htmlFor="admin-otp">Verification code</label>
          <input
            id="admin-otp"
            className="admin-otp-input"
            name="admin-verification-code"
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            placeholder="••••••"
            aria-describedby="admin-phone-help"
            disabled={busy}
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
          <p className="admin-phone-help" id="admin-phone-help" role="status">
            Enter the six-digit code sent via {channel === "WHATSAPP" ? "WhatsApp" : "SMS"} to +91 ••••••{phone.slice(-4)}.
          </p>
        </>
      )}
      {!sent && !availability.loading && !availability.anyAvailable && (
        <div
          className="admin-notice admin-verification-unavailable"
          role="status"
        >
          <VaahanIcon name="shield-alert" size={19} />
          <div>
            <strong>Verification is temporarily unavailable</strong>
            <p>
              Please try again shortly or contact your platform administrator.
            </p>
            {!stepUp && (
              <button type="button" onClick={() => window.location.reload()}>
                Check again
                <VaahanIcon name="refresh" size={13} />
              </button>
            )}
          </div>
        </div>
      )}
      {error && (
        <div className="admin-notice error" role="alert">
          {error}
        </div>
      )}
      <button
        className="admin-button primary admin-phone-submit"
        type="button"
        disabled={!canSubmit}
        onClick={() => void submit()}
      >
        {busy
          ? sent
            ? "Verifying…"
            : "Sending code…"
          : sent
            ? "Verify and continue"
            : `Send verification code via ${channel === "WHATSAPP" ? "WhatsApp" : "SMS"}`}
        <VaahanIcon name={sent ? "shield-check" : "arrow-right"} size={16} />
      </button>
      {sent && (
        <button
          className="admin-phone-resend"
          type="button"
          disabled={busy}
          onClick={() => {
            setSent(false);
            setCode("");
          }}
        >
          Change number or request a new code
        </button>
      )}
    </div>
  );
}
