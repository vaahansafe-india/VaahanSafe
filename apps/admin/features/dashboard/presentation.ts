export function formatRelativeAge(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(diffMs)) return "—";
  if (diffMs < 0) return "just now";
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function formatIstTimestamp(dateString: string | null | undefined): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return (
    new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    }).format(date) + " IST"
  );
}

export function formatHumanReference(ref: string | null | undefined): {
  display: string;
  full: string;
} {
  if (!ref) return { display: "—", full: "" };
  if (ref.length > 18) {
    const parts = ref.split("-");
    if (parts.length >= 3) {
      const prefix = parts.slice(0, 2).join("-");
      const suffix = parts[parts.length - 1];
      return {
        display: `${prefix}-…-${suffix}`,
        full: ref,
      };
    }
    return {
      display: `${ref.slice(0, 8)}…${ref.slice(-6)}`,
      full: ref,
    };
  }
  return { display: ref, full: ref };
}

export interface StatusSemantic {
  badgeClass: string;
  dotClass: string;
  label: string;
}

export function getStatusSemantic(status: string | null | undefined): StatusSemantic {
  const norm = String(status || "").trim().toUpperCase();
  switch (norm) {
    case "PAID":
    case "ACTIVE":
    case "CONFIRMED":
    case "RESOLVED":
    case "HEALTHY":
    case "CONNECTED":
    case "SUCCESS":
      return {
        badgeClass: "admin-status-badge status-success",
        dotClass: "status-dot-success",
        label: norm.toLowerCase(),
      };
    case "PENDING":
    case "WAITING":
    case "IN_PROGRESS":
    case "PROCESSING":
    case "CONFIGURED":
    case "INVESTIGATING":
    case "MANIFESTED":
      return {
        badgeClass: "admin-status-badge status-pending",
        dotClass: "status-dot-pending",
        label: norm.toLowerCase(),
      };
    case "FAILED":
    case "PAYMENT FAILED":
    case "CANCELLED":
    case "BLOCKED":
    case "UNAVAILABLE":
    case "ERROR":
    case "CRITICAL":
      return {
        badgeClass: "admin-status-badge status-danger",
        dotClass: "status-dot-danger",
        label: norm.toLowerCase(),
      };
    case "DRAFT":
    case "RETIRED":
    case "UNCONFIGURED":
    default:
      return {
        badgeClass: "admin-status-badge status-neutral",
        dotClass: "status-dot-neutral",
        label: norm ? norm.toLowerCase() : "unknown",
      };
  }
}

export function formatCurrencyMinor(
  amountMinor: number | null | undefined,
  currency = "INR",
): string {
  if (amountMinor == null || Number.isNaN(amountMinor)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

export function getGreetingForIstHour(date: Date = new Date()): string {
  const istHour = parseInt(
    new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Kolkata",
    }).format(date),
    10,
  );
  if (istHour >= 4 && istHour < 12) return "Good morning";
  if (istHour >= 12 && istHour < 17) return "Good afternoon";
  return "Good evening";
}
