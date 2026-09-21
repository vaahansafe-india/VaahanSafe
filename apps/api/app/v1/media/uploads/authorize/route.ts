import { NextResponse } from "next/server";
import { authorizeDirectUpload, StorageError } from "@vaahansafe/storage";
import { getMediaAssetRepository } from "../../_helpers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const mediaRepo = getMediaAssetRepository();

    const ticket = await authorizeDirectUpload(
      {
        actor: body.actor,
        purpose: body.purpose,
        ownerType: body.ownerType,
        ownerId: body.ownerId,
        filename: body.filename,
        mimeType: body.mimeType,
        sizeBytes: body.sizeBytes,
        sha256: body.sha256,
        altText: body.altText,
      },
      mediaRepo
    );

    return NextResponse.json({
      success: true,
      data: ticket,
    });
  } catch (err: unknown) {
    if (err instanceof StorageError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: err.code,
            message: err.message,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to authorize upload.",
        },
      },
      { status: 500 }
    );
  }
}
