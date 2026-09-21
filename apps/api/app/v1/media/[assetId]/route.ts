import { NextResponse } from "next/server";
import { getPublicAssetUrl, getCacheControlHeader } from "@vaahansafe/storage";
import { getMediaAssetRepository } from "../_helpers";

export async function GET(
  _req: Request,
  props: { params: Promise<{ assetId: string }> }
) {
  const { assetId } = await props.params;
  const mediaRepo = getMediaAssetRepository();

  const asset = await mediaRepo.findById(assetId);

  // Invariant 09: Only PUBLIC + READY assets may be returned publicly
  if (!asset || asset.status !== "READY" || asset.visibility !== "PUBLIC") {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "ASSET_NOT_FOUND",
          message: "Asset not found or not publicly accessible.",
        },
      },
      {
        status: 404,
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
        },
      }
    );
  }

  const publicUrl = getPublicAssetUrl(asset);
  const cacheControl = getCacheControlHeader({
    visibility: asset.visibility,
    status: asset.status,
    bucket: asset.bucket,
  });

  return NextResponse.json(
    {
      success: true,
      data: {
        id: asset.id,
        bucket: asset.bucket,
        objectKey: asset.objectKey,
        publicUrl,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        width: asset.width,
        height: asset.height,
        altText: asset.altText,
        createdAt: asset.createdAt,
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": cacheControl,
      },
    }
  );
}
