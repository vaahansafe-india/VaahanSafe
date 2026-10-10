"use client";

import React, { useEffect, useRef, useState } from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export interface ContactActionProps {
  phone: string;
  isPrimary?: boolean;
  label?: string;
  allowCall?: boolean;
  allowMessage?: boolean;
  publicId?: string;
}

export function ContactAction({
  phone,
  isPrimary = false,
  label = "Call contact",
  allowCall = true,
  allowMessage = false,
  publicId,
}: ContactActionProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const cleanPhone = phone.trim();
  const digits = cleanPhone.replace(/\D/g, "");
  const whatsappPhone = /^[6-9]\d{9}$/.test(digits) ? `91${digits}` : digits;
  const canMessage = allowMessage && /^\d{10,15}$/.test(whatsappPhone);
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Hello, I scanned a VaahanSafe vehicle QR${publicId ? ` (${publicId})` : ""} and would like to contact you about the vehicle. Please check the situation.`)}`;
  async function handleCopy() {
    setCopyError("");
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(cleanPhone);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(
        "We couldn’t copy the number. Please use an available contact option.",
      );
    }
  }
  const actionStyle =
    "inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  return (
    <div
      className={isPrimary ? "w-full space-y-2" : "w-full space-y-2 sm:w-auto"}
    >
      <div
        className={
          allowCall && canMessage
            ? "grid grid-cols-1 gap-2 min-[360px]:grid-cols-2"
            : "grid grid-cols-1 gap-2"
        }
      >
        {allowCall && (
          <a
            href={`tel:${cleanPhone}`}
            className={`${actionStyle} ${isPrimary ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" : "border border-primary/25 bg-primary/5 text-primary hover:bg-primary/10"}`}
            aria-label={`Call emergency contact at ${cleanPhone}`}
          >
            <VaahanIcon name="phone" size={18} />
            <span>{label}</span>
          </a>
        )}
        {canMessage && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${actionStyle} border border-border bg-background text-foreground hover:bg-muted/60`}
            aria-label="Open WhatsApp to message this emergency contact"
          >
            <VaahanIcon name="message" size={18} />
            <span>WhatsApp</span>
            <VaahanIcon
              name="external-link"
              size={13}
              className="shrink-0 text-muted-foreground"
            />
          </a>
        )}
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        aria-label="Copy phone number to clipboard"
      >
        <VaahanIcon
          name={copied ? "check" : "copy"}
          size={16}
          className={copied ? "text-emerald-600" : ""}
        />
        <span>{copied ? "Number copied" : "Copy number"}</span>
      </button>
      <span role="status" className="sr-only">
        {copied ? "Phone number copied" : ""}
      </span>
      {copyError && (
        <p
          role="alert"
          className="text-xs leading-relaxed text-muted-foreground"
        >
          {copyError}
        </p>
      )}
    </div>
  );
}
