/**
 * Authoritative Server-side Settings Service for VaahanSafe
 *
 * Connects to Cloudflare D1 repositories to resolve real user profiles,
 * identities, active sessions, notification preferences, and public projection privacy.
 */

import {
  getUserRepository,
  getAuthIdentityRepository,
  getSessionRepository,
  getVehicleRepository,
  getEmergencyRepository,
  getNotificationPreferenceRepository,
  getAuthoritativeDatabaseClient,
} from "@vaahansafe/database";
import type {
  SettingsData,
  SessionItem,
  NotificationCategoryConfig,
  NotificationMatrixCategory,
  PrivacyVehicleProfile,
  VehicleOption,
  SecurityActivityItem,
} from "./settings-types";

function parseUserAgent(ua?: string | null): {
  browser: string;
  os: string;
  deviceType: "desktop" | "mobile" | "tablet" | "device";
} {
  if (!ua) {
    return { browser: "Web Browser", os: "Unknown Device", deviceType: "device" };
  }

  let os = "Desktop";
  let deviceType: "desktop" | "mobile" | "tablet" | "device" = "desktop";

  if (/windows/i.test(ua)) os = "Windows";
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
  else if (/iphone/i.test(ua)) {
    os = "iOS";
    deviceType = "mobile";
  } else if (/ipad/i.test(ua)) {
    os = "iPadOS";
    deviceType = "tablet";
  } else if (/android/i.test(ua)) {
    os = "Android";
    deviceType = /mobile/i.test(ua) ? "mobile" : "tablet";
  } else if (/linux/i.test(ua)) os = "Linux";

  let browser = "Browser";
  if (/edg\//i.test(ua)) browser = "Microsoft Edge";
  else if (/chrome|crios/i.test(ua)) browser = "Google Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Mozilla Firefox";
  else if (/safari/i.test(ua)) browser = "Apple Safari";
  else if (/opr\//i.test(ua)) browser = "Opera";

  return { browser, os, deviceType };
}

function maskIp(ip?: string | null): string {
  if (!ip) return "Encrypted Network";
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.•••.•••`;
  }
  if (ip.includes(":")) {
    const segments = ip.split(":");
    return `${segments[0]}:${segments[1]}:••••:••••`;
  }
  return "Encrypted Network";
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10) {
    return `+91 ••••• ••${digits.slice(-3)}`;
  }
  return phone;
}

export async function getSettingsData(
  userId: string,
  currentSessionId: string
): Promise<SettingsData> {
  const userRepo = getUserRepository();
  const identityRepo = getAuthIdentityRepository();
  const sessionRepo = getSessionRepository();
  const vehicleRepo = getVehicleRepository();
  const emergencyRepo = getEmergencyRepository();
  const prefRepo = getNotificationPreferenceRepository();
  const db = getAuthoritativeDatabaseClient();

  // 1. User
  const user = await userRepo.findById(userId);
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const safeAccountId = `VS-ACCT-${user.id.replace(/^usr_/, "").slice(0, 6).toUpperCase()}`;
  const memberSince = user.createdAt
    ? new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
        new Date(user.createdAt)
      )
    : "September 2026";

  // 2. Identities
  const identities = await identityRepo.findByUserId(userId);
  const googleIdentity = identities.find((i) => i.provider === "GOOGLE");
  const phoneIdentity = identities.find((i) => i.provider === "PHONE");

  const identitiesData = {
    google: {
      connected: Boolean(googleIdentity),
      email: googleIdentity?.normalizedIdentifier || user.email || undefined,
      connectedAt: googleIdentity?.createdAt,
    },
    mobile: {
      verified: Boolean(user.phone || phoneIdentity),
      phone: user.phone || "",
      maskedPhone: maskPhone(user.phone || ""),
    },
  };

  // 3. Sessions
  const allSessions = await sessionRepo.findByUserId(userId);
  const nowTime = new Date().getTime();

  // Filter unrevoked and unexpired
  const activeSessions = allSessions.filter((s) => {
    if (s.revokedAt) return false;
    const expires = new Date(s.expiresAt).getTime();
    return expires > nowTime;
  });

  let currentSessionItem: SessionItem | null = null;
  const otherSessionItems: SessionItem[] = [];

  for (const s of activeSessions) {
    const isCurrent = s.id === currentSessionId;
    const { browser, os, deviceType } = parseUserAgent(s.userAgent);
    const item: SessionItem = {
      id: s.id,
      isCurrent,
      browser,
      os,
      deviceType,
      lastSeenAt: s.lastSeenAt,
      createdAt: s.createdAt,
      ipAddressMasked: maskIp(s.ipAddress),
      rawUserAgent: s.userAgent,
    };

    if (isCurrent) {
      currentSessionItem = item;
    } else {
      otherSessionItems.push(item);
    }
  }

  // Fallback current session representation if token hash differed
  if (!currentSessionItem) {
    currentSessionItem = {
      id: currentSessionId,
      isCurrent: true,
      browser: "Current Browser",
      os: "This Device",
      deviceType: "desktop",
      lastSeenAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      ipAddressMasked: "Active Session",
    };
  }

  // 4. Notification Preferences
  const savedPrefs = await prefRepo.findByUserId(userId);
  const getPrefState = (
    cat: NotificationMatrixCategory,
    channel: "IN_APP" | "WHATSAPP" | "EMAIL",
    defaultVal: boolean
  ): boolean => {
    const match = savedPrefs.find((p) => p.category === cat && p.channel === channel);
    return match ? match.enabled : defaultVal;
  };

  const notificationCategories: NotificationCategoryConfig[] = [
    {
      key: "SAFETY",
      label: "QR Activity & Alerts",
      description: "Immediate safety notifications when someone scans your vehicle QR sticker.",
      channels: {
        IN_APP: { enabled: getPrefState("SAFETY", "IN_APP", true) },
        WHATSAPP: { enabled: getPrefState("SAFETY", "WHATSAPP", true) },
        EMAIL: { enabled: getPrefState("SAFETY", "EMAIL", false) },
      },
    },
    {
      key: "FULFILMENT",
      label: "Order & Dispatch Updates",
      description: "Tracking milestones, courier dispatch, and physical sticker delivery.",
      channels: {
        IN_APP: { enabled: getPrefState("FULFILMENT", "IN_APP", true) },
        WHATSAPP: { enabled: getPrefState("FULFILMENT", "WHATSAPP", true) },
        EMAIL: { enabled: getPrefState("FULFILMENT", "EMAIL", true) },
      },
    },
    {
      key: "COMMERCE",
      label: "Payments & Invoices",
      description: "Payment confirmations, official GST tax receipts, and renewal notices.",
      channels: {
        IN_APP: { enabled: getPrefState("COMMERCE", "IN_APP", true) },
        WHATSAPP: { enabled: getPrefState("COMMERCE", "WHATSAPP", false) },
        EMAIL: { enabled: getPrefState("COMMERCE", "EMAIL", true) },
      },
    },
    {
      key: "SECURITY",
      label: "Security & Authentication",
      description: "Critical sign-in verifications, mobile changes, and security alerts.",
      channels: {
        IN_APP: { enabled: true, disabledReason: "REQUIRED_SECURITY" },
        WHATSAPP: { enabled: getPrefState("SECURITY", "WHATSAPP", false) },
        EMAIL: { enabled: true, disabledReason: "REQUIRED_SECURITY" },
      },
    },
  ];

  // 5. Vehicles & Privacy Projection
  const userVehicles = await vehicleRepo.findByCustomerId(userId);
  const vehicleOptions: VehicleOption[] = userVehicles.map((v, idx) => ({
    id: v.id,
    registrationNumber: v.registrationNumber,
    make: v.make,
    model: v.model,
    year: v.year,
    isDefault: idx === 0,
  }));

  let privacyProfile: PrivacyVehicleProfile | null = null;
  const primaryVehicle = userVehicles[0];

  if (primaryVehicle) {
    const rawProfile = await emergencyRepo.findRawProfileByVehicleId(primaryVehicle.id);

    // Resolve public QR identifier for live preview
    interface QrRow {
      public_id: string;
    }
    const qrRow = await db.queryFirst<QrRow>(
      `SELECT s.public_id
       FROM qr_assignments a
       JOIN qr_stickers s ON a.qr_id = s.id
       WHERE a.vehicle_id = ? AND a.ended_at IS NULL
       LIMIT 1`,
      [primaryVehicle.id]
    );

    const publicId = qrRow?.public_id || null;

    privacyProfile = {
      vehicleId: primaryVehicle.id,
      registrationNumber: primaryVehicle.registrationNumber,
      make: primaryVehicle.make,
      model: primaryVehicle.model,
      displayName: rawProfile?.display_name || user.name || null,
      bloodGroup: rawProfile?.blood_group || null,
      medicalNotes: rawProfile?.medical_notes || null,
      showOwnerName: rawProfile ? rawProfile.show_owner_name === 1 : true,
      showBloodGroup: rawProfile ? rawProfile.show_blood_group === 1 : true,
      showMedicalNotes: rawProfile ? rawProfile.show_medical_notes === 1 : false,
      showVehicleDetails: rawProfile ? rawProfile.show_vehicle_details === 1 : true,
      publicId,
      previewUrl: publicId ? `https://qr.vaahansafe.com/${publicId}` : null,
    };
  }

  // 6. Security Activity (derive from real sessions & identities)
  const recentActivity: SecurityActivityItem[] = [];
  if (currentSessionItem) {
    recentActivity.push({
      id: "act_current",
      title: "Active Session Refresh",
      description: `${currentSessionItem.browser} on ${currentSessionItem.os}`,
      timestamp: currentSessionItem.lastSeenAt,
    });
  }
  if (googleIdentity?.createdAt) {
    recentActivity.push({
      id: "act_google",
      title: "Google Account Connected",
      description: googleIdentity.normalizedIdentifier || "OAuth 2.0 Identity",
      timestamp: googleIdentity.createdAt,
    });
  }
  if (user.createdAt) {
    recentActivity.push({
      id: "act_created",
      title: "VaahanSafe Account Established",
      description: "Verified Mobile Number Onboarded",
      timestamp: user.createdAt,
    });
  }

  return {
    user: {
      id: user.id,
      name: user.name || "Vehicle Owner",
      email: user.email || null,
      phone: user.phone || "",
      isMobileVerified: Boolean(user.phone),
      isEmailVerified: Boolean(user.email),
      avatarUrl: null,
      createdAt: user.createdAt,
      memberSince,
      safeAccountId,
      timezone: "Asia/Kolkata",
    },
    identities: identitiesData,
    sessions: {
      current: currentSessionItem,
      otherSessions: otherSessionItems,
    },
    notifications: notificationCategories,
    privacy: privacyProfile,
    vehicles: vehicleOptions,
    recentActivity,
  };
}
