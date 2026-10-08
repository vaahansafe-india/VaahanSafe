"use client";
import { useState, type FormEvent } from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { isAdminWorkEmail } from "../lib/password-policy";

export function EmailPasswordSignIn() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [emailAccepted, setEmailAccepted] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    if (!isAdminWorkEmail(values.get("email"))) {
      setError("Use your @vaahansafe.com work email to continue.");
      setEmailAccepted(false);
      return;
    }
    if (!emailAccepted) {
      const field = form.elements.namedItem("email") as HTMLInputElement;
      field.value = field.value.trim().toLowerCase();
      setError("");
      setEmailAccepted(true);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.get("email"),
          password: values.get("password"),
        }),
      });
      const result = await response.json();
      if (!response.ok || result.data?.next !== "/verify-phone")
        throw new Error(
          result.error?.message ||
            "We couldn't complete sign-in right now. Please try again.",
        );
      form.reset();
      window.location.assign("/verify-phone");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "We couldn't complete sign-in right now. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="admin-password-form" onSubmit={submit} aria-busy={busy}>
      <label htmlFor="admin-email">Work email</label>
      <input
        id="admin-email"
        name="email"
        type="email"
        autoComplete="username"
        inputMode="email"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={254}
        placeholder="you@vaahansafe.com"
        readOnly={emailAccepted}
        aria-describedby="admin-email-hint"
        required
        disabled={busy}
      />
      <div className="admin-email-hint" id="admin-email-hint">
        <span>Only @vaahansafe.com work emails can continue.</span>
        {emailAccepted && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setEmailAccepted(false);
              setError("");
            }}
          >
            Change
          </button>
        )}
      </div>
      {emailAccepted && (
        <>
          <label htmlFor="admin-password">Password</label>
          <div className="admin-password-field">
            <input
              id="admin-password"
              name="password"
              type={visible ? "text" : "password"}
              autoComplete="current-password"
              autoFocus
              maxLength={128}
              required
              disabled={busy}
            />
            <button
              type="button"
              className="admin-password-toggle"
              aria-label={visible ? "Hide password" : "Show password"}
              aria-pressed={visible}
              onClick={() => setVisible(!visible)}
              disabled={busy}
            >
              <VaahanIcon name={visible ? "eye-off" : "eye"} size={18} />
            </button>
          </div>
        </>
      )}
      {error && (
        <div className="admin-notice error" role="alert">
          {error}
        </div>
      )}
      <button
        className="admin-button primary admin-password-submit"
        type="submit"
        disabled={busy}
      >
        {busy
          ? "Signing in…"
          : emailAccepted
            ? "Sign in to workspace"
            : "Continue with work email"}
        <VaahanIcon name="arrow-right" size={16} />
      </button>
      <p className="admin-password-help">
        Need access or a password reset? Contact your platform administrator.
      </p>
    </form>
  );
}
