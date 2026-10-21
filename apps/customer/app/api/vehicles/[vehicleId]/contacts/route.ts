import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomer } from "@/lib/session";
import {
  getAuthoritativeDatabaseClient,
  createInAppNotification,
} from "@vaahansafe/database";
import { normalizePhone } from "@/lib/contacts-service";

interface RouteParams {
  params: Promise<{
    vehicleId: string;
  }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await getAuthenticatedCustomer();
  if (!auth?.phoneVerified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { vehicleId } = await params;
  if (!vehicleId) {
    return NextResponse.json({ error: "Vehicle ID required" }, { status: 400 });
  }

  try {
    const db = getAuthoritativeDatabaseClient();

    // Authorize vehicle ownership
    const vehicle = await db.queryFirst<{
      id: string;
      registration_number: string;
    }>(
      `SELECT id, registration_number FROM vehicles WHERE id = ? AND user_id = ? AND status != 'DELETED'`,
      [vehicleId, auth.user.id],
    );

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vehicle not found or unauthorized" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const {
      contactId,
      name,
      relationship,
      phone,
      priority,
      allowCall,
      allowMessage,
      isEnabled,
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Contact name is required" },
        { status: 400 },
      );
    }

    if (!phone || typeof phone !== "string" || !phone.trim()) {
      return NextResponse.json(
        { error: "Contact phone number is required" },
        { status: 400 },
      );
    }

    const cleanedPhone = normalizePhone(phone);
    if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number" },
        { status: 400 },
      );
    }

    // Resolve or initialize emergency profile
    let profile = await db.queryFirst<{ id: string }>(
      `SELECT id FROM emergency_profiles WHERE vehicle_id = ? AND status = 'ACTIVE'`,
      [vehicleId],
    );

    const now = new Date().toISOString();

    if (!profile) {
      if (contactId)
        return NextResponse.json(
          {
            error:
              "This contact is no longer available. Please refresh and try again.",
          },
          { status: 404 },
        );
      const newProfileId = `ep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await db.execute(
        `INSERT INTO emergency_profiles (
           id, vehicle_id, display_name, show_owner_name, show_blood_group,
           show_medical_notes, show_vehicle_details, status, created_at, updated_at
         ) VALUES (?, ?, ?, 1, 1, 0, 1, 'ACTIVE', ?, ?)`,
        [newProfileId, vehicleId, auth.user.name || null, now, now],
      );
      profile = { id: newProfileId };
    }

    const validPriority =
      priority && Number(priority) >= 1 && Number(priority) <= 5
        ? Number(priority)
        : 1;

    const duplicate = await db.queryFirst<{ id: string }>(
      "SELECT id FROM emergency_contacts WHERE emergency_profile_id = ? AND right(regexp_replace(phone, '[^0-9]', '', 'g'), 10) = ? AND id <> ?",
      [
        profile.id,
        cleanedPhone,
        typeof contactId === "string" ? contactId : "",
      ],
    );
    if (duplicate)
      return NextResponse.json(
        {
          error:
            "This contact is already linked to this vehicle. Edit the existing contact to change its settings.",
        },
        { status: 409 },
      );

    if (contactId && typeof contactId === "string") {
      // Update existing contact
      const updated = await db.execute(
        `UPDATE emergency_contacts SET
           name = ?,
           relationship_label = ?,
           phone = ?,
           priority = ?,
           allow_call = ?,
           allow_message = ?,
           is_enabled = ?,
           updated_at = ?
         WHERE id = ? AND emergency_profile_id = ?`,
        [
          name.trim(),
          relationship ? String(relationship).trim() : "Emergency Contact",
          cleanedPhone,
          validPriority,
          allowCall !== false ? 1 : 0,
          allowMessage !== false ? 1 : 0,
          isEnabled !== false ? 1 : 0,
          now,
          contactId,
          profile.id,
        ],
      );
      if (updated.rowsAffected !== 1)
        return NextResponse.json(
          {
            error:
              "This contact is no longer available. Please refresh and try again.",
          },
          { status: 404 },
        );
    } else {
      // Insert new contact
      const count = await db.queryFirst<{ total: number }>(
        "SELECT count(*) AS total FROM emergency_contacts WHERE emergency_profile_id = ?",
        [profile.id],
      );
      if (Number(count?.total) >= 5)
        return NextResponse.json(
          {
            error:
              "This vehicle already has five contacts. Remove one before adding another.",
          },
          { status: 409 },
        );
      const newContactId = `cnt_${crypto.randomUUID()}`;
      await db.execute(
        `INSERT INTO emergency_contacts (
           id, emergency_profile_id, name, relationship_label, phone,
           priority, is_enabled, allow_call, allow_message, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newContactId,
          profile.id,
          name.trim(),
          relationship ? String(relationship).trim() : "Emergency Contact",
          cleanedPhone,
          validPriority,
          isEnabled !== false ? 1 : 0,
          allowCall !== false ? 1 : 0,
          allowMessage !== false ? 1 : 0,
          now,
          now,
        ],
      );
    }

    // In-App Notification: Emergency Contact Configured
    await createInAppNotification({
      userId: auth.user.id,
      eventType: "EMERGENCY_CONTACT_CONFIGURED",
      category: "SAFETY",
      title: "Emergency Contact Configured",
      body: `${name.trim()} (${relationship ? String(relationship).trim() : "Emergency Contact"}) was linked as a priority emergency relay for vehicle ${vehicle.registration_number}.`,
      actionType: "NONE",
      db,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Contacts API] Error saving contact:", err);
    return NextResponse.json(
      { error: "Failed to save emergency contact" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { vehicleId } = await params;
  if (!vehicleId) {
    return NextResponse.json({ error: "Vehicle ID required" }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contactId");

    if (!contactId) {
      return NextResponse.json(
        { error: "Contact ID required" },
        { status: 400 },
      );
    }

    const db = getAuthoritativeDatabaseClient();

    // Verify ownership of vehicle and that contact belongs to this vehicle's emergency profile
    const profile = await db.queryFirst<{ id: string }>(
      `SELECT p.id
       FROM emergency_profiles p
       INNER JOIN vehicles v ON p.vehicle_id = v.id
       WHERE v.id = ? AND v.user_id = ? AND v.status != 'DELETED'`,
      [vehicleId, auth.user.id],
    );

    if (!profile) {
      return NextResponse.json(
        { error: "Vehicle profile not found or unauthorized" },
        { status: 404 },
      );
    }

    await db.execute(
      `DELETE FROM emergency_contacts WHERE id = ? AND emergency_profile_id = ?`,
      [contactId, profile.id],
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Contacts API] Error deleting contact:", err);
    return NextResponse.json(
      { error: "Failed to delete emergency contact" },
      { status: 500 },
    );
  }
}
