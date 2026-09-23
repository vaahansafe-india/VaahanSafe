import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { resolvePublicQr, recordPublicScanEventSafely } from "@vaahansafe/qr-core";
import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import { ResolverShell } from "../../components/shell/ResolverShell";
import { QrStateRouter } from "../../components/resolver/QrStateRouter";
import { ResolverErrorState } from "../../components/states/ResolverErrorState";

interface QrResolverPageProps {
  params: Promise<{
    publicId: string;
  }>;
}

/**
 * Generic privacy-safe metadata for QR resolver routes (Rule 74)
 * NEVER leaks owner name, blood group, medical notes, or phone numbers in metadata/OG tags.
 */
export async function generateMetadata({ params }: QrResolverPageProps): Promise<Metadata> {
  const { publicId } = await params;
  const cleanId = typeof publicId === "string" ? publicId.trim() : "";
  const displayId = cleanId.startsWith("VS-") ? cleanId : `VS-${cleanId}`;

  return {
    title: `${displayId} — VaahanSafe Emergency Profile`,
    description: "Verified public vehicle emergency identification and contact relay.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function DynamicQrResolverPage({ params }: QrResolverPageProps) {
  const { publicId } = await params;
  const db = getAuthoritativeDatabaseClient();

  try {
    // 1. Authoritative Domain Resolution (Rule 06, 07, 87)
    const resolution = await resolvePublicQr(publicId, { db });

    // 2. Non-blocking Telemetry Logging (Rule 39, 40, 41)
    try {
      const reqHeaders = await headers();
      await recordPublicScanEventSafely({
        db,
        qrId: resolution.qrId || publicId,
        state: resolution.state,
        headers: reqHeaders,
      }).catch(() => {
        // Absorbed by design
      });
    } catch {
      // Headers read error safely ignored
    }

    // 3. Render State Router inside Dedicated Shell
    return (
      <ResolverShell>
        <QrStateRouter resolution={resolution} />
      </ResolverShell>
    );
  } catch (err) {
    // Database or infrastructure failure (Rule 52, 54)
    // NEVER show "QR NOT FOUND" on infrastructure interruption
    console.error("[VaahanSafe QR Resolver Error]:", err);

    return (
      <ResolverShell>
        <ResolverErrorState />
      </ResolverShell>
    );
  }
}
