import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "../../_auth";
import { getApiDatabase } from "../../_db";

export const dynamic = "force-dynamic";

interface AddressRow {
  id: string;
  user_id: string;
  recipient_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  postal_code: string;
  country_code: string;
  type: string;
  is_default: number;
  created_at: string;
  updated_at: string;
}

/**
 * Saved Addresses Endpoint (GET /v1/me/addresses, POST /v1/me/addresses)
 */
export async function GET(req: NextRequest) {
  const authOrResponse = await requireUserSession(req);
  if (authOrResponse instanceof NextResponse) {
    return authOrResponse;
  }

  const { user } = authOrResponse;
  const db = getApiDatabase();

  try {
    const addresses = await db.query<AddressRow>(
      `SELECT * FROM addresses 
       WHERE user_id = ? 
       ORDER BY is_default DESC, created_at DESC`,
      [user.id]
    );

    return NextResponse.json(
      {
        success: true,
        addresses: addresses.map((a) => ({
          id: a.id,
          recipientName: a.recipient_name,
          phone: a.phone,
          line1: a.line1,
          line2: a.line2,
          landmark: a.landmark,
          city: a.city,
          state: a.state,
          postalCode: a.postal_code,
          countryCode: a.country_code,
          type: a.type,
          isDefault: a.is_default === 1,
          createdAt: a.created_at,
        })),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[ApiAddressesGet] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load addresses", code: "ERR_LOAD_ADDRESSES" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authOrResponse = await requireUserSession(req);
  if (authOrResponse instanceof NextResponse) {
    return authOrResponse;
  }

  const { user } = authOrResponse;
  const body = await req.json().catch(() => ({}));

  const {
    recipientName,
    phone,
    line1,
    line2,
    landmark,
    city,
    state,
    postalCode,
    isDefault,
  } = body || {};

  if (!recipientName || !phone || !line1 || !city || !state || !postalCode) {
    return NextResponse.json(
      { success: false, error: "Missing required address fields", code: "ERR_VALIDATION" },
      { status: 400 }
    );
  }

  const db = getApiDatabase();
  const addressId = `addr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  try {
    if (isDefault) {
      await db.execute(
        "UPDATE addresses SET is_default = 0, updated_at = ? WHERE user_id = ?",
        [now, user.id]
      );
    }

    await db.execute(
      `INSERT INTO addresses (
        id, user_id, recipient_name, phone, line1, line2, landmark,
        city, state, postal_code, country_code, type, is_default, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'IN', 'SHIPPING', ?, ?, ?)`,
      [
        addressId,
        user.id,
        String(recipientName).trim(),
        String(phone).trim(),
        String(line1).trim(),
        line2 ? String(line2).trim() : null,
        landmark ? String(landmark).trim() : null,
        String(city).trim(),
        String(state).trim(),
        String(postalCode).trim(),
        isDefault ? 1 : 0,
        now,
        now,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        address: {
          id: addressId,
          recipientName,
          phone,
          line1,
          line2,
          landmark,
          city,
          state,
          postalCode,
          countryCode: "IN",
          type: "SHIPPING",
          isDefault: Boolean(isDefault),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[ApiAddressesPost] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save address", code: "ERR_SAVE_ADDRESS" },
      { status: 500 }
    );
  }
}
