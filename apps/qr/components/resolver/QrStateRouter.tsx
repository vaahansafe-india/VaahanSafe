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
