/**
 * @vaahansafe/customer
 * Authoritative Server-Side Scan History Service
 *
 * Single source of truth read model for the VaahanSafe Scan Intelligence Center.
 * Strictly queries Cloudflare D1 with authorized scoping.
 * Zero mock data, zero synthetic coordinates, zero browser storage.
 */

import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import type {
  ScanHistoryFilterState,
  ScanHistoryOverview,
  ScanSignalRailData,
  ScanRhythmPoint,
  TemporalScanHour,
  QrDistributionItem,
  AccessContextDistribution,
  ScanEventItem,
  AuthorizedVehicleScope,
  AuthorizedQrScope,
  ScanPeriodFilter,
  ScanJourneyMilestone,
} from "./scan-history-types";

interface DbVehicleRow {
  id: string;
  user_id: string;
  registration_number: string;
  vehicle_type: string;
  make: string;
  model: string;
  status: string;
}

interface DbQrRow {
  id: string;
  public_id: string;
  visible_code: string;
  status: string;
  vehicle_id: string;
  assigned_at: string;
}

interface DbScanEventRow {
  id: string;
  qr_id: string;
  scan_type: "PUBLIC_RESOLVE" | "EMERGENCY_TRIGGER" | "ADMIN_INSPECT";
  result:
    | "RESOLVED_ACTIVE"
    | "RESOLVED_INACTIVE"
    | "RESOLVED_REPLACED"
    | "RESOLVED_BLOCKED"
    | "NOT_FOUND";
  city: string | null;
  state: string | null;
  user_agent_family: string | null;
  referrer_class: string | null;
  created_at: string;
}

function maskPlate(reg: string): string {
  if (!reg || reg.length < 6) return reg || "VEHICLE";
  const cleaned = reg.toUpperCase().replace(/\s+/g, "");
  const state = cleaned.slice(0, 2);
  const rto = cleaned.slice(2, 4);
  const last4 = cleaned.slice(-4);
  return `${state} ${rto} •••• ${last4}`;
}

function maskPublicId(publicId: string): string {
  if (!publicId) return "VS-••••-••••";
  if (publicId.length <= 8) return publicId;
  const last4 = publicId.slice(-4);
  return `VS-••••-${last4}`;
}

function classifyDevice(ua: string | null): "Mobile" | "Desktop" | "Tablet" | "Undisclosed" {
  if (!ua) return "Undisclosed";
  const lower = ua.toLowerCase();
  if (lower.includes("tablet") || lower.includes("ipad")) return "Tablet";
  if (
    lower.includes("mobile") ||
    lower.includes("android") ||
    lower.includes("iphone") ||
    lower.includes("safari mobile")
  ) {
    return "Mobile";
  }
  if (
    lower.includes("chrome") ||
    lower.includes("safari") ||
    lower.includes("firefox") ||
    lower.includes("edge") ||
    lower.includes("desktop") ||
    lower.includes("macintosh") ||
    lower.includes("windows")
  ) {
    return "Desktop";
  }
  return "Undisclosed";
}

function getPeriodCutoff(period: ScanPeriodFilter): number {
  const now = Date.now();
  switch (period) {
    case "24H":
      return now - 24 * 60 * 60 * 1000;
    case "7D":
      return now - 7 * 24 * 60 * 60 * 1000;
    case "30D":
      return now - 30 * 24 * 60 * 60 * 1000;
    case "90D":
      return now - 90 * 24 * 60 * 60 * 1000;
    case "ALL":
    default:
      return 0;
  }
}

