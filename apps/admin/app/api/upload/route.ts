import { getSupabaseAdminClient } from "@vaahansafe/database";
import { getAuthoritativeObjectStore } from "@vaahansafe/storage";
import {
  requireAdmin,
  assertSameOrigin,
  AdminError,
} from "../../../lib/session";
import { adminResponse, adminFailure } from "../../../lib/api";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin("gallery");
    if (!["SUPER_ADMIN", "CONTENT_EDITOR"].includes(identity.role))
      throw new AdminError(403, "FORBIDDEN", "Your role cannot upload media.");
    const length = Number(request.headers.get("content-length"));
    if (length > 11 * 1024 * 1024)
      throw new AdminError(
        413,
        "FILE_TOO_LARGE",
        "Choose an image smaller than 10 MB.",
      );
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File))
      throw new AdminError(400, "FILE_REQUIRED", "Choose an image to upload.");
    const types: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/avif": "avif",
      "image/gif": "gif",
    };
    const ext = types[file.type];
    if (!ext || file.size > 10 * 1024 * 1024 || file.size < 12)
      throw new AdminError(
        400,
        "INVALID_FILE",
        "Choose a JPEG, PNG, WebP, AVIF or GIF image smaller than 10 MB.",
      );
    const bytes = new Uint8Array(await file.arrayBuffer());
    const ascii = (start: number, end: number) =>
      String.fromCharCode(...bytes.slice(start, end));
    const signatures: Record<string, boolean> = {
      "image/jpeg": bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255,
      "image/png": bytes[0] === 137 && ascii(1, 4) === "PNG",
      "image/webp": ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP",
      "image/avif": ascii(4, 8) === "ftyp" && ascii(8, 32).includes("avif"),
      "image/gif": ascii(0, 3) === "GIF",
    };
    if (!signatures[file.type])
      throw new AdminError(
        400,
        "INVALID_FILE",
        "The image format does not match the uploaded file.",
      );
    const base = process.env.NEXT_PUBLIC_ASSETS_URL;
    if (!base) throw new Error("Asset delivery unconfigured");
    const key = `blog/editorial/${crypto.randomUUID()}.${ext}`;
    const db = getSupabaseAdminClient();
    const requestId = crypto.randomUUID();
    const audit = {
      actor_id: identity.id,
      resource_type: "media",
      resource_id: key,
      reason: "Authorized editorial media upload",
      request_id: requestId,
      before_summary: {},
    };
    const { error: intentError } = await db
      .from("admin_audit_logs")
      .insert({
        ...audit,
        action: "UPLOAD_REQUEST",
        after_summary: { mimeType: file.type, sizeBytes: file.size },
      });
    if (intentError) throw intentError;
    const store = getAuthoritativeObjectStore("PUBLIC");
    await store.put(key, bytes, { contentType: file.type });
    const url = `${base.replace(/\/$/, "")}/${key}`;
    const { error: assetError } = await db
      .from("media_assets")
      .insert({
        bucket: "PUBLIC",
        object_key: key,
        owner_type: "SYSTEM",
        owner_id: crypto.randomUUID(),
        visibility: "PUBLIC",
        mime_type: file.type,
        size_bytes: file.size,
        status: "READY",
        original_filename: file.name.slice(0, 200),
        public_url: url,
        ready_at: new Date().toISOString(),
        alt_text: "",
      });
    if (assetError) throw assetError;
    const { error: auditError } = await db
      .from("admin_audit_logs")
      .insert({
        ...audit,
        action: "UPLOAD_COMPLETE",
        after_summary: { key, sizeBytes: file.size },
      });
    if (auditError) throw auditError;
    return adminResponse({
      key,
      url,
      cdnUrl: url,
      sizeBytes: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    return adminFailure(error);
  }
}
