"use client";
import { useEffect, useState, type FormEvent } from "react";

export function EmailVerification({
  stepUp = false,
  onVerified,
}: {
  stepUp?: boolean;
  onVerified?: () => void;
}) {
  const [sent, setSent] = useState(false),
    [code, setCode] = useState(""),
    [email, setEmail] = useState("your work email"),
    [cooldown, setCooldown] = useState(0),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/auth/email-otp", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok)
          throw new Error(
            result.error?.message ||
              "We couldn't load email verification. Please try again.",
          );
        if (active) {
          setSent(result.data.sent);
          setEmail(result.data.email);
          setCooldown(result.data.cooldownSeconds);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(
      () => setCooldown((c) => Math.max(0, c - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [cooldown]);
  async function submit(action: "send" | "verify", event?: FormEvent) {
    event?.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...(action === "verify" ? { code } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error?.message ||
            "We couldn't complete email verification. Please try again.",
        );
      if (action === "send") {
        setSent(true);
        setEmail(result.data.email);
        setCooldown(60);
        setCode("");
      } else if (onVerified) onVerified();
      else window.location.assign("/");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "We couldn't complete email verification. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className="admin-password-form"
      aria-busy={busy}
      onSubmit={(e) => submit(sent ? "verify" : "send", e)}
    >
      <p>
        {stepUp
          ? "Confirm this action with a fresh code sent to"
          : "Your verification code is sent to"}{" "}
        <strong>{email}</strong>.
      </p>
      {sent && (
        <>
          <label htmlFor="admin-email-code">Email verification code</label>
          <input
            id="admin-email-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            disabled={busy}
            required
            aria-describedby="admin-email-code-help"
          />
        </>
      )}
      <p className="admin-password-help" id="admin-email-code-help">
        The code expires in five minutes. Check your inbox and spam folder.
        Never share it.
      </p>
      {error && (
        <div className="admin-notice error" role="alert">
          {error}
        </div>
      )}
      <button
        className="admin-button primary"
        type="submit"
        disabled={busy || (sent ? code.length !== 6 : cooldown > 0)}
      >
        {busy
          ? "Please wait…"
          : sent
            ? stepUp
              ? "Verify email code"
              : "Verify and open workspace"
            : "Send code to my email"}
      </button>
      {sent && (
        <button
          type="button"
          className="admin-button"
          disabled={busy || cooldown > 0}
          onClick={() => submit("send")}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Send a new email code"}
        </button>
      )}
    </form>
  );
}
