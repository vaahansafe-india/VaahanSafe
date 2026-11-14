import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { after } from "next/server";
import {
  resolvePublicQr,
  isQrVehicleChoice,
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
  searchParams?: Promise<{ vehicle?: string | string[] }>;
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
  searchParams,
}: QrResolverPageProps) {
  const { publicId } = await params;
  const choice = (await searchParams)?.vehicle;

  try {
    // 1. Authoritative Domain Resolution (Rule 06, 07, 87)
    const resolution = await resolvePublicQr(publicId, {
      repository: createSupabaseQrRepository(),
      vehicleChoice: isQrVehicleChoice(choice) ? choice : undefined,
    });
    if (resolution.vehicleChoices?.length) {
      return (
        <ResolverShell verified>
          <section className="space-y-4 rounded-xl border bg-card p-5">
            <h1 className="font-serif text-2xl">Which vehicle did you scan?</h1>
            <p className="text-sm text-muted-foreground">
              This VaahanSafe ID is shared. Choose the vehicle to open its safety profile.
            </p>
            {resolution.vehicleChoices.map(({ choice, label }) => (
              <a key={choice} href={`?vehicle=${choice}`}
                className="flex min-h-11 items-center rounded-lg border px-4 text-sm font-medium hover:bg-muted">
                {label}
              </a>
            ))}
          </section>
        </ResolverShell>
      );
    }

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
          undefined,
          resolution.vehicleChoice,
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
            vehicleId: resolution.resolvedVehicleId,
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
        {choice && <a href={`/${encodeURIComponent(publicId)}`} className="mb-4 inline-block text-sm underline">Back to QR vehicle selection</a>}
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
