import { getSupabaseAdminClient } from "@vaahansafe/database";
import { adminResponse, adminFailure } from "../../../../lib/api";
import {
  requireAdmin,
  assertSameOrigin,
  AdminError,
} from "../../../../lib/session";
import { parseOfflineQrCsv } from "../../../../lib/offline-qr-csv";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin("inventory");
    if (!["SUPER_ADMIN", "OPS_ADMIN"].includes(identity.role))
      throw new AdminError(
        403,
        "FORBIDDEN",
        "Your role cannot import inventory.",
      );
    if (Number(request.headers.get("content-length") || 0) > 1_100_000)
      throw new AdminError(
        413,
        "FILE_TOO_LARGE",
        "Choose a CSV smaller than 1 MB.",
      );
    const form = await request.formData();
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      !file.name.toLowerCase().endsWith(".csv") ||
      file.size > 1_000_000
    )
      throw new AdminError(
        400,
        "INVALID_FILE",
        "Choose an offline batch CSV smaller than 1 MB.",
      );
    const bytes = await file.arrayBuffer();
    let parsed: ReturnType<typeof parseOfflineQrCsv>;
    try {
      parsed = parseOfflineQrCsv(new TextDecoder().decode(bytes));
    } catch (error) {
      throw new AdminError(400, "INVALID_BATCH", (error as Error).message);
    }
    const checksum = Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    )
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const { data, error } = await getSupabaseAdminClient().rpc(
      "admin_import_offline_qr_batch",
      {
        p_session: identity.sessionId,
        p_reference: parsed.reference,
        p_rows: parsed.rows,
        p_checksum: checksum,
        p_request: crypto.randomUUID(),
        p_preview: form.get("confirmed") !== "true",
      },
    );
    if (error?.message?.includes("BATCH_CONFLICT") || error?.code === "23505")
      throw new AdminError(
        409,
        "BATCH_CONFLICT",
        "These IDs or this batch reference already exist. No records were changed.",
      );
    if (error) throw error;
    return adminResponse(data);
  } catch (error) {
    return adminFailure(error);
  }
}
