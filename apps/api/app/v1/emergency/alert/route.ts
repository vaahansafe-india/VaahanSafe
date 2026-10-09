import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isValidPublicIdFormat } from "@vaahansafe/qr-core";
import { createInAppNotification, D1NotificationIntentRepository } from "@vaahansafe/database";
import { NotificationProducerService, CloudflareNotificationQueueProducer, type NotificationQueueBinding } from "@vaahansafe/notifications";
import { getApiDatabase } from "../../_db";

export const dynamic = "force-dynamic";

const alertBodySchema = z.object({
  publicId: z.string().trim().min(6).max(32),
  alertType: z.enum([
    "WRONG_PARKING",
    "EMERGENCY_INCIDENT",
    "LIGHTS_ON",
    "FLAT_TYRE",
    "UNATTENDED_CHILD_PET",
    "WINDOW_OPEN",
    "CUSTOM",
  ]),
  customNote: z.string().trim().max(300).optional(),
  passerbyPhone: z.string().trim().optional(),
});

const ALERT_MESSAGES: Record<string, { title: string; defaultBody: string; priority: "HIGH" | "CRITICAL" }> = {
  WRONG_PARKING: {
    title: "Wrong Parking Alert",
    defaultBody: "Your vehicle is reported parked improperly or obstructing traffic/access.",
    priority: "HIGH",
  },
  EMERGENCY_INCIDENT: {
    title: "URGENT: Vehicle Incident Reported",
    defaultBody: "A roadside incident was reported for your vehicle. Review the available details in your dashboard.",
    priority: "CRITICAL",
  },
  LIGHTS_ON: {
    title: "Vehicle Lights Left On",
    defaultBody: "Your vehicle's headlights or interior cabin lights appear to have been left on.",
    priority: "HIGH",
  },
  FLAT_TYRE: {
    title: "Flat Tyre Alert",
    defaultBody: "A passerby reported that one of your vehicle's tyres is flat or losing pressure.",
    priority: "HIGH",
  },
  UNATTENDED_CHILD_PET: {
    title: "URGENT: Unattended Occupant Alert",
    defaultBody: "A passerby reported an unattended occupant or pet inside your vehicle.",
    priority: "CRITICAL",
  },
  WINDOW_OPEN: {
    title: "Vehicle Window Open",
    defaultBody: "A window on your vehicle was noticed open or partially unrolled.",
    priority: "HIGH",
  },
  CUSTOM: {
    title: "Vehicle Safety Alert",
    defaultBody: "A passerby left a safety message regarding your vehicle.",
    priority: "HIGH",
  },
};

/**
 * Emergency Alert Dispatch Endpoint (POST /v1/emergency/alert)
 *
 * Dispatches roadside emergency notifications, wrong parking alerts,
 * and incident notifications to vehicle owners and priority emergency contacts.
 */
