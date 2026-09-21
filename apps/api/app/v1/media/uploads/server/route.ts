import { NextResponse } from "next/server";
import { serverUpload, getUploadPolicy, StorageError } from "@vaahansafe/storage";
import { getMediaAssetRepository, getObjectStoreForBucket } from "../../_helpers";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.dataBase64) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "dataBase64 is required for server-mediated upload.",
          },
        },
        { status: 400 }
      );
    }

    const binaryStr = atob(body.dataBase64);
    const data = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      data[i] = binaryStr.charCodeAt(i);
    }

    const policy = getUploadPolicy(body.purpose);
    const mediaRepo = getMediaAssetRepository();
    const objectStore = getObjectStoreForBucket(policy.bucket);

    const asset = await serverUpload(
      {
        actor: body.actor,
        purpose: body.purpose,
        ownerType: body.ownerType,
        ownerId: body.ownerId,
        filename: body.filename,
        mimeType: body.mimeType,
        data,
        altText: body.altText,
        sha256: body.sha256,
        width: body.width,
        height: body.height,
      },
      mediaRepo,
      objectStore
    );

    return NextResponse.json({
      success: true,
      data: asset,
    });
  } catch (err: unknown) {
    if (err instanceof StorageError) {
      const statusCode =
        err.code === "UPLOAD_NOT_AUTHORIZED" || err.code === "PRIVATE_ACCESS_DENIED"
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
          message: "Server-mediated upload failed.",
        },
      },
      { status: 500 }
    );
  }
}
