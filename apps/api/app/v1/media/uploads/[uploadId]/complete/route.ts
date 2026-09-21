import { NextResponse } from "next/server";
import { completeUpload, StorageError } from "@vaahansafe/storage";
import { getMediaAssetRepository, getObjectStoreForBucket } from "../../../_helpers";

export async function POST(
  req: Request,
  props: { params: Promise<{ uploadId: string }> }
) {
  try {
    const { uploadId } = await props.params;
    const body = await req.json();

    const mediaRepo = getMediaAssetRepository();
    const asset = await mediaRepo.findById(uploadId);
    if (!asset) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ASSET_NOT_FOUND",
            message: `Asset ${uploadId} was not found.`,
          },
        },
        { status: 404 }
      );
    }

    const objectStore = getObjectStoreForBucket(asset.bucket);

    let magicBytes: Uint8Array | undefined;
    if (body.magicBytesBase64) {
      const binaryStr = atob(body.magicBytesBase64);
      magicBytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        magicBytes[i] = binaryStr.charCodeAt(i);
      }
    }

    const completed = await completeUpload(
      {
        assetId: uploadId,
        actor: body.actor,
        actualSizeBytes: body.actualSizeBytes,
        sha256: body.sha256,
        magicBytes,
        width: body.width,
        height: body.height,
      },
      mediaRepo,
      objectStore
    );

    return NextResponse.json({
      success: true,
      data: completed,
    });
  } catch (err: unknown) {
    if (err instanceof StorageError) {
      const statusCode =
        err.code === "ASSET_NOT_FOUND"
          ? 404
          : err.code === "UPLOAD_NOT_AUTHORIZED" || err.code === "PRIVATE_ACCESS_DENIED"
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
          message: "Failed to complete upload.",
        },
      },
      { status: 500 }
    );
  }
}
