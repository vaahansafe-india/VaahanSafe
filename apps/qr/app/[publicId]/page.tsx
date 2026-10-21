import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { after } from "next/server";
import {
  resolvePublicQr,
  recordPublicScanEventSafely,
} from "@vaahansafe/qr-core";
import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import { ResolverShell } from "../../components/shell/ResolverShell";
import { QrStateRouter } from "../../components/resolver/QrStateRouter";
import { ResolverErrorState } from "../../components/states/ResolverErrorState";
import { createSupabaseQrRepository } from "../../lib/supabase-resolver";
import { createScanLocationTicket } from "../../lib/scan-location-ticket";
import { ScanLocationGate } from "../../components/location/ScanLocationGate";

export const dynamic = "force-dynamic";

interface QrResolverPageProps {
  params: Promise<{
    publicId: string;
  }>;
}

/**
 * Generic privacy-safe metadata for QR resolver routes (Rule 74)
 * NEVER leaks owner name, blood group, medical notes, or phone numbers in metadata/OG tags.
 */
export async function generateMetadata({
  params,
}: QrResolverPageProps): Promise<Metadata> {
  const { publicId } = await params;
  const cleanId = typeof publicId === "string" ? publicId.trim() : "";
  const displayId = cleanId.startsWith("VS-") ? cleanId : `VS-${cleanId}`;

  return {
    title: `${displayId} — VaahanSafe Emergency Profile`,
    description:
      "Verified public vehicle emergency identification and contact relay.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function DynamicQrResolverPage({
  params,
}: QrResolverPageProps) {
  const { publicId } = await params;

  try {
    // 1. Authoritative Domain Resolution (Rule 06, 07, 87)
    const resolution = await resolvePublicQr(publicId, {
      repository: createSupabaseQrRepository(),
    });

    // 2. Non-blocking Telemetry Logging (Rule 39, 40, 41)
    const reqHeaders = new Headers(await headers());
    const eventId = `qse_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    let locationTicket = "";
    if (resolution.state === "ACTIVE" && resolution.qrId) {
      try {
        locationTicket = createScanLocationTicket(
          eventId,
          resolution.qrId,
          resolution.publicId,
        );
      } catch {
        console.warn("[QR location] Scan protection unavailable");
      }
    }
    if (resolution.qrId)
      after(async () => {
        try {
          await recordPublicScanEventSafely({
            db: getAuthoritativeDatabaseClient(),
            qrId: resolution.qrId!,
            state: resolution.state,
            headers: reqHeaders,
            eventId,
          });
        } catch {
          console.warn("[VaahanSafe QR] Scan telemetry unavailable");
        }
      });

    // 3. Render State Router inside Dedicated Shell
    return (
      <ResolverShell verified={resolution.state === "ACTIVE"}>
        {resolution.state === "ACTIVE" ? (
          <ScanLocationGate ticket={locationTicket}>
            <QrStateRouter resolution={resolution} />
          </ScanLocationGate>
        ) : (
          <QrStateRouter resolution={resolution} />
        )}
      </ResolverShell>
    );
  } catch (err) {
    // Database or infrastructure failure (Rule 52, 54)
    // NEVER show "QR NOT FOUND" on infrastructure interruption
    console.error(
      "[VaahanSafe QR Resolver Error]:",
      err instanceof Error ? err.message : "SERVICE_UNAVAILABLE",
    );

    return (
      <ResolverShell>
        <ResolverErrorState />
      </ResolverShell>
    );
  }
}
