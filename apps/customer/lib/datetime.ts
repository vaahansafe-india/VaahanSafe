/**
 * Authoritative Indian Standard Time (IST) DateTime Formatting Engine for VaahanSafe.
 * Single source of truth for converting database UTC timestamps to India Standard Time (Asia/Kolkata, UTC+05:30).
 */

export const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Safely parses any date string (ISO 8601 UTC, SQLite string, Date object)
 * ensuring it is treated authoritatively as UTC rather than local browser time.
 */
export function parseUtcDate(input?: string | Date | null): Date | null {
  if (!input) return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }

  let cleaned = String(input).trim();
  if (!cleaned) return null;

  // Convert space-separated SQLite timestamp to ISO ("2026-09-23 06:38:00" -> "2026-09-23T06:38:00")
  if (cleaned.includes(" ") && !cleaned.includes("T")) {
    cleaned = cleaned.replace(" ", "T");
  }

  // Ensure UTC indicator if no timezone offset is present
  if (!cleaned.endsWith("Z") && !/[+-]\d{2}:?\d{2}$/.test(cleaned)) {
    cleaned += "Z";
  }

  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  // Fallback to native constructor if custom normalization failed
  const fallback = new Date(input);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Formats a timestamp into a compact month-day and 24-hr time string in Indian Standard Time:
 * Example: "09-23 12:08"
 */
export function formatTimelineTimestamp(input?: string | Date | null): string {
  const date = parseUtcDate(input);
  if (!date) return "";

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: IST_TIMEZONE,
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const parts = Object.fromEntries(
      formatter.formatToParts(date).map((p) => [p.type, p.value])
    );

    // Format as MM-DD HH:mm (matching the timeline's original compact design)
    return `${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
  } catch {
    return "";
  }
}

/**
 * Formats a timestamp into an authoritative full date and time string in IST:
 * Example: "23 Sep 2026, 12:08 PM IST" or "23 Sep, 12:08 PM"
 */
export function formatFullIstTimestamp(
  input?: string | Date | null,
  options?: {
    compact?: boolean;
    includeSeconds?: boolean;
  }
): string {
  const date = parseUtcDate(input);
  if (!date) return "Recorded";

  try {
    if (options?.compact) {
      return new Intl.DateTimeFormat("en-IN", {
        timeZone: IST_TIMEZONE,
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    }

    const baseFormat = new Intl.DateTimeFormat("en-IN", {
      timeZone: IST_TIMEZONE,
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: options?.includeSeconds ? "2-digit" : undefined,
      hour12: true,
    }).format(date);

    return `${baseFormat} IST`;
  } catch {
    return "Recorded";
  }
}

/**
 * Formats a timestamp into date-only string in IST:
 * Example: "23 Sep 2026"
 */
export function formatDateIst(input?: string | Date | null): string {
  const date = parseUtcDate(input);
  if (!date) return "";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: IST_TIMEZONE,
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

/**
 * Formats a timestamp into a clean milestone date & time in IST:
 * Example: "23 Sep 2026, 11:08 am"
 */
export function formatMilestoneIst(input?: string | Date | null): string {
  const date = parseUtcDate(input);
  if (!date) return "Pending Verification";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: IST_TIMEZONE,
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return "Pending Verification";
  }
}
