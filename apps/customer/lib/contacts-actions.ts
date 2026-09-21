"use server";

import { revalidatePath } from "next/cache";
import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import { getAuthenticatedCustomer } from "@/lib/session";
import type {
  AddContactInput,
  UpdateContactInput,
  PublicSafetyPreviewData,
} from "./contacts-types";
import { getPublicSafetyPreview, normalizePhone } from "./contacts-service";

interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Add a new Safety Contact to one or more user-owned vehicles.
 */
export async function addSafetyContactAction(
  input: AddContactInput
): Promise<ActionResult> {
  try {
    const auth = await getAuthenticatedCustomer();
    if (!auth) {
      return { success: false, error: "Please sign in to manage safety contacts." };
    }

    if (!input.name || !input.name.trim()) {
      return { success: false, error: "Please enter the contact's full name." };
    }

    const normPhone = normalizePhone(input.phone);
    if (!normPhone || normPhone.length < 10) {
      return { success: false, error: "Please provide a valid 10-digit mobile number." };
    }

    if (!input.vehicleIds || input.vehicleIds.length === 0) {
      return { success: false, error: "Please select at least one vehicle to associate this contact with." };
    }

    const db = getAuthoritativeDatabaseClient();

    // Verify user owns all requested vehicles
    const placeholders = input.vehicleIds.map(() => "?").join(",");
    const authorizedVehicles = await db.query<{ id: string }>(
      `SELECT id FROM vehicles WHERE id IN (${placeholders}) AND user_id = ? AND status != 'DELETED'`,
      [...input.vehicleIds, auth.user.id]
    );

    if (authorizedVehicles.length === 0) {
      return { success: false, error: "No authorized vehicles selected." };
    }

    const authorizedIds = new Set(authorizedVehicles.map((v) => v.id));
    const now = new Date().toISOString();
    const relLabel = input.relationshipLabel?.trim() || "Emergency Contact";
    const isPublic = input.isPubliclyAvailable !== false ? 1 : 0;
    const priority = input.isPrimary ? 1 : 2;

    for (const vehicleId of input.vehicleIds) {
      if (!authorizedIds.has(vehicleId)) continue;

      // 1. Resolve or create emergency profile
      let profile = await db.queryFirst<{ id: string }>(
        `SELECT id FROM emergency_profiles WHERE vehicle_id = ? AND status = 'ACTIVE'`,
        [vehicleId]
      );

      if (!profile) {
        const newProfileId = `ep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        await db.execute(
          `INSERT INTO emergency_profiles (
             id, vehicle_id, display_name, show_owner_name, show_blood_group,
             show_medical_notes, show_vehicle_details, status, created_at, updated_at
           ) VALUES (?, ?, ?, 1, 1, 0, 1, 'ACTIVE', ?, ?)`,
          [newProfileId, vehicleId, auth.user.name || null, now, now]
        );
        profile = { id: newProfileId };
      }

      // If adding as primary, demote existing primary contacts on this vehicle
      if (input.isPrimary) {
        await db.execute(
          `UPDATE emergency_contacts SET priority = 2, updated_at = ? WHERE emergency_profile_id = ? AND priority = 1`,
          [now, profile.id]
        );
      }

      // 2. Insert new contact record
      const newContactId = `cnt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await db.execute(
        `INSERT INTO emergency_contacts (
           id, emergency_profile_id, name, relationship_label, phone,
           priority, is_enabled, allow_call, allow_message, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)`,
        [
          newContactId,
          profile.id,
          input.name.trim(),
          relLabel,
          normPhone,
          priority,
          isPublic,
          now,
          now,
        ]
      );
    }

    revalidatePath("/emergency-contacts");
    return { success: true };
  } catch (err) {
    console.error("[addSafetyContactAction] Error:", err);
    return {
      success: false,
      error: "We couldn't add this safety contact right now. Please try again.",
    };
  }
}

/**
 * Server Action: Update an existing Safety Contact's details, relationship, or associations.
 */
export async function updateSafetyContactAction(
  input: UpdateContactInput
): Promise<ActionResult> {
  try {
    const auth = await getAuthenticatedCustomer();
    if (!auth) {
      return { success: false, error: "Please sign in to update safety contacts." };
    }

    if (!input.name || !input.name.trim()) {
      return { success: false, error: "Please enter the contact's full name." };
    }

    const normPhone = normalizePhone(input.phone);
    if (!normPhone || normPhone.length < 10) {
      return { success: false, error: "Please provide a valid 10-digit mobile number." };
    }

    const db = getAuthoritativeDatabaseClient();

    // Verify contact belongs to an emergency profile of a vehicle owned by auth.user
    const existingContact = await db.queryFirst<{
      id: string;
      emergency_profile_id: string;
      phone: string;
      name: string;
    }>(
      `SELECT c.id, c.emergency_profile_id, c.phone, c.name
       FROM emergency_contacts c
       INNER JOIN emergency_profiles p ON c.emergency_profile_id = p.id
       INNER JOIN vehicles v ON p.vehicle_id = v.id
       WHERE c.id = ? AND v.user_id = ? AND v.status != 'DELETED'`,
      [input.contactId, auth.user.id]
    );

    if (!existingContact) {
      return { success: false, error: "Safety contact not found or unauthorized." };
    }

    const now = new Date().toISOString();
    const relLabel = input.relationshipLabel?.trim() || "Emergency Contact";
    const isPublic = input.isPubliclyAvailable !== false ? 1 : 0;
    const priority = input.isPrimary ? 1 : 2;

    // Update all matching contact records for this user (same phone/name)
    const existingPhone = normalizePhone(existingContact.phone);

    await db.execute(
      `UPDATE emergency_contacts
       SET name = ?, relationship_label = ?, phone = ?, updated_at = ?
       WHERE id IN (
         SELECT c.id
         FROM emergency_contacts c
         INNER JOIN emergency_profiles p ON c.emergency_profile_id = p.id
         INNER JOIN vehicles v ON p.vehicle_id = v.id
         WHERE (c.id = ? OR c.phone = ?) AND v.user_id = ?
       )`,
      [input.name.trim(), relLabel, normPhone, now, input.contactId, existingPhone, auth.user.id]
    );

    // If isPrimary was set, update primary priority on vehicle
    if (input.isPrimary) {
      await db.execute(
        `UPDATE emergency_contacts SET priority = 1, updated_at = ? WHERE id = ?`,
        [now, input.contactId]
      );
    }

    // Update public view setting
    await db.execute(
      `UPDATE emergency_contacts SET is_enabled = ?, updated_at = ? WHERE id = ?`,
      [isPublic, now, input.contactId]
    );

    revalidatePath("/emergency-contacts");
    return { success: true };
  } catch (err) {
    console.error("[updateSafetyContactAction] Error:", err);
    return {
      success: false,
      error: "We couldn't update this safety contact right now. Please try again.",
    };
  }
}

/**
 * Server Action: Toggle public safety view visibility for a contact.
 */
export async function toggleContactVisibilityAction(
  contactId: string,
  isEnabled: boolean
): Promise<ActionResult> {
  try {
    const auth = await getAuthenticatedCustomer();
    if (!auth) {
      return { success: false, error: "Please sign in to update visibility." };
    }

    const db = getAuthoritativeDatabaseClient();

    // Verify contact belongs to user
    const contact = await db.queryFirst<{ id: string }>(
      `SELECT c.id
       FROM emergency_contacts c
       INNER JOIN emergency_profiles p ON c.emergency_profile_id = p.id
       INNER JOIN vehicles v ON p.vehicle_id = v.id
       WHERE c.id = ? AND v.user_id = ? AND v.status != 'DELETED'`,
      [contactId, auth.user.id]
    );

    if (!contact) {
      return { success: false, error: "Contact not found or unauthorized." };
    }

    const now = new Date().toISOString();
    await db.execute(
      `UPDATE emergency_contacts SET is_enabled = ?, updated_at = ? WHERE id = ?`,
      [isEnabled ? 1 : 0, now, contactId]
    );

    revalidatePath("/emergency-contacts");
    return { success: true };
  } catch (err) {
    console.error("[toggleContactVisibilityAction] Error:", err);
    return {
      success: false,
      error: "We couldn't update safety-view preference. Please try again.",
    };
  }
}

/**
 * Server Action: Designate a contact as the primary safety contact.
 */
export async function setPrimaryContactAction(
  contactId: string
): Promise<ActionResult> {
  try {
    const auth = await getAuthenticatedCustomer();
    if (!auth) {
      return { success: false, error: "Please sign in to change primary contact." };
    }

    const db = getAuthoritativeDatabaseClient();

    const contact = await db.queryFirst<{
      id: string;
      emergency_profile_id: string;
    }>(
      `SELECT c.id, c.emergency_profile_id
       FROM emergency_contacts c
       INNER JOIN emergency_profiles p ON c.emergency_profile_id = p.id
       INNER JOIN vehicles v ON p.vehicle_id = v.id
       WHERE c.id = ? AND v.user_id = ? AND v.status != 'DELETED'`,
      [contactId, auth.user.id]
    );

    if (!contact) {
      return { success: false, error: "Contact not found or unauthorized." };
    }

    const now = new Date().toISOString();

    // Demote any current primary contacts in this profile
    await db.execute(
      `UPDATE emergency_contacts SET priority = 2, updated_at = ? WHERE emergency_profile_id = ? AND priority = 1`,
      [now, contact.emergency_profile_id]
    );

    // Promote selected contact
    await db.execute(
      `UPDATE emergency_contacts SET priority = 1, updated_at = ? WHERE id = ?`,
      [now, contactId]
    );

    revalidatePath("/emergency-contacts");
    return { success: true };
  } catch (err) {
    console.error("[setPrimaryContactAction] Error:", err);
    return {
      success: false,
      error: "We couldn't set this contact as primary. Please try again.",
    };
  }
}

/**
 * Server Action: Remove a safety contact from the user's vehicles.
 * Does NOT delete vehicles, accounts, or scan event history.
 */
export async function removeSafetyContactAction(
  contactId: string
): Promise<ActionResult> {
  try {
    const auth = await getAuthenticatedCustomer();
    if (!auth) {
      return { success: false, error: "Please sign in to remove contacts." };
    }

    const db = getAuthoritativeDatabaseClient();

    const contact = await db.queryFirst<{
      id: string;
      emergency_profile_id: string;
      phone: string;
      name: string;
    }>(
      `SELECT c.id, c.emergency_profile_id, c.phone, c.name
       FROM emergency_contacts c
       INNER JOIN emergency_profiles p ON c.emergency_profile_id = p.id
       INNER JOIN vehicles v ON p.vehicle_id = v.id
       WHERE c.id = ? AND v.user_id = ? AND v.status != 'DELETED'`,
      [contactId, auth.user.id]
    );

    if (!contact) {
      return { success: false, error: "Contact not found or unauthorized." };
    }

    const normPhone = normalizePhone(contact.phone);

    // Remove all instances of this contact for this owner across profiles
    await db.execute(
      `DELETE FROM emergency_contacts
       WHERE id IN (
         SELECT c.id
         FROM emergency_contacts c
         INNER JOIN emergency_profiles p ON c.emergency_profile_id = p.id
         INNER JOIN vehicles v ON p.vehicle_id = v.id
         WHERE (c.id = ? OR (c.phone = ? AND c.name = ?)) AND v.user_id = ?
       )`,
      [contactId, normPhone, contact.name, auth.user.id]
    );

    revalidatePath("/emergency-contacts");
    return { success: true };
  } catch (err) {
    console.error("[removeSafetyContactAction] Error:", err);
    return {
      success: false,
      error: "We couldn't remove this contact. Please try again.",
    };
  }
}

/**
 * Server Action: Fetch public safety projection preview for a vehicle.
 */
export async function fetchPublicSafetyPreviewAction(
  vehicleId: string
): Promise<ActionResult<PublicSafetyPreviewData>> {
  try {
    const auth = await getAuthenticatedCustomer();
    if (!auth) {
      return { success: false, error: "Unauthorized" };
    }

    const data = await getPublicSafetyPreview(auth.user.id, vehicleId);
    if (!data) {
      return { success: false, error: "Vehicle safety profile not found." };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[fetchPublicSafetyPreviewAction] Error:", err);
    return {
      success: false,
      error: "We couldn't generate the public preview. Please try again.",
    };
  }
}
