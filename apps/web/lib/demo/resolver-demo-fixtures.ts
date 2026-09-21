/**
 * VAAHANSAFE RESOLVER DEMO FIXTURES
 *
 * Provides simulated, strictly synthetic previews of the 4 public QR states:
 * - ACTIVE: Valid emergency safety projection with approved contacts
 * - UNACTIVATED: Recognized factory sticker awaiting scratch activation
 * - REPLACED: Retired/replaced sticker with zero private data exposed
 * - INVALID: Unrecognized QR identifier
 *
 * INVARIANTS:
 * 1. Zero real customer records or production database connections.
 * 2. Plaintext scratch codes are NEVER present in demo fixtures.
 * 3. Replaced demo never reveals the replacement's public locator.
 */

export interface ActiveResolverDemo {
  status: "ACTIVE";
  publicId: string;
  visibleCode: string;
  vehicle: {
    display: string;
    type: "CAR" | "MOTORCYCLE";
    registrationMasked: string;
    fuelType: string;
    color: string;
  };
  emergency: {
    ownerDisplayName: string;
    bloodGroup?: string;
    safetyNotes?: string;
    contacts: Array<{
      name: string;
      relationship: string;
      maskedPhone: string;
      isPriority: boolean;
      allowCall: boolean;
      allowMessage: boolean;
    }>;
  };
  telemetry: {
    relayProtected: boolean;
    verifiedAt: string;
  };
}

export interface UnactivatedResolverDemo {
  status: "UNACTIVATED";
  publicId: string;
  visibleCode: string;
  batchReference: string;
  message: string;
  activationInstructions: string;
}

export interface ReplacedResolverDemo {
  status: "REPLACED";
  publicId: string;
  visibleCode: string;
  message: string;
  safetyNotice: string;
  retiredAt: string;
}

export interface InvalidResolverDemo {
  status: "INVALID";
  publicId: string;
  message: string;
  guidance: string;
}

export type ResolverDemoState =
  | ActiveResolverDemo
  | UnactivatedResolverDemo
  | ReplacedResolverDemo
  | InvalidResolverDemo;

export const RESOLVER_DEMO_FIXTURES: Record<
  "ACTIVE" | "UNACTIVATED" | "REPLACED" | "INVALID",
  ResolverDemoState
> = {
  ACTIVE: {
    status: "ACTIVE",
    publicId: "7F3K9021",
    visibleCode: "VS-7F3K-9021",
    vehicle: {
      display: "Tata Safari (Dark Edition)",
      type: "CAR",
      registrationMasked: "DL 01 •••• 9021",
      fuelType: "Diesel",
      color: "Oberon Black",
    },
    emergency: {
      ownerDisplayName: "Ramesh K.",
      bloodGroup: "O+",
      safetyNotes: "No critical drug allergies. Penicillin safe. Emergency contacts notified on scan.",
      contacts: [
        {
          name: "Sunita Kumar",
          relationship: "Spouse",
          maskedPhone: "+91 ••••• ••001",
          isPriority: true,
          allowCall: true,
          allowMessage: true,
        },
        {
          name: "Amit Kumar",
          relationship: "Brother",
          maskedPhone: "+91 ••••• ••002",
          isPriority: false,
          allowCall: true,
          allowMessage: true,
        },
      ],
    },
    telemetry: {
      relayProtected: true,
      verifiedAt: "Live Edge Sync (D1 Singapore)",
    },
  },

  UNACTIVATED: {
    status: "UNACTIVATED",
    publicId: "8M2P4510",
    visibleCode: "VS-8M2P-4510",
    batchReference: "BAT/VS/2026/001",
    message: "Authentic VaahanSafe sticker recognized — awaiting owner activation.",
    activationInstructions:
      "This sticker has not yet been linked to a vehicle. If you purchased this unit at a retail counter, gently scratch off the silver security coating on your packaging and visit activate.vaahansafe.com.",
  },

  REPLACED: {
    status: "REPLACED",
    publicId: "2B9C1100",
    visibleCode: "VS-2B9C-1100",
    message: "This physical QR sticker has been authoritatively retired and replaced.",
    safetyNotice:
      "For privacy and security, emergency contact relays and vehicle details are no longer projected from this older unit. The vehicle remains fully protected under the owner's active replacement sticker.",
    retiredAt: "Retired 90 days ago",
  },

  INVALID: {
    status: "INVALID",
    publicId: "VS-UNKNOWN-0000",
    message: "QR identifier not recognized in the VaahanSafe security registry.",
    guidance:
      "Ensure you are scanning an authentic, undamaged VaahanSafe vehicle safety QR. If this is an authentic sticker, contact support for registry reconciliation.",
  },
};
