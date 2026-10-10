import React from "react";
import type { PublicQrResolution } from "@vaahansafe/qr-core";
import { ActiveSafetyView } from "../states/ActiveSafetyView";
import { ActivationAvailable } from "../states/ActivationAvailable";
import { ReplacedQrState } from "../states/ReplacedQrState";
import { UnavailableQrState } from "../states/UnavailableQrState";
import { BlockedQrState } from "../states/BlockedQrState";
import { UnknownQrState } from "../states/UnknownQrState";

export interface QrStateRouterProps {
  resolution: PublicQrResolution;
}

export function QrStateRouter({ resolution }: QrStateRouterProps) {
  switch (resolution.state) {
    case "SETUP_REQUIRED":
      return (
        <div className="w-full p-6 rounded-2xl border bg-card text-center space-y-5">
          <h1 className="text-xl font-serif">{resolution.meta.title}</h1>
          <p className="text-sm text-muted-foreground">
            {resolution.meta.subtitle}
          </p>
          <a
            className="min-h-[44px] flex items-center justify-center rounded-xl border"
            href={resolution.meta.safeNextAction.url}
          >
            {resolution.meta.safeNextAction.label}
          </a>
          <p className="text-xs">
            VaahanSafe ID: {resolution.visibleCode || resolution.publicId}
          </p>
        </div>
      );
    case "ACTIVE":
      return <ActiveSafetyView resolution={resolution} />;

    case "ACTIVATION_AVAILABLE":
      return (
        <ActivationAvailable
          publicId={resolution.publicId}
          visibleCode={resolution.visibleCode}
        />
      );

    case "REPLACED":
      return (
        <ReplacedQrState
          publicId={resolution.publicId}
          replacedByPublicId={resolution.replacedByPublicId}
        />
      );

    case "LOST_DAMAGED":
      return <UnavailableQrState publicId={resolution.publicId} />;

    case "BLOCKED":
      return <BlockedQrState publicId={resolution.publicId} />;

    case "UNKNOWN":
    default:
      return <UnknownQrState publicId={resolution.publicId} />;
  }
}