function getDateGroupKey(date: Date, now: Date): string {
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return "TODAY";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "YESTERDAY";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export async function getScanHistoryOverview(
  userId: string,
  filterOverrides?: Partial<ScanHistoryFilterState>
): Promise<ScanHistoryOverview> {
  const db = getAuthoritativeDatabaseClient();

  const activeFilters: ScanHistoryFilterState = {
    period: filterOverrides?.period || "30D",
    vehicleId: filterOverrides?.vehicleId || "all",
    qrPublicId: filterOverrides?.qrPublicId || "all",
    eventType: filterOverrides?.eventType || "all",
    deviceCategory: filterOverrides?.deviceCategory || "all",
    search: (filterOverrides?.search || "").trim(),
  };

  // 1. Authoritative queries: Vehicles & assigned QR stickers
  const [vehicles, qrStickers] = await Promise.all([
    db.query<DbVehicleRow>(
      `SELECT id, user_id, registration_number, vehicle_type, make, model, status
       FROM vehicles
       WHERE user_id = ? AND status != 'DELETED'
       ORDER BY created_at DESC`,
      [userId]
    ),
    db.query<DbQrRow>(
      `SELECT s.id, s.public_id, s.visible_code, s.status, a.vehicle_id, a.assigned_at
       FROM qr_stickers s
       JOIN qr_assignments a ON s.id = a.qr_id AND a.ended_at IS NULL
       WHERE a.user_id = ?
       ORDER BY a.assigned_at DESC`,
      [userId]
    ),
  ]);

  const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));
  const qrMap = new Map(qrStickers.map((q) => [q.id, q]));
  const qrByPublicId = new Map(qrStickers.map((q) => [q.public_id, q]));

  // Build authorized scopes for selector
  const authorizedVehicles: AuthorizedVehicleScope[] = vehicles.map((v) => {
    const linkedQr = qrStickers.find((q) => q.vehicle_id === v.id);
    return {
      id: v.id,
      plate: v.registration_number,
      maskedPlate: maskPlate(v.registration_number),
      make: v.make || "Vehicle",
      model: v.model || "",
      vehicleType: v.vehicle_type || "CAR",
      qrId: linkedQr?.id,
      qrPublicId: linkedQr?.public_id,
    };
  });

  const authorizedQrs: AuthorizedQrScope[] = qrStickers.map((q) => {
    const v = vehicleMap.get(q.vehicle_id);
    return {
      qrId: q.id,
      publicId: q.public_id,
      maskedPublicId: maskPublicId(q.public_id),
      vehicleId: q.vehicle_id,
      vehiclePlate: v ? maskPlate(v.registration_number) : undefined,
      vehicleDisplay: v ? `${v.make} ${v.model}`.trim() : undefined,
    };
  });

  // If user has zero registered QR stickers
  if (qrStickers.length === 0) {
    return {
      userHasQr: false,
      authorizedVehicles,
      authorizedQrs: [],
      signals: {
        totalScans: 0,
        lastScan: null,
        activeQrCount: 0,
        periodLabel: activeFilters.period === "ALL" ? "ALL TIME" : `${activeFilters.period} PERIOD`,
        periodScansCount: 0,
      },
      rhythmSeries: [],
      temporalField: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        hourLabel: String(i).padStart(2, "0"),
        scanCount: 0,
        percentage: 0,
      })),
      qrDistribution: [],
      accessContext: { mobileCount: 0, desktopCount: 0, tabletCount: 0, undisclosedCount: 0 },
      events: [],
      appliedFilters: activeFilters,
      totalFilteredCount: 0,
    };
  }

  // 2. Determine target authorized QR IDs
  let targetQrIds = qrStickers.map((q) => q.id);

  // If vehicle filter is active and belongs to user
  if (activeFilters.vehicleId !== "all") {
    const matchingQrs = qrStickers.filter((q) => q.vehicle_id === activeFilters.vehicleId);
    targetQrIds = matchingQrs.map((q) => q.id);
  }

  // If QR public ID filter is active and belongs to user
  if (activeFilters.qrPublicId !== "all") {
    const matchingSticker = qrByPublicId.get(activeFilters.qrPublicId);
    if (matchingSticker) {
      targetQrIds = [matchingSticker.id];
    }
  }

  if (targetQrIds.length === 0) {
    return {
      userHasQr: true,
      authorizedVehicles,
      authorizedQrs,
      signals: {
        totalScans: 0,
        lastScan: null,
        activeQrCount: qrStickers.filter((q) => q.status === "ACTIVATED").length,
        periodLabel: activeFilters.period === "ALL" ? "ALL TIME" : `${activeFilters.period} PERIOD`,
        periodScansCount: 0,
      },
      rhythmSeries: [],
      temporalField: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        hourLabel: String(i).padStart(2, "0"),
        scanCount: 0,
        percentage: 0,
      })),
      qrDistribution: [],
      accessContext: { mobileCount: 0, desktopCount: 0, tabletCount: 0, undisclosedCount: 0 },
      events: [],
      appliedFilters: activeFilters,
      totalFilteredCount: 0,
    };
  }

  // 3. Query All Scan Events for user's authorized QR IDs
  const allUserQrIds = qrStickers.map((q) => q.id);
  const placeholders = allUserQrIds.map(() => "?").join(",");
  const rawScanEvents = await db.query<DbScanEventRow>(
    `SELECT id, qr_id, scan_type, result, city, state, user_agent_family, referrer_class, created_at
     FROM qr_scan_events
     WHERE qr_id IN (${placeholders})
     ORDER BY created_at DESC`,
    allUserQrIds
  );

  const totalLifetimeScans = rawScanEvents.length;
  const activeQrCount = qrStickers.filter((q) => q.status === "ACTIVATED").length;

  // Filter by scoped QR selection first
  const scopedScans = rawScanEvents.filter((s) => targetQrIds.includes(s.qr_id));

  // Date period filter
  const cutoffMs = getPeriodCutoff(activeFilters.period);
  const periodFilteredScans = scopedScans.filter((s) => {
    if (cutoffMs === 0) return true;
    return new Date(s.created_at).getTime() >= cutoffMs;
  });

  // 4. Compute Signals Rail
  const lastScanEvent = scopedScans[0] || null;
  const signals: ScanSignalRailData = {
    totalScans: totalLifetimeScans,
    lastScan: lastScanEvent
      ? {
          occurredAt: lastScanEvent.created_at,
          formatted: new Intl.DateTimeFormat("en-IN", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(new Date(lastScanEvent.created_at)),
          relativeTime: formatRelativeTime(lastScanEvent.created_at),
        }
      : null,
    activeQrCount,
    periodLabel:
      activeFilters.period === "24H"
        ? "24 HOURS"
        : activeFilters.period === "7D"
        ? "7 DAYS"
        : activeFilters.period === "30D"
        ? "30 DAYS"
        : activeFilters.period === "90D"
        ? "90 DAYS"
        : "ALL TIME",
    periodScansCount: periodFilteredScans.length,
  };

  // 5. Signature Visualization 1: Scan Rhythm (Hourly for 24H, Daily for 7D/30D/90D)
  const rhythmSeries = buildRhythmSeries(periodFilteredScans, activeFilters.period);

  // 6. Signature Visualization 2: Temporal Scan Field (24 hours 00 to 23)
  const temporalField: TemporalScanHour[] = Array.from({ length: 24 }, (_, hour) => {
    return {
      hour,
      hourLabel: String(hour).padStart(2, "0"),
      scanCount: 0,
      percentage: 0,
    };
  });

  for (const s of periodFilteredScans) {
    const d = new Date(s.created_at);
    const hour = d.getHours();
    if (temporalField[hour]) {
      temporalField[hour].scanCount += 1;
    }
  }

  const maxHourScans = Math.max(...temporalField.map((t) => t.scanCount), 1);
  for (const t of temporalField) {
    t.percentage = Math.round((t.scanCount / maxHourScans) * 100);
  }

  // 7. Signature Visualization 3: QR Distribution
  const qrDistributionMap = new Map<string, number>();
  for (const s of periodFilteredScans) {
    qrDistributionMap.set(s.qr_id, (qrDistributionMap.get(s.qr_id) || 0) + 1);
  }

  const qrDistribution: QrDistributionItem[] = qrStickers
    .filter((q) => targetQrIds.includes(q.id))
    .map((q) => {
      const count = qrDistributionMap.get(q.id) || 0;
      const v = vehicleMap.get(q.vehicle_id);
      return {
        qrId: q.id,
        publicId: maskPublicId(q.public_id),
        rawPublicId: q.public_id,
        vehiclePlate: v ? maskPlate(v.registration_number) : "Unknown",
        vehicleName: v ? `${v.make} ${v.model}`.trim() : "Registered Vehicle",
        vehicleType: v?.vehicle_type || "CAR",
        scanCount: count,
        percentage:
          periodFilteredScans.length > 0
            ? Math.round((count / periodFilteredScans.length) * 100)
            : 0,
        status: q.status,
      };
    })
    .sort((a, b) => b.scanCount - a.scanCount);

  // 8. Access Context Distribution
  const accessContext: AccessContextDistribution = {
    mobileCount: 0,
    desktopCount: 0,
    tabletCount: 0,
    undisclosedCount: 0,
  };

  for (const s of periodFilteredScans) {
    const cat = classifyDevice(s.user_agent_family);
    if (cat === "Mobile") accessContext.mobileCount++;
    else if (cat === "Desktop") accessContext.desktopCount++;
    else if (cat === "Tablet") accessContext.tabletCount++;
    else accessContext.undisclosedCount++;
  }

  // 9. Additional Filters for Registry (EventType, DeviceCategory, Search)
  let filteredRegistryScans = periodFilteredScans;

  if (activeFilters.eventType !== "all") {
    filteredRegistryScans = filteredRegistryScans.filter((s) => s.scan_type === activeFilters.eventType);
  }

  if (activeFilters.deviceCategory !== "all") {
    filteredRegistryScans = filteredRegistryScans.filter(
      (s) => classifyDevice(s.user_agent_family) === activeFilters.deviceCategory
    );
  }

  if (activeFilters.search) {
    const q = activeFilters.search.toLowerCase();
    filteredRegistryScans = filteredRegistryScans.filter((s) => {
      const sticker = qrMap.get(s.qr_id);
      const vehicle = sticker ? vehicleMap.get(sticker.vehicle_id) : null;
      const publicId = (sticker?.public_id || "").toLowerCase();
      const plate = (vehicle?.registration_number || "").toLowerCase();
      const makeModel = (vehicle ? `${vehicle.make} ${vehicle.model}` : "").toLowerCase();
      const location = `${s.city || ""} ${s.state || ""}`.toLowerCase();
      return (
        publicId.includes(q) ||
        plate.includes(q) ||
        makeModel.includes(q) ||
        location.includes(q)
      );
    });
  }

  // 10. Transform into Customer-Safe Read DTOs
  const now = new Date();
  const events: ScanEventItem[] = filteredRegistryScans.map((s) => {
    const sticker = qrMap.get(s.qr_id);
    const vehicle = sticker ? vehicleMap.get(sticker.vehicle_id) : null;
    const occurredDate = new Date(s.created_at);

    const publicId = sticker?.public_id || "VS-UNKNOWN";
    const maskedId = maskPublicId(publicId);
    const vehiclePlate = vehicle ? maskPlate(vehicle.registration_number) : "VEHICLE";
    const vehicleDisplay = vehicle ? `${vehicle.make} ${vehicle.model}`.trim() : "Registered Vehicle";
    const vehicleType = vehicle?.vehicle_type || "CAR";

    const approxRegion =
      [s.city, s.state].filter(Boolean).join(", ") || null;

    const device = classifyDevice(s.user_agent_family);

    let resultLabel = "SAFETY VIEW OPENED";
    let resultBadgeVariant: "success" | "warning" | "destructive" | "outline" = "success";

    if (s.result === "RESOLVED_REPLACED") {
      resultLabel = "REPLACED NOTICE";
      resultBadgeVariant = "warning";
    } else if (s.result === "RESOLVED_INACTIVE") {
      resultLabel = "PENDING ACTIVATION";
      resultBadgeVariant = "outline";
    } else if (s.result === "RESOLVED_BLOCKED" || s.result === "NOT_FOUND") {
      resultLabel = "SAFETY PASS UNAVAILABLE";
      resultBadgeVariant = "destructive";
    }

    const journey: ScanJourneyMilestone[] = [
      {
        key: "QR_ENCOUNTERED",
        title: "QR Sticker Encountered",
        description: "Physical QR code detected by finder or first responder device camera.",
        occurredAt: s.created_at,
        isCompleted: true,
        statusText: "Verified",
        badgeVariant: "success",
      },
      {
        key: "IDENTITY_RESOLVED",
        title: "Public Identity Verified",
        description: `Opaque resolver ID ${maskedId} verified in Cloudflare D1.`,
        occurredAt: s.created_at,
        isCompleted: true,
        statusText: "Authenticated",
        badgeVariant: "success",
      },
      {
        key: "PUBLIC_VIEW_SERVED",
        title: "Public Safety View Dispatched",
        description: `Server-projected vehicle emergency pass (${resultLabel}).`,
        occurredAt: s.created_at,
        isCompleted: true,
        statusText: resultLabel,
        badgeVariant: resultBadgeVariant,
      },
      {
        key: "SUPPORTED_ACTION",
        title: "Encrypted Relay Accessible",
        description: "Emergency contacts protected; direct dial relay accessible without revealing private numbers.",
        isCompleted: s.result === "RESOLVED_ACTIVE",
        statusText: s.result === "RESOLVED_ACTIVE" ? "Available" : "Not Active",
        badgeVariant: s.result === "RESOLVED_ACTIVE" ? "success" : "secondary",
      },
    ];

    return {
      id: s.id,
      qrId: s.qr_id,
      publicQrIdentity: maskedId,
      rawPublicId: publicId,
      vehicleId: vehicle?.id || "",
      vehiclePlate,
      vehicleDisplay,
      vehicleType,
      occurredAt: s.created_at,
      occurredAtFormatted: new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(occurredDate),
      occurredDateFormatted: new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(occurredDate),
      dateGroupKey: getDateGroupKey(occurredDate, now),
      scanType: s.scan_type,
      scanTypeLabel:
        s.scan_type === "EMERGENCY_TRIGGER"
          ? "Emergency Scan"
          : s.scan_type === "ADMIN_INSPECT"
          ? "Inspection Scan"
          : "Passerby Scan",
      result: s.result,
      resultLabel,
      resultBadgeVariant,
      approximateRegion: approxRegion,
      deviceCategory: device,
      referrerClass: s.referrer_class || "DIRECT_CAMERA",
      journey,
    };
  });

  return {
    userHasQr: true,
    authorizedVehicles,
    authorizedQrs,
    signals,
    rhythmSeries,
    temporalField,
    qrDistribution,
    accessContext,
    events,
    appliedFilters: activeFilters,
    totalFilteredCount: events.length,
  };
}

