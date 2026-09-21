import { NextResponse } from "next/server";
import {
  authorizePrivateDownload,
  getSafeDownloadHeaders,
  StorageError,
} from "@vaahansafe/storage";
import { getMediaAssetRepository, getObjectStoreForBucket } from "../../_helpers";

export async function GET(
  req: Request,
  props: { params: Promise<{ assetId: string }> }
) {
  try {
    const { assetId } = await props.params;
    const url = new URL(req.url);

    // Extract actor credentials from headers or query parameters
    const actorId =
      req.headers.get("x-actor-id") ||
      url.searchParams.get("actorId") ||
      "anonymous";
    const actorRole =
      req.headers.get("x-actor-role") ||
      url.searchParams.get("actorRole") ||
      "GUEST";

    const dispositionParam = url.searchParams.get("disposition");
    const disposition = dispositionParam === "inline" ? "inline" : "attachment";

    const mediaRepo = getMediaAssetRepository();

    // 1. Authorize private download (IDOR & role check)
    const asset = await authorizePrivateDownload({
      assetId,
      actor: { id: actorId, role: actorRole },
      mediaRepo,
      entityOwnershipCheck: (_type, ownerId, actId) => {
        // In local/test environment, matching IDs are authorized
        return ownerId === actId;
      },
    });

    // 2. Fetch object bytes/stream from R2
    const objectStore = getObjectStoreForBucket(asset.bucket);
    const object = await objectStore.get(asset.objectKey);

    if (!object) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "OBJECT_NOT_FOUND",
            message: "Binary object not found in storage bucket.",
          },
        },
        { status: 404 }
      );
    }

    // 3. Generate safe HTTP response headers
    const headers = getSafeDownloadHeaders({
      mimeType: asset.mimeType,
      filename: asset.originalFilename,
      disposition,
      visibility: asset.visibility,
      status: asset.status,
      bucket: asset.bucket,
      contentLength: object.meta.size,
    });

    // 4. Stream response
    return new Response(object.data as BodyInit, {
      status: 200,
      headers,
    });
  } catch (err: unknown) {
    if (err instanceof StorageError) {
      const statusCode =
        err.code === "ASSET_NOT_FOUND"
          ? 404
          : err.code === "PRIVATE_ACCESS_DENIED" || err.code === "ASSET_QUARANTINED"
          ? 403
          : 400;

      return NextResponse.json(
        {
          success: false,
          error: {
            code: err.code,
            message: err.message,
          },
        },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to download asset.",
        },
      },
      { status: 500 }
    );
  }
}
