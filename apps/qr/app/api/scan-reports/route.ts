import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import { getScanReportObjectStore } from "@vaahansafe/storage";
import {
  isValidPublicIdFormat,
  submitScanReport,
  ScanReportError,
  type ScanReportInput,
} from "@vaahansafe/qr-core";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const MAX_REQUEST = 3 * 1024 * 1024 + 32768;

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin)
      return NextResponse.json(
        { error: "Please send the report from the QR safety page." },
        { status: 403 },
      );
    if (!request.headers.get("content-type")?.startsWith("multipart/form-data"))
      return NextResponse.json({ error: "Invalid report." }, { status: 400 });
    if (
      Number(request.headers.get("content-length")) > MAX_REQUEST ||
      !request.body
    )
      return NextResponse.json(
        { error: "Please choose smaller photos." },
        { status: 413 },
      );
    // Bound bytes even for chunked uploads before parsing multipart.
    const reader = request.body.getReader(),
      chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > MAX_REQUEST) {
        await reader.cancel();
        return NextResponse.json(
          { error: "Please choose smaller photos." },
          { status: 413 },
        );
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    const form = await new Response(bytes, {
      headers: { "content-type": request.headers.get("content-type")! },
    }).formData();
    let input: ScanReportInput;
    try {
      input = JSON.parse(String(form.get("report")));
    } catch {
      return NextResponse.json({ error: "Invalid report." }, { status: 400 });
    }
    if (
      !input ||
      typeof input.publicId !== "string" ||
      !isValidPublicIdFormat(input.publicId)
    )
      return NextResponse.json({ error: "Invalid report." }, { status: 400 });
    const token = String(form.get("turnstileToken") || "");
    const secret = process.env.TURNSTILE_SECRET_KEY,
      hashKey = process.env.SESSION_SECRET;
    if (!secret || !hashKey || hashKey.length < 32)
      throw new Error("Report protection unavailable");
    const verification = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({ secret, response: token }),
        signal: AbortSignal.timeout(8000),
      },
    );
    const challenge = (await verification.json()) as {
      success?: boolean;
      hostname?: string;
      action?: string;
    };
    if (
      !verification.ok ||
      !challenge.success ||
      challenge.hostname !== new URL(request.url).hostname ||
      challenge.action !== "scan-report"
    ) {
      return NextResponse.json(
        { error: "Please complete the security check and try again." },
        { status: 403 },
      );
    }
    const photos = form.getAll("photos");
    if (photos.length > 3 || photos.some((p) => !(p instanceof File)))
      return NextResponse.json(
        { error: "Choose up to three photos." },
        { status: 400 },
      );
    input.photos = await Promise.all(
      (photos as File[]).map(async (p) => ({
        data: new Uint8Array(await p.arrayBuffer()),
        mimeType: p.type,
      })),
    );
    // Use only platform-provided client headers; raw addresses never enter the database.
    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
      "unavailable";
    const ipHash = createHmac("sha256", hashKey)
      .update(`${new Date().toISOString().slice(0, 10)}:${ip}`)
      .digest("hex");
    const result = await submitScanReport(input, {
      db: getAuthoritativeDatabaseClient(),
      store: getScanReportObjectStore(),
      ipHash,
    });
    return NextResponse.json(
      {
        ...result,
        message: "Your report is saved. The owner notification is queued.",
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof ScanReportError) {
      const status =
        error.code === "INVALID_REPORT"
          ? 400
          : error.code === "REPORT_COOLDOWN"
            ? 429
            : error.code === "REPORT_UNAVAILABLE"
              ? 404
              : 503;
      return NextResponse.json(
        {
          error:
            error.code === "REPORT_COOLDOWN"
              ? "A report was already submitted recently. Please wait five minutes before sending another."
              : error.code === "REPORT_RETRY"
                ? "Your report was not saved. Please wait five minutes, then try again."
                : error.code === "INVALID_REPORT"
                  ? "Please check your photos and location, then try again."
                  : "We couldn’t send this report right now. Please try again.",
          code: error.code,
        },
        { status },
      );
    }
    console.warn("[ScanReport] Report service unavailable");
    return NextResponse.json(
      { error: "We couldn’t send this report right now. Please try again." },
      { status: 503 },
    );
  }
}
