import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "../../../_auth";
import { getApiDatabase } from "../../../_db";

export const dynamic = "force-dynamic";

/**
 * Delete Saved Address (DELETE /v1/me/addresses/:id)
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authOrResponse = await requireUserSession(req);
  if (authOrResponse instanceof NextResponse) {
    return authOrResponse;
  }

  const { user } = authOrResponse;
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Address ID required", code: "ERR_INVALID_ID" },
      { status: 400 }
    );
  }

  const db = getApiDatabase();

  try {
    const res = await db.execute(
      "DELETE FROM addresses WHERE id = ? AND user_id = ?",
      [id, user.id]
    );

    if ((res.rowsAffected ?? 0) === 0) {
      return NextResponse.json(
        { success: false, error: "Address not found or not owned by user", code: "ERR_NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Address deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ApiAddressDelete] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete address", code: "ERR_DELETE_FAILED" },
      { status: 500 }
    );
  }
}