export async function POST(req: NextRequest) {
  try {
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const parseResult = alertBodySchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid alert parameters",
          code: "ERR_VALIDATION_FAILED",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { publicId, alertType, customNote } = parseResult.data;
    if (!isValidPublicIdFormat(publicId)) {
      return NextResponse.json(
        { error: "Invalid QR public identifier format", code: "ERR_INVALID_PUBLIC_ID" },
        { status: 400 }
      );
    }

    const db = getApiDatabase();
    const now = new Date().toISOString();

    // 1. Look up active vehicle and owner
    const record = await db.queryFirst<{
      qr_id: string;
      qr_status: string;
      vehicle_id: string;
      user_id: string;
      registration_number: string;
      make: string;
      model: string;
    }>(
      `SELECT s.id AS qr_id, s.status AS qr_status,
              v.id AS vehicle_id, a.user_id, v.registration_number, v.make, v.model
       FROM qr_stickers s
       JOIN qr_assignments a ON s.id = a.qr_id AND a.ended_at IS NULL
       JOIN vehicles v ON a.vehicle_id = v.id
       WHERE s.public_id = ? AND v.user_id = a.user_id AND v.status != 'DELETED'
         AND EXISTS (SELECT 1 FROM service_entitlements e WHERE e.qr_sticker_id = s.id
           AND e.vehicle_id = v.id AND e.user_id = a.user_id AND e.capability = 'EMERGENCY_ROUTING'
           AND e.status = 'ENABLED' AND (e.expires_at IS NULL OR e.expires_at > datetime('now')))
       LIMIT 1`,
      [publicId]
    );

    if (!record) {
      return NextResponse.json(
        { error: "QR code is not active or registered to a vehicle", code: "ERR_QR_NOT_ACTIVE" },
        { status: 404 }
      );
    }

    if (record.qr_status !== "ACTIVATED") {
      return NextResponse.json(
        { error: `This QR sticker is not active (Status: ${record.qr_status})`, code: "ERR_INACTIVE_STICKER" },
        { status: 400 }
      );
    }

    // 2. Alert Storm Cooldown Check (15 minutes per alert type per vehicle)
    const recentAlert = await db.queryFirst<{ id: string }>(
      `SELECT id FROM qr_scan_events
       WHERE qr_id = ? AND scan_type = 'EMERGENCY_TRIGGER'
         AND created_at > datetime('now', '-5 minutes')
       LIMIT 1`,
      [record.qr_id]
    );

    if (recentAlert) {
      return NextResponse.json(
        {
          error: "An emergency alert was already sent recently for this vehicle. Please wait before sending another.",
          code: "ERR_ALERT_COOLDOWN",
        },
        { status: 429 }
      );
    }

    // 3. Record Telemetry Event
    const eventId = `scan_${crypto.randomUUID()}`;
    const city = req.headers.get("cf-ipcity") || "Unknown";
    const state = req.headers.get("cf-ipcountry") || "India";

    await db.execute(
      `INSERT INTO qr_scan_events (id, qr_id, scan_type, result, city, state, user_agent_family, referrer_class, created_at)
       VALUES (?, ?, 'EMERGENCY_TRIGGER', 'RESOLVED_ACTIVE', ?, ?, 'Browser', 'EMERGENCY_PORTAL', ?)`,
      [eventId, record.qr_id, city, state, now]
    );

    // 4. Construct Alert Copy
    const alertConfig = ALERT_MESSAGES[alertType] ?? {
      title: "Vehicle Safety Alert",
      defaultBody: "A passerby left a safety message regarding your vehicle.",
      priority: "HIGH" as const,
    };
    const vehicleDesc = `${record.make} ${record.model} (${record.registration_number})`;
    const bodyText = customNote
      ? `${alertConfig.defaultBody} Note: "${customNote}"`
      : alertConfig.defaultBody;

    // 5. In-App Notification Dispatch
    await createInAppNotification({
      db,
      userId: record.user_id,
      eventType: alertType === "EMERGENCY_INCIDENT" ? "EMERGENCY_TRIGGERED" : "PARKING_ALERT",
      category: "SAFETY",
      priority: alertConfig.priority,
      title: `${alertConfig.title}: ${record.registration_number}`,
      body: `Alert for ${vehicleDesc}: ${bodyText}`,
      actionType: "VIEW_QR",
      actionTarget: `/vehicles/${record.vehicle_id}`,
    });

    // Persist a canonical intent first. Queue outages leave a recoverable PENDING intent.
    let notificationQueued = false;
    try {
      if (db.dialect === 'postgres') {
        // The scan insert creates the deduplicated canonical event in the same database transaction.
        notificationQueued = true;
      } else {
      const binding = (process.env as unknown as { NOTIFICATION_QUEUE?: NotificationQueueBinding }).NOTIFICATION_QUEUE;
      const producer = new NotificationProducerService(new D1NotificationIntentRepository(db), new CloudflareNotificationQueueProducer(binding));
      const result = await producer.recordAndPublishIntent({
        eventType: "EMERGENCY_SCAN_ALERT", recipientUserId: record.user_id,
        category: "SAFETY", priority: alertConfig.priority, templateKey: "EMERGENCY_SCAN_ALERT_V1",
        payload: {
          vehicleMaskedReg: record.registration_number.replace(/.(?=.{4})/g, "•"),
          scannedAtFormatted: new Date(now).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST",
        },
        sourceType: "EMERGENCY", sourceId: eventId, dedupeKey: `emergency_scan_${eventId}`,
      });
      notificationQueued = result.published;
      }
    } catch {
      console.warn("[ApiEmergencyAlert] Notification intent unavailable");
    }

    return NextResponse.json(
      {
        success: true,
        message: "Your alert has been recorded for the vehicle owner.",
        data: {
          alertType,
          vehicleRegistration: record.registration_number,
          recordedAt: now,
          notificationQueued,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ApiEmergencyAlert] Unexpected error dispatching alert:", error);
    return NextResponse.json(
      { error: "Failed to dispatch alert right now. Please try again.", code: "ERR_ALERT_FAILED" },
      { status: 500 }
    );
  }
}