/**
 * Builds continuous time series points for the Scan Rhythm curve based on selected period.
 */
function buildRhythmSeries(
  scans: DbScanEventRow[],
  period: ScanPeriodFilter
): ScanRhythmPoint[] {
  const now = new Date();

  if (period === "24H") {
    // 24 hourly buckets from 23h ago to now
    const points: ScanRhythmPoint[] = [];
    for (let i = 23; i >= 0; i--) {
      const bucketTime = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hour = bucketTime.getHours();
      const label = `${String(hour).padStart(2, "0")}:00`;
      const fullDate = new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(bucketTime);

      const bucketStart = new Date(bucketTime);
      bucketStart.setMinutes(0, 0, 0);
      const bucketEnd = new Date(bucketStart.getTime() + 60 * 60 * 1000);

      const bucketScans = scans.filter((s) => {
        const t = new Date(s.created_at).getTime();
        return t >= bucketStart.getTime() && t < bucketEnd.getTime();
      });

      const uniqueQrs = new Set(bucketScans.map((s) => s.qr_id));
      const emergencyCount = bucketScans.filter((s) => s.scan_type === "EMERGENCY_TRIGGER").length;

      points.push({
        timestamp: bucketStart.toISOString(),
        label,
        fullDate,
        scanCount: bucketScans.length,
        emergencyCount,
        uniqueQrCount: uniqueQrs.size,
        mostRecentTime: bucketScans[0]
          ? new Intl.DateTimeFormat("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }).format(new Date(bucketScans[0].created_at))
          : undefined,
      });
    }
    return points;
  }

  // Daily buckets for 7D, 30D, 90D, or ALL
  const numDays = period === "7D" ? 7 : period === "90D" ? 90 : 30;
  const points: ScanRhythmPoint[] = [];

  for (let i = numDays - 1; i >= 0; i--) {
    const bucketDay = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayStart = new Date(bucketDay.getFullYear(), bucketDay.getMonth(), bucketDay.getDate(), 0, 0, 0);
    const dayEnd = new Date(bucketDay.getFullYear(), bucketDay.getMonth(), bucketDay.getDate(), 23, 59, 59, 999);

    const label = new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
    }).format(dayStart);

    const fullDate = new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(dayStart);

    const bucketScans = scans.filter((s) => {
      const t = new Date(s.created_at).getTime();
      return t >= dayStart.getTime() && t <= dayEnd.getTime();
    });

    const uniqueQrs = new Set(bucketScans.map((s) => s.qr_id));
    const emergencyCount = bucketScans.filter((s) => s.scan_type === "EMERGENCY_TRIGGER").length;

    points.push({
      timestamp: dayStart.toISOString(),
      label,
      fullDate,
      scanCount: bucketScans.length,
      emergencyCount,
      uniqueQrCount: uniqueQrs.size,
      mostRecentTime: bucketScans[0]
        ? new Intl.DateTimeFormat("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(new Date(bucketScans[0].created_at))
        : undefined,
    });
  }

  return points;
}
